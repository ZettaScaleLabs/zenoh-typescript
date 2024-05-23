// //
// // Copyright (c) 2023 ZettaScale Technology
// //
// // This program and the accompanying materials are made available under the
// // terms of the Eclipse Public License 2.0 which is available at
// // http://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
// // which is available at https://www.apache.org/licenses/LICENSE-2.0.
// //
// // SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
// //
// // Contributors:
// //   ZettaScale Zenoh Team, <zenoh@zettascale.tech>
// //

// // import Module from "./wasm/zenoh-wasm.js"

// // TODO : Clean up Any's with proper types
// /**
//  * Interface for Module, overwriting Module from zenoh-wasm.js
//  * and manually exposing only what we want to use in the bindings 
//  */
// // interface Module {
// //     HEAPU8: any;
// //     UTF8ToString(x: any): string,

// //     // Config
// //     zw_default_config(clocator: string): WasmPtr,
// //     // Session
// //     zw_open_session(config_ptr: WasmPtr): WasmPtr,
// //     zw_start_tasks(session_ptr: WasmPtr): number,
// //     zw_put(session_ptr: WasmPtr, key_expr_ptr: WasmPtr, value: Uint8Array): number,
// //     zw_close_session(session_ptr: WasmPtr): number,
// //     // Key Expr
// //     zw_declare_ke(session_ptr: WasmPtr, key_expr_str: string): number,
// //     zw_delete_ke(key_expr_ptr: WasmPtr): number,
// //     zw_make_ke(keyexpr_str: string): WasmPtr,
// //     // Subscruber
// //     zw_declare_subscriber(session_ptr: WasmPtr, key_expr_ptr: WasmPtr, fn: SubCallback): number,
// //     //  Publisher  
// //     zw_declare_publisher(session_ptr: WasmPtr, key_expr_ptr: WasmPtr): number,
// //     zw_publisher_put(publisher_ptr: WasmPtr, value: Uint8Array): number,
// //     zw_undeclare_publisher(publisher_ptr: WasmPtr): number,
// //     // Misc
// //     zw_version(): number,
// // }


// //  */
// // type WasmPtr = number;
// /**
//  * Subscriber Callback
//  */
// // type SubCallback = (keyexpr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => Promise<void>;

// /**
//  * Instance of Module
//  */
// // let mod_instance: Module;

// // import WebSocket from 'ws';

// import { SimpleChannel } from "channel-ts";

// class WrappedSocket {
//     // 
//     ws_internal: WebSocket;
//     // 
//     // connect(url: string): WebSocket {
//     //     return ws 
//     // }
//     // Indicates that the connection is ready to send and receive data
//     static onOpen(event: any): void {
//         console.log("connected");
//     }

//     // An event listener to be called when a message is received from the server
//     static onMessage(event: any): void {
//         console.log("Message from Server", event);
//     }
//     // An event listener to be called when an error occurs. This is a simple event named "error".
//     static onError(event: any): void {
//         console.log(JSON.stringify(event.data));
//     }
//     // An event listener to be called when the WebSocket connection's readyState changes to CLOSED.
//     static onClose(event: any): void {
//         console.log(JSON.stringify(event.data));
//     }
//     //
//     private constructor(wrapped_ws: WebSocket) {
//         this.ws_internal = wrapped_ws
//     }

//     static async new(locator: string): Promise<WrappedSocket> {
//         // TODO Check format of string
//         console.log("Open Websocket", locator)
//         // 
//         var ws: WebSocket = new WebSocket(locator);
//         ws.onopen = this.onOpen;
//         ws.onmessage = this.onMessage;
//         ws.onerror = this.onError;
//         ws.onclose = this.onClose;
//         return new WrappedSocket(ws)
//     }
// }



// export const intoSelector = Symbol("intoSelector")

// export interface IntoSelector {
//     [intoSelector]: () => Promise<Selector>
// }

// export const intoKeyExpr = Symbol("intoKeyExpr")
// /**
//  * Something that may be turned into a Key Expression.
//  * 
//  * Notable default implementers:
//  * - String
//  * - KeyExpr
//  */
// export interface IntoKeyExpr {
//     [intoKeyExpr]: () => Promise<KeyExpr>
// }

// export const intoValue = Symbol("intoValue")

