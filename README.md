<img src="https://raw.githubusercontent.com/eclipse-zenoh/zenoh/master/zenoh-dragon.png" height="150">

> :warning: **This is a WIP Active development project**: Experiment with with it, but it is **Not** production Ready!  

[![Discord](https://img.shields.io/badge/chat-on%20discord-blue)](https://discord.gg/2GJ958VuHs)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Eclipse Zenoh Typescript / Javascript API

The Eclipse Zenoh: Zero Overhead Pub/sub, Store/Query and Compute.

Zenoh (pronounce _/zeno/_) unifies data in motion, data at rest and computations. It carefully blends traditional pub/sub with geo-distributed storages, queries and computations, while retaining a level of time and space efficiency that is well beyond any of the mainstream stacks.

Check the website [zenoh.io](http://zenoh.io) and the [roadmap](https://github.com/eclipse-zenoh/roadmap) for more detailed information.

-------------------------------
# Typescript/Javascript API

This repository provides a Typscript / Javascript binding based [zenoh-pico], a pico variant of zenoh written in C aimed at resource constrained systems (i.e. Micro controllers).  
The long term plan is to use zenoh [Zenoh written in Rust](https://github.com/eclipse-zenoh/zenoh) to target WASM.   
In its current state, it is not possible to compile Zenoh (Rust) to target WASM, and will need to undergo a fair amount of refactoring before that can happen.

-------------------------------
## How to build it

> :warning: **WARNING** :warning: : Zenoh and its ecosystem are under active development. When you build from git, make sure you also build from git any other Zenoh repository you plan to use (e.g. binding, plugin, backend, etc.). It may happen that some changes in git are not compatible with the most recent packaged Zenoh release (e.g. deb, docker, pip). We put particular effort in maintaining compatibility between the various git repositories in the Zenoh project.

1. Make sure that the following utilities are available on your platform. 
 - [Docker](https://www.docker.com/), Please check [here](https://docs.docker.com/engine/install/) to learn how to install it.
 - [NPM](https://www.npmjs.com/package/npm)
 - Typescript 

2. Clone the [source] with `git`:

   ```bash
   git clone --recurse-submodules https://github.com/ZettaScaleLabs/zenoh-ts.git
   ```
   This also clones [zenoh-pico]  according to the `.gitmodules` file. 

3. Build:

    While in active development, running the command
  ```bash
    cd /zenoh-ts
  ```
  then  

  ```bash
    npm run clean_build_package
  ```

  Will run the build pipeline of 
  - Starting a Docker container containing the [Emscripten-SDK](https://emscripten.org/)
  - Building [zenoh-pico] to target WASM, using CMake + the Emscripten toolchain
  - Copying the artifacts from the build container to the host system
  - The artifacts include:
    - `zenoh-wasm.js`
    - `zenoh-wasm.wasm`
    - `zenoh-wasm.worker.js`
  - The compiling the typescript interface to Javascript, and exporting a types declaration file.
  - Webpack to package


[source]: https://github.com/ZettaScale-Labs/zenoh-ts.git
[zenoh-pico]:https://github.com/eclipse-zenoh/zenoh-pico

## Running the Examples

  Our Example structure, will have a pub/sub pair in the browser periodically putting,
  and a pub/sub pair locally on the command line to match, 

  In order to run the examples, the user must:

  1. From the `./examples/web/` directory, start an instance of the web application.
```bash
npm install && npm run develop
```

  2. Start an instance of `zenohd` with the websocket transport enabled.
  This can be done by building the zenoh daemon `zenohd` from [zenoh], and running the command.

```
RUST_LOG=DEBUG ./zenohd -l tcp/[::]:7447 -l ws/[::]:10000
```
  
<!-- 
RUST_LOG=DEBUG cargo run zenohd -- -l tcp/[::]:7447 -l ws/[::]:10000
-->

Then starting an instance of a zenoh subscriber locally

```
RUST_LOG=DEBUG ./z_sub -k demo/recv/from/ts
```

Then starting an instance of a zenoh Publisher locally

```
RUST_LOG=DEBUG ./z_pub -k demo/send/to/ts
```


<!-- cargo run --release --example z_sub -- -k demo/ts/** -->
<!-- -k demo/rcv_from_ts/* -->

[zenoh]: https://github.com/eclipse-zenoh/zenoh

<!-- 
## API conventions
Many of the types exposed by the `zenoh-c` API are types for which destruction is necessary. To help you spot these types, we named them with the convention that  any destructible type must start by `z_owned`.

For maximum performance, we try to make as few copies as possible. Sometimes, this implies moving data that you `z_owned`. Any function that takes a non-const pointer to a `z_owned` type will perform its destruction. To make this pattern more obvious, we encourage you to use the `z_move` macro instead of a simple `&` to create these pointers. Rest assured that all `z_owned` types are double-free safe, and that you may check whether any `z_owned_X_t` typed value is still valid by using `z_X_check(&val)`, or the `z_check(val)` macro if you're using C11.

We hope this convention will help you streamline your memory-safe usage of zenoh, as following it should make looking for leaks trivial: simply search for paths where a value of a `z_owned` type hasn't been passed to a function using `z_move`.

Functions that simply need to borrow your data will instead take values of the associated `z_X_t` type. You may construct them using `z_X_loan(&val)` (or the `z_loan(val)` generic macro with C11).

Note that some `z_X_t` typed values can be constructed without needing to `z_borrow` their owned variants. This allows you to reduce the amount of copies realized in your program.

The examples have been written with C11 in mind, using the conventions we encourage you to follow.

Finally, we strongly advise that you refrain from using structure field that starts with `_`:
* We try to maintain a common API between `zenoh-c` and [`zenoh-pico`](https://github.com/eclipse-zenoh/zenoh-pico), such that porting code from one to the other is, ideally, trivial. However, some types must have distinct representations in either library, meaning that using these representations explicitly will get you in trouble when porting.
* We reserve the right to change the memory layout of any type which has `_`-prefixed fields, so trying to use them might cause your code to break on updates.

## Logging
By default, zenoh-c enables Zenoh's logging library upon using the `z_open` or `z_scout` functions. This behavior can be disabled by adding `-DDISABLE_LOGGER_AUTOINIT:bool=true` to the `cmake` configuration command. The logger may then be manually re-enabled with the `zc_init_logger` function.

## Cross-Compilation
* The following alternative options have been introduced to facilitate cross-compilation.
> :warning: **WARNING** :warning: : Perhaps additional efforts are necessary, that will depend of your environment.

- `-DZENOHC_CARGO_CHANNEL=nightly|beta|stable`: refers to a specific rust toolchain release [`rust-channels`] https://rust-lang.github.io/rustup/concepts/channels.html
- `-DZENOHC_CARGO_FLAGS`: several optional flags can be used for compilation. [`cargo flags`] https://doc.rust-lang.org/cargo/commands/cargo-build.html
- `-DZENOHC_CUSTOM_TARGET`: specifies a crosscompilation target. Currently rust support several Tire-1, Tire-2 and Tire-3 targets [`targets`] https://doc.rust-lang.org/nightly/rustc/platform-support.html. But keep in mind that zenoh-c only have support for following targets: `aarch64-unknown-linux-gnu`, `x86_64-unknown-linux-gnu`, `arm-unknown-linux-gnueabi`

Lets put all together in an example:
Assuming you want to crosscompile for aarch64-unknown-linux-gnu.

1. install required packages
  - `sudo apt install gcc-aarch64-linux-gnu`
2. *(Only if you use `nightly` ) 
  - `rustup component add rust-src --toolchain nightly`
3. Compile Zenoh-C. Assume that it's in 'zenoh-c' directory. Notice that build in this sample is performed outside of source directory
  ```bash
  $ export RUSTFLAGS="-Clinker=aarch64-linux-gnu-gcc -Car=aarch64-linux-gnu-ar"
  $ mkdir -p build && cd build
  $ cmake ../zenoh-c  -DZENOHC_CARGO_CHANNEL=nightly -DZENOHC_CARGO_FLAGS="-Zbuild-std=std,panic_abort" -DZENOHC_CUSTOM_TARGET="aarch64-unknown-linux-gnu" -DCMAKE_INSTALL_PREFIX=../aarch64/stage
  $ cmake --build . --target install
  ```
Additionally you can use `RUSTFLAGS` environment variable for lead the compilation.

If all goes right the building files will be located at:
`/path/to/zenoh-c/target/aarch64-unknown-linux-gnu/release`
and release files will be located at
`/path/to/zenoh-c/target/aarch64-unknown-linux-gnu/release`

## Zenoh features support (enabling/disabling protocols, etc)

It's necessary sometimes to build zenoh-c library with set of features different from default. For example: enable TCP and UDP only. This can be done by changing `ZENOHC_CARGO_FLAGS` parameter for cmake (notice ";" instead of space due to cmake peculiarities)

Available features can be found in zenoh sources: https://github.com/eclipse-zenoh/zenoh/blob/master/zenoh/Cargo.toml

```
cmake ../zenoh-c -DZENOHC_CARGO_FLAGS="--no-default-features;--features=zenoh/transport_tcp,zenoh/transport_udp"
```
 -->
