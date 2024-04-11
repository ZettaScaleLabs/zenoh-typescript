//
// Copyright (c) 2023 ZettaScale Technology
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
// which is available at https://www.apache.org/licenses/LICENSE-2.0.
//
// SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
//
// Contributors:
//   ZettaScale Zenoh Team, <zenoh@zettascale.tech>
//

import Module from "./wasm/zenoh-wasm.js"
// TODO PROPER LOGGING
// TODO Fix Logging

// import { Logger, ILogObj } from "tslog";
// const log: Logger<ILogObj> = new Logger();

// TODO : Clean up Any's with proper types
interface Module {
    HEAPU8: any;
    UTF8ToString(x: any): string,
    stringToUTF8OnStack(x: string): any,
    onRuntimeInitialized(): Promise<any>,
    // TODO Delete ?
    registerJSCallback(callback: any): number,


    writeArrayToMemory(array: Uint8Array, buffer: number): any, // TODO: Returns None ? 
    // Working Callbacks
    cwrap(ident: string, returnType: string, argTypes: string[], opts: any): any,
    cwrap(ident: string, returnType: string, argTypes: string[]): any,

    // Add Function, Accepts any function and needs a function Signature, More info Belows
    addFunction(func: (...arg: any) => any, sig: string): any,

    // TODO: Publisher  
    zw_publisher_put(...arg: any): any,

    // 
    zw_put(...arg: any): any,
    zw_open_session(...arg: any): any,
    zw_start_tasks(...arg: any): any,
    zw_close_session(...arg: any): any,
    zw_declare_ke(...arg: any): any,
    zw_delete_ke(...arg: any): any,
    zw_declare_subscriber(...arg: any): any,
    zw_declare_publisher(...arg: any): any,
    zw_make_ke(...arg: any): any,
    zw_default_config(clocator: any): any,
    // zw_make_ke: mod_instance.cwrap("zw_make_ke", "number", ["number"], { async: true }),
    api: any
    // DEV
    // DEV
    // DEV
    // Async Callbacks with Emscripten Automagically
    callback_test(...arg: any): any,
    callback_test_async(...arg: any): any,
    pass_arr_cpp(...arg: any): any,
    callback_test_typed(...arg: any): any,
    run_on_event(...arg: any): any,
}

// 
type WasmPtr = number;


let mod_instance: Module;

export const intoSelector = Symbol("intoSelector")

export interface IntoSelector {
    [intoSelector]: () => Promise<Selector>
}

export const intoKeyExpr = Symbol("intoKeyExpr")
/**
 * Something that may be turned into a Key Expression.
 * 
 * Notable default implementers:
 * - String
 * - KeyExpr
 */
export interface IntoKeyExpr {
    [intoKeyExpr]: () => Promise<KeyExpr>
}

export const intoValue = Symbol("intoValue")

/**
 * Something that may be turned into a Value.
 * 
 * Notable default implementers:
 * - string
 * - Uint8Array
 */
export interface IntoValue {
    [intoValue]: () => Promise<Value>
}

export async function zenoh(): Promise<Module> {
    if (!mod_instance) {
        mod_instance = await Module();
        mod_instance.onRuntimeInitialized = async () => {
            const api = {

                _zw_sub: mod_instance.cwrap("zw_sub", "number", ["number", "number", "number"], { async: true }),

                _test_call_js_callback: mod_instance.cwrap("test_call_js_callback", "number", [], { async: true }),
                _register_rm_callback: mod_instance.cwrap("register_rm_callback", "void", ["number"], { async: true }),
                // To allocate memory
                _z_malloc: mod_instance.cwrap("z_malloc", "number", ["number"], { async: true }),
                malloc: mod_instance.cwrap("malloc", "number", ["number"]),
                // TODO: add and expose zw_make_selector
            };
            mod_instance.api = api;

        };
        await mod_instance.onRuntimeInitialized()
    }
    return mod_instance
}

//  ██████  ██████  ███    ██ ███████ ██  ██████  
// ██      ██    ██ ████   ██ ██      ██ ██       
// ██      ██    ██ ██ ██  ██ █████   ██ ██   ███ 
// ██      ██    ██ ██  ██ ██ ██      ██ ██    ██ 
//  ██████  ██████  ██   ████ ██      ██  ██████  

/**
 * The configuration for a Zenoh Session.
 */
export class Config {
    
    __ptr: WasmPtr = 0

