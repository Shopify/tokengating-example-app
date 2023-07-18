# Tokengating Example App


## Requirements

* This app requires a new `gates` object in Liquid that is only as early access. Please contact blockchain-partners@shopify.com with your `.myshopify.com` shop domain for access

## Quick Start Guide

1. Clone the [tokengating example app](https://github.com/Shopify/tokengating-example-app).
1. Go to the app's root directory in your terminal and run `npm install` to download all the dependencies
1. Install [Rust](https://www.rust-lang.org/tools/install) and [`cargi-wasi`](https://bytecodealliance.github.io/cargo-wasi/install.html)
3. Run `npm run dev`. The terminal will prompt you with Create this project as a new app on Shopify?, select yes
4. Enter a name for your app or accept the default
5. Your local server should be running now and you should see a "Shareable app URL" on your terminal. Copy `https://YOUR_NGROK_URL.ngrok.io` and replace `YOUR_NGROK_URL` in `/extensions/tokengate-src/src/useEvaluateGate.js`
6. While your app is running, in a separate terminal window run `npm --prefix extensions/tokengate-src run build` to include these changes to your build
7. Run `npm run deploy` to deploy your app
8. Install the app on your development store by visiting the "Shareable app URL" that was logged to your terminal.
9. Navigate to your app in your [partners page](https://partners.shopify.com) and enable the theme app extension. There's a shortcut in your local server logs.
10. You can now add the theme app extension to your Online Store's theme. There's a shortcut in your local server logs for this as well, under "Setup your theme app extension in the host theme". At the top of the theme editor, select a page under "Products" and add your theme app extension's block under "Product information".
11. Within the partner's page, if you navigate to the tokengating-function extension, you will see the function's ID in the "Function details" section. It's also part of the URL when you're on the tokengating-function page. Copy that ID and replace `YOUR_FUNCTION_ID` in `/web/api/create-discount.js`.

### Tokengating in action

1. Go to the app on your development store by visiting the "Shareable app URL" from your server log. Create a gate with a discount of your choice.
1. Once the gate is created you can visit your admin's Discount page to verify that it exists there.
1. Now you can visit your Online Store by visiting the URL logged in your terminal under "Preview your theme app extension". Go to the gated product and connect your wallet to unlock the gate. Add the item to your cart. If you view the cart details, you will see that the discount you created has been applied.
1. Your app has attested that any connected wallet will unlock the gate. This attestation is a cart attribute with the key `_shopify_gate_context` and can be viewed at the URL: `your-shop-domain.myshopify.com/cart.json`. As app developers, you have complete control over the gate requirements and the logic involved in determining if a gate should be unlocked.

If you'd like a step-by-step tutorial on how to build this app, check out our [tutorial series](https://shopify.dev/apps/blockchain/tokengating/build-a-tokengating-app).

## More Resources

- [Read more about tokengating](https://shopify.dev/apps/blockchain/tokengating)
- [Gate objects in GraphQL Admin API](https://shopify.dev/api/admin-graphql/unstable/objects/GateConfiguration)
- [Gate objects in Shopify Functions](https://shopify.dev/api/functions/reference/product-discounts/graphql/common-objects/gatesubject)
- [Read more about `@shopify/connect-wallet`](https://shopify.dev/docs/api/blockchain/components/connect-wallet)
- [Read more about `@shopify/tokengate`](https://shopify.dev/docs/api/blockchain/components/tokengate)

## Contributing

For help on setting up the repository locally, building, testing and contributing please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Code of conduct

All developers who wish to contribute through code or issues, please first read our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Copyright © 2023 Shopify. See [LICENSE](LICENSE.md) for further details.