// /**
//  * Something that may be turned into a Value.
//  * 
//  * Notable default implementers:
//  * - string
//  * - Uint8Array
//  */
// export interface IntoValue {
//     [intoValue]: () => Promise<Value>
// }

// /**
//  * Function to Initialize zenoh interface to WASM binary
//  */
// // export async function zenoh(): Promise<Module> {
// //     if (!mod_instance) {
// //         mod_instance = await Module();
// //     }
// //     return mod_instance
// // }

// //  ██████  ██████  ███    ██ ███████ ██  ██████  
// // ██      ██    ██ ████   ██ ██      ██ ██       
// // ██      ██    ██ ██ ██  ██ █████   ██ ██   ███ 
// // ██      ██    ██ ██  ██ ██ ██      ██ ██    ██ 
// //  ██████  ██████  ██   ████ ██      ██  ██████  

// export class Config {
//     /**
//      * The configuration for a Zenoh Session.
//      */
//     // __ptr: WasmPtr = 0
//     locator: string

//     private constructor(locator: string) {
//         this.locator = locator
//     }
//     static async new(locator: string): Promise<Config> {
//         // const Zenoh = await zenoh();
//         // const ptr = Zenoh.zw_default_config(locator);

//         // if (ptr === 0) {
//         //     throw "Failed to construct zenoh.Config";
//         // }

//         return new Config(locator)
//     }
// }


// // ██    ██  █████  ██      ██    ██ ███████ 
// // ██    ██ ██   ██ ██      ██    ██ ██      
// // ██    ██ ███████ ██      ██    ██ █████   
// //  ██  ██  ██   ██ ██      ██    ██ ██      
// //   ████   ██   ██ ███████  ██████  ███████ 

// // TODO : Add encoding prop later when we need it
// // Default to empty string
// export class Value {
//     /**
//     * Class to represent an Array of Bytes recieved from Zenoh
//     */
//     payload: Uint8Array

//     constructor(payload: Uint8Array) {
//         this.payload = payload
//     }

//     arr(): number {
//         return this.payload.length;
//     }

//     bytes_per_element(): number {
//         return this.payload.BYTES_PER_ELEMENT;
//     }

//     length(): number {
//         return this.payload.length;
//     }

//     [intoValue](): Promise<Value> { return Promise.resolve(this) }

//     empty(): Value {
//         return new Value(new Uint8Array());
//     }

//     new(payload: Uint8Array): Value {
//         return new Value(payload);
//     }

// }

// // ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████  
// // ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██ 
// // █████   █████     ████       █████     ███   ██████  ██████  
// // ██  ██  ██         ██        ██       ██ ██  ██      ██   ██ 
// // ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██ 

// export class KeyExpr implements IntoSelector {
//     /**
//      * Class to represent a Key Expression in Zenoh
//      * Key Expression is Allocated and Managed by Zenoh Pico
//      * this class only exists to keep track of pointer to WASM c-instance
//      */
//     // TODO: I hate the idea of this being accessible outside the class
//     // __ptr: WasmPtr;

//     // static registry: FinalizationRegistry<number> = new FinalizationRegistry((ptr: WasmPtr) => (new KeyExpr(ptr)).delete());

//     // 
//     [intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
//     [intoSelector](): Promise<Selector> { return Promise.resolve(new Selector(this)) }

//     constructor() {
//         // this.__ptr = ptr
//         // KeyExpr.registry.register(this, this.__ptr, this);
//     }
//     // private async delete() {
//     // const Zenoh = await zenoh();
//     // Zenoh.zw_delete_ke(this.__ptr); // delete the C ptr
//     // KeyExpr.registry.unregister(this); // make sure we aren't called again
//     // }

//     static async new(keyexpr: string): Promise<KeyExpr> {

//         // const Zenoh = await zenoh();

//         // const ptr: WasmPtr = await Zenoh.zw_make_ke(keyexpr);
//         // if (ptr === 0) {
//         // throw "Failed to construct zenoh.KeyExpr"
//         // }
//         return new KeyExpr()
//     }

// }

// /**
//  * Mutate global Types String, Uint8Array to implement interfaces:
//  * Notable default implementers: 
//  *    IntoKeyExpr, IntoValue,
//  */
// Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
//     return KeyExpr.new(this)
// })

// /**
//  * Makes sure that string is UTF8, gives you blob and encoding.
//  */
// Object.defineProperty(String.prototype, intoValue, function (this: string) {
//     const encoder = new TextEncoder();
//     const encoded = encoder.encode(this);
//     return Promise.resolve(new Value(encoded))
// })

