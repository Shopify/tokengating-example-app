use std::str::FromStr;

use shopify_function::prelude::*;
use shopify_function::Result;

use hex;
use hmac::NewMac;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

generate_types!(
    query_path = "./input.graphql",
    schema_path = "./schema.graphql"
);

const SECRET_KEY: &str = "secret-key"; // This should be a secret key that is shared between the app and the function

#[derive(Clone, Debug, Deserialize)]
pub struct GateContextItem {
    pub id: Option<ID>,
    pub hmac: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Default)]
pub struct GateReaction {
    pub name: String,
    pub discount: Discount,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Discount {
    Percentage { value: StringNumberOrNumber },
    Amount { value: StringNumberOrNumber },
}

impl Default for Discount {
    fn default() -> Self {
        Discount::Percentage {
            value: StringNumberOrNumber::Number(0.0f64),
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum StringNumberOrNumber {
    StringNumber(String),
    Number(f64),
}

impl TryInto<f64> for StringNumberOrNumber {
    type Error = <f64 as FromStr>::Err;

    fn try_into(self) -> std::result::Result<f64, Self::Error> {
        match self {
            StringNumberOrNumber::Number(v) => Ok(v),
            StringNumberOrNumber::StringNumber(str) => Ok(f64::from_str(&str)?),
        }
    }
}

impl ToString for StringNumberOrNumber {
    fn to_string(&self) -> String {
        match self {
            StringNumberOrNumber::Number(v) => v.to_string(),
            StringNumberOrNumber::StringNumber(str) => str.clone(),
        }
    }
}

const NO_DISCOUNT: output::FunctionResult = output::FunctionResult {
    discounts: vec![],
    discount_application_strategy: output::DiscountApplicationStrategy::MAXIMUM,
};

#[shopify_function]
fn function(input: input::ResponseData) -> Result<output::FunctionResult> {
    let cart_lines = input.cart.lines;
    let gate_context = parse_gate_context_from_cart_attribute(&input.cart.attribute);
    let discount_gate_configuration_id = input.discount_node.metafield.unwrap().value;

    if cart_lines.is_empty() || gate_context.is_empty() {
        return Ok(NO_DISCOUNT);
    }

    let mut targets: Vec<output::Target> = vec![];
    let mut gate_reaction: GateReaction = GateReaction::default();

    let product_variants = cart_lines.iter().flat_map(|line| {
        // Merchandise is a union type, so we need to match on the variant
        match &line.merchandise {
            input::InputCartLinesMerchandise::ProductVariant(variant) => Some(variant),
            _ => None,
        }
    });

    for product_variant in product_variants {
        for gate_subject in &product_variant.product.gates {
            let gate_configuration = &gate_subject.configuration;
            let gate_context_item = gate_context.iter().find(|gate_context_item| {
                gate_context_item.id == Some(gate_configuration.id.to_string())
            });
            let gate_unlocked = match &gate_context_item {
                Some(ctx) => {
                    is_signature_valid(ctx, &gate_configuration)
                        && gate_configuration.id == discount_gate_configuration_id
                }
                _ => false,
            };

            if gate_unlocked {
                gate_reaction =
                    parse_gate_reaction_from_metafield(gate_configuration.metafield.as_ref());

                targets.push(output::Target {
                    product_variant: Some(output::ProductVariantTarget {
                        id: product_variant.id.to_string(),
                        quantity: None,
                    }),
                });
            }
        }
    }

    if targets.is_empty() {
        return Ok(NO_DISCOUNT);
    }

    let value = reaction_value(gate_reaction.clone());
    let message = Some(gate_reaction.name);

    Ok(output::FunctionResult {
        discounts: vec![output::Discount {
            message: message,
            targets: targets,
            value: value,
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::MAXIMUM,
    })
}

fn parse_gate_context_from_cart_attribute(
    attribute: &Option<input::InputCartAttribute>,
) -> Vec<GateContextItem> {
    attribute
        .as_ref()
        .and_then(|a| a.value.as_ref())
        .map(|value| serde_json::from_str(&value).unwrap_or_default())
        .unwrap_or_else(|| vec![])
}

fn parse_gate_reaction_from_metafield(
    metafield: Option<
        &input::InputCartLinesMerchandiseOnProductVariantProductGatesConfigurationMetafield,
    >,
) -> GateReaction {
    metafield
        .map(|metafield| serde_json::from_str(metafield.value.as_str()).unwrap())
        .unwrap_or_default()
}

fn is_signature_valid(
    gate_context_item: &GateContextItem,
    gate_configuration: &input::InputCartLinesMerchandiseOnProductVariantProductGatesConfiguration,
) -> bool {
    let hmac = match &gate_context_item.hmac {
        Some(hmac) => hmac,
        _ => return false,
    };

    let message = &gate_configuration.id;
    let signature = hmac_signature(SECRET_KEY, message);

    &signature == hmac
}

fn hmac_signature(key: &str, msg: &str) -> String {
    type HmacSha256 = Hmac<Sha256>;

    let mut mac = HmacSha256::new_from_slice(key.as_bytes()).unwrap();
    mac.update(&msg.as_bytes());

    let code_bytes = mac.finalize().into_bytes();

    return hex::encode(&code_bytes.to_vec());
}

fn reaction_value(reaction: GateReaction) -> output::Value {
    match reaction.discount {
        Discount::Percentage { value } => {
            return output::Value {
                percentage: Some(output::Percentage {
                    value: value.to_string(),
                }),
                fixed_amount: None,
            }
        }
        Discount::Amount { value } => {
            return output::Value {
                percentage: None,
                fixed_amount: Some(output::FixedAmount {
                    applies_to_each_item: None,
                    amount: value.to_string(),
                }),
            }
        }
    };
}

#[cfg(test)]
mod tests;