    private constructor(ptr: WasmPtr) {
        this.__ptr = ptr
    }
    static async new(locator: string): Promise<Config> {
        const Zenoh = await zenoh();
        // TODO : Is this horrible ?
        // const clocator = Zenoh.stringToUTF8OnStack(locator);
        const ptr = Zenoh.zw_default_config(locator);

        if (ptr === 0) {
            throw "Failed to construct zenoh.Config";
        }
        return new Config(ptr)
    }
    check(): boolean {
        return !!this.__ptr
    }
}


// ██    ██  █████  ██      ██    ██ ███████ 
// ██    ██ ██   ██ ██      ██    ██ ██      
// ██    ██ ███████ ██      ██    ██ █████   
//  ██  ██  ██   ██ ██      ██    ██ ██      
//   ████   ██   ██ ███████  ██████  ███████ 

// TODO : Add encoding prop later when we need it
// Default to empty string
export class Value {

    payload: Uint8Array

    constructor(payload: Uint8Array) {
        this.payload = payload
    }

    arr(): number {
        return this.payload.length;
    }

    bytes_per_element(): number {
        return this.payload.BYTES_PER_ELEMENT;
    }

    length(): number {
        return this.payload.length;
    }

    [intoValue](): Promise<Value> { return Promise.resolve(this) }

    empty(): Value {
        return new Value(new Uint8Array());
    }

    new(payload: Uint8Array): Value {
        return new Value(payload);
    }

}

// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████  
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██ 
// █████   █████     ████       █████     ███   ██████  ██████  
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██ 
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██ 

export class KeyExpr implements IntoSelector {

    // I hate the idea of this being accessible outside the class
    __ptr: WasmPtr;

    static registry: FinalizationRegistry<number> = new FinalizationRegistry((ptr: WasmPtr) => (new KeyExpr(ptr)).delete());

    // 
    [intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
    [intoSelector](): Promise<Selector> { return Promise.resolve(new Selector(this)) }

    constructor(ptr: WasmPtr) {
        this.__ptr = ptr
        KeyExpr.registry.register(this, this.__ptr, this);
    }
    private async delete() {
        const Zenoh = await zenoh();
        Zenoh.zw_delete_ke(this.__ptr); // delete the C ptr
        KeyExpr.registry.unregister(this); // make sure we aren't called again
    }

    static async new(keyexpr: string): Promise<KeyExpr> {

        const Zenoh = await zenoh();

        const ptr: WasmPtr = await Zenoh.zw_make_ke(keyexpr);
        if (ptr === 0) {
            throw "Failed to construct zenoh.KeyExpr"
        }
        return new KeyExpr(ptr)
    }

}

// Mutate global Types String, Uint8Array to implement interfaces:
// IntoKeyExpr, IntoValue,
Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
    return KeyExpr.new(this)
})

// Makes sure that string is UTF8, gives you blob and encoding.
Object.defineProperty(String.prototype, intoValue, function (this: string) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(this);
    return Promise.resolve(new Value(encoded))
})

Object.defineProperty(Uint8Array.prototype, intoValue, function (this: Uint8Array) {
    return Promise.resolve(new Value(this))
})

Object.defineProperty(Function.prototype, "onEvent", function (this: Function) {
    return this;
})

Object.defineProperty(Function.prototype, "onClose", function (this: Function) { })

// Applies Globally Interface Extension for  String,Uint8Array
// declare global {
//     interface String extends IntoKeyExpr, IntoValue { }
//     interface Uint8Array extends IntoValue { }
// }

// ███████ ██    ██ ██████          ██     ██   ██  █████  ███    ██ ██████  ██      ███████ ██████  
// ██      ██    ██ ██   ██        ██      ██   ██ ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ 
// ███████ ██    ██ ██████        ██       ███████ ███████ ██ ██  ██ ██   ██ ██      █████   ██████  
//      ██ ██    ██ ██   ██      ██        ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██ 
// ███████  ██████  ██████      ██         ██   ██ ██   ██ ██   ████ ██████  ███████ ███████ ██   ██ 

export class Subscriber<Receiver> {
    __sub_ptr: WasmPtr
    receiver: Receiver
    private constructor(sub_ptr: WasmPtr, receiver: Receiver) {
        this.__sub_ptr = sub_ptr
        this.receiver = receiver
    }
}

