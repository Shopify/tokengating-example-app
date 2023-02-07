import { createHmac } from "crypto";
import cors from "cors";
import Web3 from "web3";

import { getContractAddressesFromGate } from "./api/gates.js";

const web3 = new Web3();

export function configurePublicApi(app) {
  // This should be limited to app domains that have your app installed
  const corsOptions = {
    origin: "*",
  };

  // Configure CORS to allow requests to /public from any origin
  // Enables pre-flight requests
  app.options("/public/*", cors(corsOptions));

  app.post("/public/gateEvaluation", cors(corsOptions), async (req, res) => {
    // Evaluate the gate, message, and signature
    const { shopDomain, productGid, address, message, signature, gateConfigurationGid } = req.body;

    // Verify signature
    const recoveredAddress = web3.eth.accounts.recover(message, signature);
    if (recoveredAddress !== address) {
      res.status(403).send("Invalid signature");
      return;
    }

    // Retrieve relevant contract addresses from gates
    const requiredContractAddresses = await getContractAddressesFromGate({shopDomain, productGid});

    // Lookup tokens
    const unlockingTokens = await retrieveUnlockingTokens(
      address,
      requiredContractAddresses
    );
    if (unlockingTokens.length === 0) {
      res.status(403).send("No unlocking tokens");
      return;
    }

    const payload = {
      id: gateConfigurationGid
    };

    const response = {gateContext: [getHmac(payload)], unlockingTokens};
    res.status(200).send(response);
  });
}

function getHmac(payload) {
  const hmacMessage = payload.id;
  const hmac = createHmac("sha256", "secret-key");
  hmac.update(hmacMessage);
  const hmacDigest = hmac.digest("hex");
  return {
    id: payload.id,
    hmac: hmacDigest,
  };
}

function retrieveUnlockingTokens(address, contractAddresses) {
  // This could be a lookup against a node or a 3rd party service like Alchemy
  return Promise.resolve([
    {
      name: "CryptoPunk #1719",
      imageUrl:
        "https://storage.cloud.google.com/shopify-blockchain-development/images/punk1719.png",
      collectionName: "CryptoPunks",
      collectionAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    },
  ]);
}