// /**
//  * Apply Uint8Array to intoValue
//  */
// Object.defineProperty(Uint8Array.prototype, intoValue, function (this: Uint8Array) {
//     return Promise.resolve(new Value(this))
// })

// Object.defineProperty(Function.prototype, "onEvent", function (this: Function) {
//     return this;
// })

// Object.defineProperty(Function.prototype, "onClose", function (this: Function) { })

// // Applies Globally Interface Extension for  String,Uint8Array
// // declare global {
// //     interface String extends IntoKeyExpr, IntoValue { }
// //     interface Uint8Array extends IntoValue { }
// // }

// // ███████ ██    ██ ██████          ██     ██   ██  █████  ███    ██ ██████  ██      ███████ ██████  
// // ██      ██    ██ ██   ██        ██      ██   ██ ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ 
// // ███████ ██    ██ ██████        ██       ███████ ███████ ██ ██  ██ ██   ██ ██      █████   ██████  
// //      ██ ██    ██ ██   ██      ██        ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██ 
// // ███████  ██████  ██████      ██         ██   ██ ██   ██ ██   ████ ██████  ███████ ███████ ██   ██ 

// export class Subscriber<Receiver> {

//     /**
//      * Class to hold pointer to subscriber in Wasm Memory
//      */

//     // __sub_ptr: WasmPtr
//     // receiver: Receiver
//     // private constructor(sub_ptr: WasmPtr, receiver: Receiver) {
//     constructor() {
//         // this.__sub_ptr = sub_ptr

//     }

//     new(): Subscriber<Receiver> {
//         return new Subscriber();
//     }
// }

// // TODO: Mimic Rust Channels 
// /**
//  * Interface to mimic Rust Channels from the WASM -> Typescript 
//  * Meant for use in Subscribers, with Events being receiving a new sample on the socket
//  */
// export interface Handler<Event, Receiver> {
//     onEvent: (event: Event) => Promise<void>
//     onClose?: () => Promise<void>
//     receiver?: Receiver
// }

// /**
//  * Something that may be turned into a Handler.
//  * 
//  * Notable default implementers: 
//  *  -   None
//  */
// export const intoHandler = Symbol("intoHandler")

// export interface IntoHandler<Event, Receiver> {
//     [intoHandler]: () => Promise<Handler<Event, Receiver>>
// }

// /**
//  * Kinds of Samples that can be recieved from Zenoh-pico
//  */
// export enum SampleKind {
//     PUT = "PUT",
//     DELETE = "DELETE",
// }

// // TODO : Something that has been sent through Put or delete
// /**
//  * Samples are publication events receieved on the Socket
//  */
// export class Sample {
//     keyexpr: KeyExpr
//     value: Value
//     kind: SampleKind
//     constructor(
//         keyexpr: KeyExpr,
//         value: Value,
//         kind: SampleKind) {
//         this.keyexpr = keyexpr
//         this.value = value
//         this.kind = kind
//     }

//     new(keyexpr: KeyExpr, payload: Value, kind: SampleKind): Sample {
//         return new Sample(keyexpr, payload, kind);
//     }
// }


// /**
//  * Extend String to IntoSelector
//  */
// declare global {
//     // interface for KeyExpr?params to selector
//     interface String extends IntoSelector { }
//     // interface for [KeyExpr, params] to selector
//     // interface [String, Map<String, String>] extends IntoSelector {  } // this doesn't work, will need an overload :(
// }


// // ███████ ███████ ██      ███████  ██████ ████████  ██████  ██████  
// // ██      ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// // ███████ █████   ██      █████   ██         ██    ██    ██ ██████  
// //      ██ ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// // ███████ ███████ ███████ ███████  ██████    ██     ██████  ██   ██ 

// // TODO: Internals of selector need to be handled in Zenoh rather than JS
// // TODO: TEST
// // Selector : High level <keyexpr>?arg1=lol&arg2=hi
// export class Selector {

//     // TODO clear memory of selector using FinalizationRegistry
//     // static registry = new FinalizationRegistry(([ptr, task_ptr]: [number, number]) => (new Session(ptr, task_ptr)).close())

//     // KeyExpr object
//     key_expr: KeyExpr

