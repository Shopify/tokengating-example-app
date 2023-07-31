import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  HorizontalStack,
  Icon,
  Layout,
  Link,
  Page,
  PageActions,
  Text,
  TextField,
  Thumbnail,
  VerticalStack,
} from "@shopify/polaris";
import { CancelMinor, ImageMajor } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";
import createGate from "~/api/create-gate";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const tokengate = {
    discountType: "percentage",
  };

  return json(tokengate);
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const data = await request.json();

  await createGate(admin.graphql, data);

  return null;
};

export default function TokengateForm() {
  const errors = useActionData()?.errors || {};

  const tokengate = useLoaderData();
  const [formState, setFormState] = useState(tokengate);
  const [cleanFormState, setCleanFormState] = useState(tokengate);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const navigate = useNavigate();
  const nav = useNavigation();
  const isSaving = nav.state === "submitting" && nav.formMethod === "POST";

  const handleDiscountTypeButtonClick = useCallback(
    (discountType) => setFormState({ ...formState, discountType }),
    [formState]
  );

  const selectProducts = useCallback(async () => {
    const selected = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      selectionIds: formState.products,
    });

    if (selected?.selection) {
      const products = selected.selection.map(({ id, title, images }) => ({
        id,
        title,
        images,
      }));
      setFormState({ ...formState, products });
    }
  }, [formState]);

  const handleRemoveItem = useCallback(
    (id) => {
      const filteredProducts = formState.products.filter(
        (product) => product.id !== id
      );
      setFormState({ ...formState, products: filteredProducts });
    },
    [formState]
  );

  const submit = useSubmit();
  function handleSave() {
    const data = {
      name: formState.name,
      discount: formState.discount,
      discountType: formState.discountType,
      segment: formState.segment.split(/,\s*/),
      productGids: formState.products.map(({ id }) => id),
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post", encType: "application/json" });
  }

  useEffect(() => {
    if (isSaving) {
      shopify.toast.show("Tokengate created");
    }
  }, [isSaving]);

  return (
    <Page narrowWidth>
      <ui-title-bar
        title={tokengate.id ? "Edit Tokengate" : "Create new Tokengate"}
      >
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          Tokengates
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <VerticalStack gap="4">
            <Card>
              <VerticalStack gap="5">
                <Text as={"h2"} variant="headingMd">
                  Configuration
                </Text>
                <TextField
                  id="name"
                  label="Name"
                  autoComplete="off"
                  value={formState.name}
                  onChange={(name) => setFormState({ ...formState, name })}
                  error={errors.name}
                />
                <Divider />
                <VerticalStack gap="2">
                  <Text as={"p"} variant="bodyMd" fontWeight="semibold">
                    DISCOUNT PERK
                  </Text>
                  <HorizontalStack gap="4" align="start">
                    <ButtonGroup segmented>
                      <Button
                        pressed={formState.discountType === "percentage"}
                        onClick={() =>
                          handleDiscountTypeButtonClick("percentage")
                        }
                      >
                        Percentage
                      </Button>
                      <Button
                        pressed={formState.discountType === "amount"}
                        onClick={() => handleDiscountTypeButtonClick("amount")}
                      >
                        Fixed Amount
                      </Button>
                    </ButtonGroup>
                    <div style={{ flexGrow: 1 }}>
                      <TextField
                        align="right"
                        id="discount"
                        label="discount"
                        type="number"
                        labelHidden
                        autoComplete="off"
                        value={formState.discount}
                        suffix={
                          formState.discountType === "percentage" ? "%" : ""
                        }
                        onChange={(discount) =>
                          setFormState({ ...formState, discount })
                        }
                        error={errors.discount}
                      />
                    </div>
                  </HorizontalStack>
                </VerticalStack>
                <Divider />
                <VerticalStack gap="2">
                  <Text as={"p"} variant="bodyMd" fontWeight="semibold">
                    SEGMENT
                  </Text>
                  <TextField
                    id="segment"
                    label="Segment"
                    labelHidden
                    helpText="Comma separated list of contract addresses"
                    placeholder="0x123, 0x456, 0x789"
                    autoComplete="off"
                    value={formState.segment}
                    onChange={(segment) =>
                      setFormState({ ...formState, segment })
                    }
                    error={errors.segment}
                  />
                </VerticalStack>
              </VerticalStack>
            </Card>
            <Card>
              <VerticalStack gap="5">
                <HorizontalStack align="space-between">
                  <Text as={"h2"} variant="headingMd">
                    Applies to
                  </Text>
                  {formState.products?.length > 0 ? (
                    <Button plain onClick={selectProducts}>
                      Choose products
                    </Button>
                  ) : null}
                </HorizontalStack>
                {formState.products?.length > 0 ? (
                  <VerticalStack gap="2">
                    {formState.products.map(({ id, images, title }, index) => {
                      return (
                        <VerticalStack gap="2" key={index}>
                          {index > 0 ? <Divider /> : null}
                          <HorizontalStack
                            align="start"
                            blockAlign="center"
                            gap="5"
                          >
                            {images.length > 0 ? (
                              <Thumbnail
                                alt={images[0]?.altText}
                                source={images[0]?.originalSrc}
                                size="small"
                              ></Thumbnail>
                            ) : (
                              <Box
                                borderColor="border"
                                borderWidth="1"
                                borderRadius="1"
                                padding={"2"}
                              >
                                <Icon source={ImageMajor} />
                              </Box>
                            )}
                            <div style={{ flexGrow: 1 }}>
                              <Text as="span">{title}</Text>
                            </div>
                            <Link onClick={() => handleRemoveItem(id)}>
                              <Icon source={CancelMinor} />
                            </Link>
                          </HorizontalStack>
                        </VerticalStack>
                      );
                    })}
                  </VerticalStack>
                ) : (
                  <HorizontalStack align="center">
                    <Button onClick={selectProducts}>Choose products</Button>
                  </HorizontalStack>
                )}
              </VerticalStack>
            </Card>
          </VerticalStack>
          <PageActions
            primaryAction={{
              content: "Save",
              disabled: !isDirty || isSaving,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
