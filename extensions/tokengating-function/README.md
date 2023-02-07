# Shopify Function development with Rust

## Dependencies

- [Install Rust](https://www.rust-lang.org/tools/install)
  - On Windows, Rust requires the [Microsoft C++ Build Tools](https://docs.microsoft.com/en-us/windows/dev-environment/rust/setup). Be sure to select the _Desktop development with C++_ workload when installing them.
- Install [`cargo-wasi`](https://bytecodealliance.github.io/cargo-wasi/)
  - `cargo install cargo-wasi`

## Building the function

You can build this individual function using `cargo wasi`.

```shell
cargo wasi build --release
```

The Shopify CLI `build` command will also execute this, based on the configuration in `shopify.function.extension.toml`.

## Testing the function

You can test this individual function using `cargo test`.

```shell
cargo test
```

The Shopify CLI `build` command will also execute this, based on the configuration in `shopify.function.extension.toml`.

## Troubleshooting

There is currently an issue building using rust 1.67, the current stable version as of the time of
this writing. Instead, stick to 1.66 for now.

```
rustup install 1.66
rustup default 1.66
```
