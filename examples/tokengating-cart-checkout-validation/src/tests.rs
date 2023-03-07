use super::*;
use shopify_function::{run_function_with_input, Result};

#[test]
fn test_errors_without_valid_gate_context() -> Result<()> {
    let result = run_function_with_input(
        function,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"123\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 1,
                            "merchandise": {
                                "__typename": "ProductVariant",
                                "id": "gid://shopify/ProductVariant/1",
                                "product": {
                                    "id": "gid://shopify/Product/1",
                                    "gates": [
                                        {
                                            "id": "gid://shopify/GateSubject/1",
                                            "configuration": {
                                                "id": "gid://shopify/GateConfiguration/1",
                                                "appId": "tokengating-example-app",
                                                "metafield": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\",\"purchase_limit\": \"2\"}"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    let mut errors = Vec::new();
    errors.push(FunctionError {
        localized_message: "Drats! You don't have access to this product. It is gated!".to_owned(),
        target: "cart".to_owned(),
    });
    let expected = crate::output::FunctionResult { errors: errors };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_errors_with_quantity_over_limit() -> Result<()> {
    let result = run_function_with_input(
        function,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 3,
                            "merchandise": {
                                "__typename": "ProductVariant",
                                "id": "gid://shopify/ProductVariant/1",
                                "product": {
                                    "id": "gid://shopify/Product/1",
                                    "gates": [
                                        {
                                            "id": "gid://shopify/GateSubject/1",
                                            "configuration": {
                                                "id": "gid://shopify/GateConfiguration/1",
                                                "appId": "tokengating-example-app",
                                                "metafield": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\",\"purchase_limit\": \"2\"}"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    let mut errors = Vec::new();
    errors.push(FunctionError {
        localized_message: "Drats! You can only order 2 with your Snowdevil token!".to_owned(),
        target: "cart".to_owned(),
    });
    let expected = crate::output::FunctionResult { errors: errors };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_no_errors_valid_gate_context() -> Result<()> {
    let result = run_function_with_input(
        function,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 1,
                            "merchandise": {
                                "__typename": "ProductVariant",
                                "id": "gid://shopify/ProductVariant/1",
                                "product": {
                                    "id": "gid://shopify/Product/1",
                                    "gates": [
                                        {
                                            "id": "gid://shopify/GateSubject/1",
                                            "configuration": {
                                                "id": "gid://shopify/GateConfiguration/1",
                                                "appId": "tokengating-example-app",
                                                "metafield": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\",\"purchase_limit\": \"2\"}"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    let errors = Vec::new();
    let expected = crate::output::FunctionResult { errors: errors };

    assert_eq!(result, expected);
    Ok(())
}
