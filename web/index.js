// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import createGate from "./api/create-gate.js";
import retrieveGates from "./api/retrieve-gates.js";
import deleteGate from "./api/delete-gate.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { configurePublicApi } from "./public-api.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

app.use(express.json());
configurePublicApi(app);

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

app.get("/api/gates", async (_req, res) => {
  try {
    const response = await retrieveGates(res.locals.shopify.session);
    res.status(200).send({ success: true, response });
  } catch (e) {
    console.error("Failed to process gates/get:", e.message);
    res.status(500).send({ success: false, error: e.message });
  }
});

app.post("/api/gates", async (req, res) => {
  const { name, discountType, discount, segment, productGids } = req.body;

  try {
    await createGate({
      session: res.locals.shopify.session,
      name,
      discountType,
      discount,
      segment,
      productGids,
    });
    res.status(200).send({ success: true });
  } catch (e) {
    console.error("Failed to process gates/create:", e.message);
    res.status(500).send({ success: false, error: e.message });
  }
});

app.delete("/api/gates/:id", async (req, res) => {
  try {
    await deleteGate({
      session: res.locals.shopify.session,
      gateConfigurationGid: decodeURIComponent(req.params.id),
    });
    res.status(200).send({ success: true });
  } catch (e) {
    console.error("Failed to process gates/delete:", e.message);
    res.status(500).send({ success: false, error: e.message });
  }
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