// TODO: Mimic Rust Channels 
export interface Handler<Event, Receiver> {
    onEvent: (event: Event) => Promise<void>
    onClose?: () => Promise<void>
    receiver?: Receiver
}

/**
 * Something that may be turned into a Handler.
 * 
 * Notable default implementers: 
 *  -   None
 */
export const intoHandler = Symbol("intoHandler")

export interface IntoHandler<Event, Receiver> {
    [intoHandler]: () => Promise<Handler<Event, Receiver>>
}


export enum SampleKind {
    PUT = "PUT",
    DELETE = "DELETE",
}

// TODO : Something that has been sent through Put or delete
// Samples Are publication events
export class Sample {
    keyexpr: KeyExpr
    value: Value
    kind: SampleKind
    constructor(
        keyexpr: KeyExpr,
        value: Value,
        kind: SampleKind) {
        this.keyexpr = keyexpr
        this.value = value
        this.kind = kind
    }
    // static new(): Sample {

    // };

    new(keyexpr: KeyExpr, payload: Value, kind: SampleKind): Sample {
        return new Sample(keyexpr, payload, kind);
    }

}

declare global {
    // interface for KeyExpr?params to selector
    interface String extends IntoSelector { }
    // interface for [KeyExpr, params] to selector
    // interface [String, Map<String, String>] extends IntoSelector {  } // this doesn't work, will need an overload :(
}


// ███████ ███████ ██      ███████  ██████ ████████  ██████  ██████  
// ██      ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ █████   ██      █████   ██         ██    ██    ██ ██████  
//      ██ ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ ███████ ███████ ███████  ██████    ██     ██████  ██   ██ 

// TODO: Internals of selector need to be handled in Zenoh rather than JS
// TODO: TEST
// Selector : High level <keyexpr>?arg1=lol&arg2=hi
export class Selector {

    // TODO clear memory of selector using FinalizationRegistry
    // static registry = new FinalizationRegistry(([ptr, task_ptr]: [number, number]) => (new Session(ptr, task_ptr)).close())

    // KeyExpr object
    key_expr: KeyExpr

    // Optional : parameter field
    _parameters?: string;

    // Returns the key expression
    async get_keyepxr(): Promise<KeyExpr> {
        return this.key_expr
    }

    // Returns the parameters of the selector
    /// Note: Keep this async incase in the future we want to call C code
    async parameters(): Promise<Map<string, string>> {

        const params = new Map<string, string>();
        for (const pair of this._parameters?.split("&") || []) {
            const [key, value] = pair.split("=");
            params.set(key, value);
        }

        return params; // If parameter does not exist, then returns undefined
    }

    async parameter(param_key: string): Promise<string | undefined> {

        for (const pair of this._parameters?.split("&") || []) {
            const [key, value] = pair.split("=");
            if (key === param_key) {
                return value
            }
        }
        return undefined; // If parameter does not exist, then returns undefined
    }

    // TODO comment
    constructor(keyexpr: KeyExpr, parameters?: string) {
        this.key_expr = keyexpr;
        this._parameters = parameters;
    }

    static new(keyexpr: IntoKeyExpr, parameter: Map<string, string>): Promise<Selector>;
    static new(selector: IntoSelector): Promise<Selector>;
    static async new(selector: IntoSelector | IntoKeyExpr, parameters?: Map<string, string>): Promise<Selector> {
        // TODO implement 
        throw "Unimplemented";
        // If selector intoKeyExpr, take parameters if available. 

        // Attempt IntoSelector (intoKeyExpr might be lossy)
        // if not, do IntoKeyExpr, then IntoSelector (KeyExpr MUST IntoSelector)
        // append parameters regardless of existing ones.

    }
}

export class Query {
    selector: Selector
    async reply(sample: Sample): Promise<void> { }
    async reply_err(error: IntoValue): Promise<void> { }
    constructor(selector: Selector) {
        this.selector = selector
    }
}

// TODO
export class Reply { }


// ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
//      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

export class Session {

    // A FinalizationRegistry object lets you request a callback when a value is garbage-collected.
    static registry = new FinalizationRegistry(([ptr, task_ptr]: [number, number]) => (new Session(ptr, task_ptr)).close())

    // TODO: I hate the idea of this being accessible outside the class
    private __ptr: WasmPtr = 0

    //@ts-ignore
    private __task_ptr: WasmPtr = 0

    private constructor(ptr: WasmPtr, task_ptr: WasmPtr) {
        this.__ptr = ptr
        this.__task_ptr = task_ptr
        Session.registry.register(this, [this.__ptr, this.__task_ptr], this);
    }