//     // Optional : parameter field
//     _parameters?: string;

//     // Returns the key expression
//     async get_keyepxr(): Promise<KeyExpr> {
//         return this.key_expr
//     }

//     // Returns the parameters of the selector
//     /// Note: Keep this async incase in the future we want to call C code
//     async parameters(): Promise<Map<string, string>> {

//         const params = new Map<string, string>();
//         for (const pair of this._parameters?.split("&") || []) {
//             const [key, value] = pair.split("=");
//             params.set(key, value);
//         }

//         return params; // If parameter does not exist, then returns undefined
//     }

//     async parameter(param_key: string): Promise<string | undefined> {

//         for (const pair of this._parameters?.split("&") || []) {
//             const [key, value] = pair.split("=");
//             if (key === param_key) {
//                 return value
//             }
//         }
//         return undefined; // If parameter does not exist, then returns undefined
//     }

//     // TODO comment
//     constructor(keyexpr: KeyExpr, parameters?: string) {
//         this.key_expr = keyexpr;
//         this._parameters = parameters;
//     }

//     static new(keyexpr: IntoKeyExpr, parameter: Map<string, string>): Promise<Selector>;
//     static new(selector: IntoSelector): Promise<Selector>;
//     static async new(selector: IntoSelector | IntoKeyExpr, parameters?: Map<string, string>): Promise<Selector> {
//         // TODO implement 
//         throw "Unimplemented";
//         // If selector intoKeyExpr, take parameters if available. 

//         // Attempt IntoSelector (intoKeyExpr might be lossy)
//         // if not, do IntoKeyExpr, then IntoSelector (KeyExpr MUST IntoSelector)
//         // append parameters regardless of existing ones.

//     }
// }


// // TODO Implement Query API for Zenoh
// export class Query {
//     selector: Selector
//     async reply(sample: Sample): Promise<void> { }
//     async reply_err(error: IntoValue): Promise<void> { }
//     constructor(selector: Selector) {
//         this.selector = selector
//     }
// }

// // TODO Implement Reply API
// export class Reply { }

// // ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// // ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// // ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
// //      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// // ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

// /**
//  * Session Class 
//  * Holds pointer to Session Instance in WASM Memory
//  * methods
//  */

// function onOpen(event: any): void {
//     console.log("connected");

// }

// export class Session {

//     // A FinalizationRegistry object lets you request a callback when a value is garbage-collected.
//     // static registry = new FinalizationRegistry(([ptr, task_ptr]: [number, number]) => (new Session(ptr, task_ptr)).close())

//     // TODO: I hate the idea of this being accessible outside the class

//     ws: WebSocket
//     // ch: SimpleChannel<string>;
//     // wrapped_ws : WrappedSocket


//     private constructor(ws: WebSocket, ch: SimpleChannel<string>) {
//         // this.__ptr = ptr
//         // this.__task_ptr = task_ptr
//         // this.wrapped_ws = wrapped_ws;
//         this.ws = ws;
//         // this.ch = ch;
//         // Session.registry.register(this, [this.__ptr, this.__task_ptr], this);
//     }

//     /**
//      * Creates a new Session instance in WASM Memory given a config
//      *
//      * @remarks
//      *  The open function also runs zw_start_tasks, 
//      *  starting `zp_start_read_task`,`zp_start_lease_task` 
//      *  associating a read and write task to this session
//      *
//      * @param config - Config for session
//      * @returns Typescript instance of a Session
//      *
//      */

//     static async open(config: Promise<Config> | Config): Promise<Session> {
//         const cfg = await config;
//         // let wrapped = await WrappedSocket.new(cfg.locator)
//         // ws.onopen = onOpen;
//         const ws = new WebSocket(cfg.locator);
//         // ws.onmessage = 
//         // const chan = new SimpleChannel<string>(); // creates a new simple channel

//         // return new Session(wrapped)
//     }

//     /**
//      * Closes a session, cleaning up the resource in Zenoh, 
//      * and unregistering the instance of the class from TypeScript
//      *
//      * @returns Nothing
//      */
//     async close() {
//         // this.ws.send()
//         // TODO: Is this correct ?
//         // const Zenoh: Module = await zenoh();
//         // await Zenoh.zw_close_session(this.__ptr)
//         // Session.registry.unregister(this)
//     }

