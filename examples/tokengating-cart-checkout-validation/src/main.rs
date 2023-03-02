use std::str::FromStr;

use shopify_function::prelude::*;
use shopify_function::Result;

use hex;
use hmac::NewMac;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

use output::FunctionError;

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

#[derive(Clone, Debug, Deserialize)]
pub struct GateReaction {
    pub name: String,
    pub purchase_limit: StringNumberOrNumber,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum StringNumberOrNumber {
    StringNumber(String),
    Number(i64),
}

impl TryInto<i64> for StringNumberOrNumber {
    type Error = <i64 as FromStr>::Err;

    fn try_into(self) -> std::result::Result<i64, Self::Error> {
        match self {
            StringNumberOrNumber::Number(v) => Ok(v),
            StringNumberOrNumber::StringNumber(str) => Ok(i64::from_str(&str)?),
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

#[shopify_function]
fn function(input: input::ResponseData) -> Result<output::FunctionResult> {
    let cart_lines = input.cart.lines;
    let gate_context = parse_gate_context_from_cart_attribute(&input.cart.attribute);
    let mut errors = Vec::new();

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
                Some(ctx) => is_signature_valid(ctx, &gate_configuration),
                _ => false,
            };

            let gate_reaction: GateReaction =
                parse_gate_reaction_from_metafield(gate_configuration.metafield.as_ref());

            if !gate_unlocked {
                let error_message = format!(
                    "Drats! You don't have access to this product. It is gated!"
                );
                errors.push(FunctionError {
                    localized_message: error_message.to_owned(),
                    target: "cart".to_owned(),
                });
            } else {
                // Find the cart line that matches the product variant
                let line = cart_lines
                    .iter()
                    .find(|line| match &line.merchandise {
                        input::InputCartLinesMerchandise::ProductVariant(variant) => {
                            variant.id == product_variant.id
                        }
                        _ => false,
                    })
                    .unwrap();

                // Ensure purchase_limit is i64 - this is coming from a metafield and could be a string
                let purchase_limit: i64 = gate_reaction
                    .purchase_limit
                    .try_into()
                    .expect("Could not convert purchase limit to i64");

                // Add error if quantity is over purchase limit
                if line.quantity > purchase_limit {
                    let error_message = format!(
                        "Drats! You can only order {} with your Snowdevil token!",
                        purchase_limit
                    );
                    errors.push(FunctionError {
                        localized_message: error_message.to_owned(),
                        target: "cart".to_owned(),
                    });
                }
            }
        }
    }

    Ok(output::FunctionResult { errors })
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
        .unwrap()
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

#[cfg(test)]
mod tests;
