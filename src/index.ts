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



    // NEO API TODO Fix TYPES
    neo_zw_sub(...arg: any): any,
    // 
    zw_put(...arg: any): any,
    zw_open_session(...arg: any): any,
    zw_start_tasks(...arg: any): any,
    zw_close_session(...arg: any): any,
    zw_declare_ke(...arg: any): any,
    zw_make_ke(...arg: any): any,
    zw_default_config(clocator: any): any,
    neo_poll_read_func(...arg: any): any,
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

                // _zw_make_ke: mod_instance.cwrap("zw_make_ke", "number", ["number"], { async: true }),
                _zw_delete_ke: mod_instance.cwrap("zw_delete_ke", "void", ["number"], { async: true }),

                _zw_sub: mod_instance.cwrap("zw_sub", "number", ["number", "number", "number"], { async: true }),

                _test_call_js_callback: mod_instance.cwrap("test_call_js_callback", "number", [], { async: true }),
                _register_rm_callback: mod_instance.cwrap("register_rm_callback", "void", ["number"], { async: true }),
                // To allocate memory
                _z_malloc: mod_instance.cwrap("z_malloc", "number", ["number"], { async: true }),
                malloc: mod_instance.cwrap("malloc", "number", ["number"]),
                // _zw_make_ke: module2.cwrap("zw_make_ke", "void", ["number"], { async: true }),
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
    __ptr: number = 0
    private constructor(ptr: number) {
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
    __ptr: number

    // 
    static registry: FinalizationRegistry<number> = new FinalizationRegistry((ptr: number) => (new KeyExpr(ptr)).delete());

    // 
    [intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
    [intoSelector](): Promise<Selector> { return Promise.resolve(new Selector(this)) }

    constructor(ptr: number) {
        this.__ptr = ptr
        KeyExpr.registry.register(this, this.__ptr, this);
    }
    private async delete() {
        const Zenoh = await zenoh();
        Zenoh.api._zw_delete_ke(this.__ptr); // delete the C ptr
        KeyExpr.registry.unregister(this); // make sure we aren't called again
    }

    static async new(keyexpr: string): Promise<KeyExpr> {

        const Zenoh = await zenoh();

        const ptr = await Zenoh.zw_make_ke(keyexpr);
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
    __sub_ptr: number
    receiver: Receiver
    private constructor(sub_ptr: number, receiver: Receiver) {
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

// TODO : Something that has been sent through Put or delete
// Samples Are publication events
export class Sample {
    keyexpr: KeyExpr
    value: Value
    kind: "PUT" | "DELETE"
    constructor(
        keyexpr: KeyExpr,
        value: Value,
        kind: "PUT" | "DELETE",) {
        this.keyexpr = keyexpr
        this.value = value
        this.kind = kind
    }
    // static new(): Promise<Sample>;
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

export class Reply { }


// ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
//      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

export class Session {
    // A FinalizationRegistry object lets you request a callback when a value is garbage-collected.
    static registry = new FinalizationRegistry(([ptr, task_ptr]: [number, number]) => (new Session(ptr, task_ptr)).close())
    private __ptr: number = 0
    //@ts-ignore
    private __task_ptr: number = 0

    private constructor(ptr: number, task_ptr: number) {
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

    // 
    async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
    // 
    async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
    // 
    async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {

        // 1. select keyexpr object
        // 2. search for Symbol `intoKeyExpr` inside the keyexpr object
        // 3. call() the function found for the intoKeyExpr inside the keyexpr object 
        // keyexpr[intoKeyExpr]()

        const [Zenoh, key] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

        let onEvent: (event: Sample) => Promise<void>;
        let onClose: () => Promise<void>;
        let receiver: Receiver | void;

        if (intoHandler in handler) {
            const h = await handler[intoHandler]();
            onEvent = h.onEvent;
            // ??  check if h.onClose is nullish, 
            // if it is nullish (null | undefined) return second operand
            // else return first operand
            onClose = h.onClose ?? (async () => { });
            receiver = h.receiver;
        } else {
            onEvent = <((sample: Sample) => Promise<void>)>(handler);
            onClose = <(() => Promise<void>)>(async () => { });
            receiver = (() => { })();
        }

        const on_event_ptr: number = Zenoh.registerJSCallback(onEvent);
        const on_close_ptr: number = Zenoh.registerJSCallback(onClose);

        // TODO : Remove console.logs() - Put here to appease the TS compiler for unused symbols
        console.log(key);
        console.log(receiver);
        console.log(on_event_ptr);
        console.log(on_close_ptr);

        if (typeof (handler) === "function") {
            throw "Unimplemented"
        } else {
            throw "Unimplemented"
        }

        // Implement Callback to Handler / Reciever Abstraction 
        // const callback_ptr: number = Zenoh.registerJSCallback(callback);

        // const pke = await this.declare_ke(keyexpr);

        // const ret = await Zenoh.api._zw_sub(this.__ptr, key, callback_ptr);

        // if (ret < 0) {
        //     throw "An error occured while putting"
        // }
        // return ret
    }
    
    async neo_sub(keyexpr: IntoKeyExpr): Promise<number> {
    // async neo_sub(keyexpr: string, callback: () => void): Promise<number> {
        // const Zenoh: Module = await zenoh();
        console.log("INSIDE neo_sub ");

        const [Zenoh, key_expr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

        const pke = key_expr.__ptr;

        // while (1) {
        //     zp_read(z_session_loan(&s), NULL);
        //     zp_send_keep_alive(z_session_loan(&s), NULL);
        //     zp_send_join(z_session_loan(&s), NULL);
        // }
        
        function executeAsync(func: any) {
            setTimeout(func, 0);
        }

        
        // TODO How do i stop this async Function ? 
        // Cleanup
        const session_ptr = this.__ptr;
        executeAsync(async function () {
            console.log("Inside Execute Async Function !");
            while (1) {
                console.log("Inside While loop !");
                Zenoh.neo_poll_read_func(session_ptr);
                console.log("Inside While loop !");

            }

            console.log("Finish Put Values");
        });


        // console.log("INSIDE before Function invok ");

        async function neo_sub_async_ts_callback(num: number): Promise<number> {
            console.log("    neo_sub_async_ts_callback: ", num);
            return 25 + num;
        }

        // console.log("INSIDE neo_zw_sub ");

        const ret = await Zenoh.neo_zw_sub(this.__ptr, pke, neo_sub_async_ts_callback);
        console.log("ret")
        if (ret < 0) {
            throw "An error occured while putting"
        }

        // console.log("INSIDE neo_sub END");

        return ret
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