//     /**
//      * Puts a value on the session, on a specific key expression KeyExpr 
//      * 
//      * @param keyexpr - something that implements intoKeyExpr
//      * @param value - something that implements intoValue
//      * 
//      * @returns success: 0, failure : -1
//      */
//     async put(keyexpr: IntoKeyExpr, value: IntoValue): Promise<number> {

//         // const [Zenoh, key, val]: [Module, KeyExpr, Value] = await Promise.all([zenoh(), keyexpr[intoKeyExpr](), value[intoValue]()]);
//         // const [key, val]: [KeyExpr, Value] = await Promise.all([keyexpr[intoKeyExpr](), value[intoValue]()]);

//         // const ret = Zenoh.zw_put(this.__ptr, key.__ptr, val.payload);
//         // TODO: PUT ON WS

//         // if (ret < 0) {
//         //     throw `Error ${ret} while putting`
//         // }
//         // TODO: FIX
//         return -1
//     }

//     /**
//      * Declares a Key Expression on a session
//      *
//      * @param keyexpr - string of key_expression
//      * 
//      * @returns success: 0, failure : -1
//      */
//     async declare_ke(keyexpr: string): Promise<KeyExpr> {

//         // const Zenoh: Module = await zenoh();

//         // const ret = Zenoh.zw_declare_ke(this.__ptr, keyexpr);

//         // if (ret < 0) {
//         //     throw "An error occured while Declaring Key Expr"
//         // }

//         // const key_expr = new KeyExpr(ret);
//         // return key_expr;
//         return new KeyExpr();
//     }

//     // TODO:  Implement get
//     // async get(into_selector: IntoSelector, query: Query, callback: () => void): Promise<number> {
//     //     throw "TODO"
//     // }

//     // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
//     // async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
//     // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {
//     //     const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

//     //     const ret = await Zenoh.zw_declare_subscriber(this.__ptr, key.__ptr, handler);

//     //     if (ret < 0) {
//     //         throw `Error ${ret} while declaring Subscriber`
//     //     }
//     //     return ret
//     // }

//     // TODO : Support Sync as well ? 
//     // async declare_subscriber(keyexpr: IntoKeyExpr, handler: (keyexpr: String, value: Uint8Array) => void): Promise<Subscriber<void>> {
//     //     const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

//     //     const ret = await Zenoh.zw_declare_subscriber(
//     //         this.__ptr,
//     //         key.__ptr,
//     //         (keyexpr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
//     //             handler(Zenoh.UTF8ToString(keyexpr), Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len))
//     //         });

//     //     if (ret < 0) {
//     //         throw `Error ${ret} while declaring Subscriber`
//     //     }
//     //     return ret
//     // }

//     /**
//      * Declares a Subscriber handler on a Session
//      *
//      * @remarks
//      *  The handler function will be passed to the Wasm Module and executed when a new sample arrives on the socket
//      * @param keyexpr - Something that implements IntoKeyExpr
//      * @param handler -  A callback function that takes a Sample and returns a Void
//      * 
//      * @returns success: 0, failure : -1
//      */
//     async declare_subscriber_handler(keyexpr: IntoKeyExpr, handler: (sample: Sample) => void): Promise<Subscriber<void>> {
//         // const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
//         // const [key]: [KeyExpr] = await Promise.all([keyexpr[intoKeyExpr]()]);

//         // const ret = await Zenoh.zw_declare_subscriber(
//         //     this.__ptr,
//         //     key.__ptr,
//         //     async (keyexpr_ptr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
//         //         // Looks into WASM Memory
//         //         let uint8_array_view: Uint8Array = Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len);

//         //         // Copies value from WASM to Javascript
//         //         let uint8_array_cloned = new Uint8Array(uint8_array_view)
//         //         // 
//         //         let value = new Value(uint8_array_cloned);
//         //         // TODO : Actually get the Sample kind from the Sample
//         //         let kind = SampleKind.PUT;

//         //         handler(new Sample(key, value, kind))
//         //     });

//         // if (ret < 0) {
//         //     throw `Error ${ret} while declaring Subscriber`
//         // }
//         // return new Subscriber<void>(ret);

//         return new Subscriber<void>();
//     }