    static async open(config: Promise<Config> | Config): Promise<Session> {
        const cfg = await config;
        const Zenoh: Module = await zenoh();

        if (!cfg.check()) {
            throw "Invalid config passed: it may have been already consumed by opening another session."
        }
        
        const ptr = await Zenoh.zw_open_session(cfg.__ptr);

        cfg.__ptr = 0;

        if (ptr === 0) {
            throw "Failed to open zenoh.Session";
        }

        // Keep track of tasks pointer such that we can destroy it when Session is destroyed
        const __task_ptr = await Zenoh.zw_start_tasks(ptr);

        return new Session(ptr, __task_ptr)
    }

    async close() {
        // TODO: Is this correct ?
        // Should i drop the session internals ?  
        const Zenoh: Module = await zenoh();
        await Zenoh.zw_close_session(this.__ptr)
        Session.registry.unregister(this)
    }

    // Keyexpr can either be something that can be converted into a keyexpr or a pointer to a Keyexpr
    async put(keyexpr: IntoKeyExpr, value: IntoValue): Promise<number> {

        const [Zenoh, key, val]: [Module, KeyExpr, Value] = await Promise.all([zenoh(), keyexpr[intoKeyExpr](), value[intoValue]()]);

        const ret = await Zenoh.zw_put(this.__ptr, key.__ptr, val.payload);

        if (ret < 0) {
            throw `Error ${ret} while putting`
        }
        return ret
    }

    // Returns a pointer to the key expression in Zenoh Memory 
    async declare_ke(keyexpr: string): Promise<KeyExpr> {

        const Zenoh: Module = await zenoh();

        const ret = await Zenoh.zw_declare_ke(this.__ptr, keyexpr);

        if (ret < 0) {
            throw "An error occured while Declaring Key Expr"
        }

        const key_expr = new KeyExpr(ret);
        return key_expr;
    }

    // TODO Implement get
    async get(into_selector: IntoSelector, query: Query, callback: () => void): Promise<number> {

        const [Zenoh, selector] = await Promise.all([zenoh(), into_selector[intoSelector]()]);

        const pke = selector.key_expr.__ptr;
        const callback_ptr: number = Zenoh.registerJSCallback(callback);
        const ret = await Zenoh.api._zw_sub(this.__ptr, pke, callback_ptr);

        if (ret < 0) {
            throw "An error occured while getting"
        }
        return ret
    }


    // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
    // async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
    // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {
    //     const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

    //     const ret = await Zenoh.zw_declare_subscriber(this.__ptr, key.__ptr, handler);

    //     if (ret < 0) {
    //         throw `Error ${ret} while declaring Subscriber`
    //     }
    //     return ret
    // }

    async declare_subscriber(keyexpr: IntoKeyExpr, handler: (keyexpr: String, value: Uint8Array) => void): Promise<Subscriber<void>> {
        const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

        const ret = await Zenoh.zw_declare_subscriber(
            this.__ptr,
            key.__ptr,
            (keyexpr: number, pl_start: number, pl_len: number) => {
                handler(Zenoh.UTF8ToString(keyexpr), Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len))
            });

        if (ret < 0) {
            throw `Error ${ret} while declaring Subscriber`
        }
        return ret
    }

    async declare_subscriber_handler(keyexpr: IntoKeyExpr, handler: (sample: Sample) => void): Promise<Subscriber<void>> {
        const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

        const ret = await Zenoh.zw_declare_subscriber(
            this.__ptr,
            key.__ptr,
            async (keyexpr_ptr: number, pl_start: number, pl_len: number) => {
                // Looks into WASM Memory
                let uint8_array_view: Uint8Array = Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len);
                // Copies value from WASM to Javascript
                // TODO: Verify that this is okay
                let uint8_array_cloned = new Uint8Array(uint8_array_view)
                let value = new Value(uint8_array_cloned);
                let key_expr: KeyExpr = await KeyExpr.new(Zenoh.UTF8ToString(keyexpr_ptr));
                // TODO: Can this Be DELETE? 
                let kind = SampleKind.PUT;

                handler(new Sample(key_expr, value, kind))
            });

        if (ret < 0) {
            throw `Error ${ret} while declaring Subscriber`
        }
        return ret
    }

    async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {

        // TODO Test this  
        var publisher: Publisher = await Publisher.new(keyexpr, this);

        return publisher
    }

}


// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 
export class Publisher {

    private __publisher_ptr: WasmPtr;


    // METHOD 1
    // private constructor(key_expr: KeyExpr, session: Session) {
    //     this.__key_expr = key_expr
    //     this.__session = session
    //     // TODO will I need this registry.register
    //     // Session.registry.register(this, [this.__ptr, this.__task_ptr], this);
    // }

    // METHOD 2

    private constructor(publisher_ptr: WasmPtr) {

        this.__publisher_ptr = publisher_ptr;
    }

    async put(value: IntoValue): Promise<WasmPtr> {

        // TODO expose Publisher 
        const val: Value = await value[intoValue]();
        const Zenoh: Module = await zenoh();
        const ret = Zenoh.zw_publisher_put(this.__publisher_ptr, val);

        if (ret < 0) {
            throw `Error ${ret} while putting`
        }
        // return ret
        return 0;
    }

    static async new(keyexpr: IntoKeyExpr, session: Session): Promise<Publisher> {

        const Zenoh: Module = await zenoh();
        const key_expr: KeyExpr = await keyexpr[intoKeyExpr]();
        let publisher_ptr: WasmPtr = Zenoh.zw_declare_publisher(key_expr, session);

        return new Publisher(publisher_ptr)
    }
}


// TODO: Should this be part of some other class ? 
// Kind of like the idea of leaving it here so that the user can decide what they want decoded and how it works
export class Utils {
    // static decoder = new TextDecoder()
    private decoder = new TextDecoder();

    decodeFromSharedBuffer(sharedBuffer: SharedArrayBuffer) {
        const copyLength = Math.min(sharedBuffer.byteLength)

        // Create a temporary ArrayBuffer and copy the contents of the shared buffer
        // into it.
        const tempBuffer = new ArrayBuffer(copyLength)
        const tempView = new Uint8Array(tempBuffer)

        let sharedView = new Uint8Array(sharedBuffer)
        if (sharedBuffer.byteLength != copyLength) {
            sharedView = sharedView.subarray(0, copyLength)
        }
        tempView.set(sharedView)

        return this.decoder.decode(tempBuffer)
    }

}

// ██████  ███████ ██    ██ 
// ██   ██ ██      ██    ██ 
// ██   ██ █████   ██    ██ 
// ██   ██ ██       ██  ██  
// ██████  ███████   ████   

// TODO  Delete everything below this point                          

function ts_callback(num: number): number {
    console.log("    TS CALLBACK: ", num);
    return 10 + num;
}

async function async_ts_callback(num: number): Promise<number> {
    console.log("    ASYNC TS CALLBACK: ", num);
    return 25 + num;
}

export class DEV {

    static async call_functions_CPP_style(): Promise<number> {
        console.log("Start : C++ method of Calling Functions");

        const Zenoh: Module = await zenoh();

        const arr = new Uint8Array([65, 66, 67, 68]);
        // var dataPtr = Zenoh.api.malloc(arr.length);
        // Zenoh.writeArrayToMemory(arr, dataPtr);

        console.log("Zenoh.pass_arr_cpp();");
        let ret_val = await Zenoh.pass_arr_cpp(arr);
        console.log("ret_val: ", ret_val);

        console.log("=====================================");
        return 10;
    }

    static async call_CPP_function_with_TS_Callback() {

        console.log("Start : C++ method of passing Callbacks to CPP code from TypeScript");

        const Zenoh: Module = await zenoh();

        console.log("Sync Callback");
        let ret_val = Zenoh.callback_test(ts_callback);
        console.log("Return Value: ", ret_val);

        console.log("Async Callback Typed");
        let ret_val_typed = await Zenoh.callback_test_typed(ts_callback);
        console.log("Return Value: ", ret_val_typed);


        // CALLBACK ASYNC        
        console.log("Async Callback");
        let ret_val_async_1 = await Zenoh.callback_test_async(async_ts_callback);
        console.log("Return Value: ", ret_val_async_1);

        // CALLBACK ASYNC with promise
        console.log("Async Callback");
        let ret_val_async = await Zenoh.callback_test_async(async_ts_callback);
        console.log("Return Value: ", ret_val_async);
        console.log("=====================================");

    }

    static async run_on_event(ts_callback: any) {
        const Zenoh: Module = await zenoh();
        await Zenoh.run_on_event(ts_callback);
    }
}



