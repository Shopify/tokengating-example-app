import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Button,
  ButtonGroup,
  Card,
  Divider,
  HorizontalStack,
  Layout,
  Page,
  PageActions,
  Tag,
  Text,
  TextField,
  VerticalStack,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const tokengate = {};

  return json(tokengate);
};

export default function TokengateForm() {
  const errors = useActionData()?.errors || {};

  const tokengate = useLoaderData();
  const [formState, setFormState] = useState(tokengate);
  const [cleanFormState, setCleanFormState] = useState(tokengate);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === "submitting" && nav.formMethod === "POST";
  const isDeleting = nav.state === "submitting" && nav.formMethod === "DELETE";

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
      const products = selected.selection.map(({ id, title }) => ({
        id,
        title,
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
      segment: formState.segment,
      products: formState.products,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page narrowWidth>
      <ui-title-bar
        title={tokengate.id ? "Edit Tokengate" : "Create new Tokengate"}
      >
        <Link variant="breadcrumb" to="/app/tokengates">
          Tokengates
        </Link>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <VerticalStack gap="5">
            <Card>
              <VerticalStack gap="5">
                <Text as={"h2"} variant="headingLg">
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
                <VerticalStack gap="1">
                  <Text as={"p"} variant="bodyMd" fontWeight="bold">
                    DISCOUNT PERK
                  </Text>
                  <HorizontalStack gap="5" align="start">
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
                <VerticalStack gap="1">
                  <Text as={"p"} variant="bodyMd" fontWeight="bold">
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
                  <Text as={"h2"} variant="headingLg">
                    Applies to
                  </Text>
                  {formState.products?.length > 0 ? (
                    <Button onClick={selectProducts}>Change products</Button>
                  ) : null}
                </HorizontalStack>
                {formState.products?.length > 0 ? (
                  <HorizontalStack gap="2">
                    {formState.products.map(({ id, title }, index) => {
                      return (
                        <Tag key={index} onRemove={() => handleRemoveItem(id)}>
                          {title}
                        </Tag>
                      );
                    })}
                  </HorizontalStack>
                ) : (
                  <HorizontalStack align="center">
                    <Button onClick={selectProducts}>Choose products</Button>
                  </HorizontalStack>
                )}
              </VerticalStack>
            </Card>
          </VerticalStack>
          <PageActions
            secondaryActions={
              tokengate.id
                ? [
                    {
                      content: "Delete",
                      loading: isDeleting,
                      disabled: isSaving || isDeleting,
                      destructive: true,
                      outline: true,
                      onAction: () => submit({}, { method: "delete" }),
                    },
                  ]
                : []
            }
            primaryAction={{
              content: "Save",
              disabled: !isDirty || isSaving || isDeleting,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