//     /**
//      * Declares a Subscriber handler on a Session
//      *
//      * @remarks
//      *  The handler function will be passed to the Wasm Module and executed when a new sample arrives on the socket
//      * @param keyexpr - Something that implements IntoKeyExpr
//      * @param handler -  A callback function that takes a Sample and returns a Void
//      * 
//      * @returns success: 0, failure : -1
//      */
//     async declare_subscriber_handler_async(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>> {
//         // const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
//         // const [key]: [ KeyExpr] = await Promise.all([ keyexpr[intoKeyExpr]()]);

//         // TODO: Get KeyExpr from Sample, 
//         // Therefore internally get KeyExpr from Resource Pool managed by Zenoh-pico/Zenoh-cpp WASM
//         // const ret = await Zenoh.zw_declare_subscriber(
//         //     this.__ptr,
//         //     key.__ptr,
//         //     async (keyexpr_ptr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
//         //         // console.log("Sub Before Sub Array ", pl_start, " : ", pl_start + pl_len)
//         //         let uint8_array_view: Uint8Array = Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len);
//         //         // console.log("After Sub Array")
//         //         let uint8_array_cloned = new Uint8Array(uint8_array_view)
//         //         // console.log("After Sub Array Clone to TS")

//         //         let value = new Value(uint8_array_cloned);

//         //         let key_expr: KeyExpr = await KeyExpr.new(Zenoh.UTF8ToString(keyexpr_ptr));
//         //         let kind = SampleKind.PUT;

//         //         handler(new Sample(key_expr, value, kind))
//         //     });

//         // if (ret < 0) {
//         //     throw `Error ${ret} while declaring Subscriber`
//         // }

//         // TODO implement Proper Reciever
//         return new Subscriber<void>();
//         // return new Subscriber<void>(ret);
//     }

//     async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {

//         // TODO Test this  
//         var publisher: Publisher = await Publisher.new(keyexpr, this);
//         return publisher
//     }

// }

// // ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// // ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// // ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// // ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// // ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 
// export class Publisher {
//     /**
//      * Class that creates and keeps a reference to a publisher inside the WASM memory
//      */

//     // private __publisher_ptr: WasmPtr;

//     private constructor() {

//         // this.__publisher_ptr = publisher_ptr;
//     }

//     /**
//      * Puts a value on the publisher associated with this class instance
//      *
//      * @param value -  something that can bec converted into a Value
//      * 
//      * @returns success: 0, failure : -1
//      */
//     async put(value: IntoValue): Promise<void> {

//         // const val: Value = await value[intoValue]();
//         // const Zenoh: Module = await zenoh();
//         // const ret = Zenoh.zw_publisher_put(this.__publisher_ptr, val.payload);
//         // if (ret < 0) {
//         // throw `Error ${ret} while putting`
//         // }
//         // return ret
//         return await new Promise(resolve => resolve());
//         // return void;
//     }

//     /**
//      * Creates a new Publisher on a session
//      * @param keyexpr -  something that can be converted into a Key Expression
//     *
//      * @param session -  A Session to create the publisher on
//      * 
//      * @returns a new Publisher instance
//      */
//     static async new(keyexpr: IntoKeyExpr, session: Session): Promise<Publisher> {

//         // const Zenoh: Module = await zenoh();

//         // const key_expr: KeyExpr = await keyexpr[intoKeyExpr]();

//         console.log("Start declare_publisher");

//         // let publisher_ptr: WasmPtr = Zenoh.zw_declare_publisher(session.__ptr, key_expr.__ptr);
//         // return new Publisher(publisher_ptr)

//         return new Publisher()
//     }
// }

// // TODO: Should this be part of some other class ? 
// // Kind of like the idea of leaving it here so that the user can decide what they want decoded and how it works
// // export class Utils {
// //     // static decoder = new TextDecoder()
// //     private decoder = new TextDecoder();

// //     decodeFromSharedBuffer(sharedBuffer: SharedArrayBuffer) {
// //         const copyLength = Math.min(sharedBuffer.byteLength)

// //         // Create a temporary ArrayBuffer and copy the contents of the shared buffer
// //         // into it.
// //         const tempBuffer = new ArrayBuffer(copyLength)
// //         const tempView = new Uint8Array(tempBuffer)

// //         let sharedView = new Uint8Array(sharedBuffer)
// //         if (sharedBuffer.byteLength != copyLength) {
// //             sharedView = sharedView.subarray(0, copyLength)
// //         }
// //         tempView.set(sharedView)

// //         return this.decoder.decode(tempBuffer)
// //     }

// // }
