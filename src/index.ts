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

// import Module from "./wasm/zenoh-wasm.js"

// TODO : Clean up Any's with proper types
/**
 * Interface for Module, overwriting Module from zenoh-wasm.js
 * and manually exposing only what we want to use in the bindings 
 */
// interface Module {
//     HEAPU8: any;
//     UTF8ToString(x: any): string,

//     // Config
//     zw_default_config(clocator: string): WasmPtr,
//     // Session
//     zw_open_session(config_ptr: WasmPtr): WasmPtr,
//     zw_start_tasks(session_ptr: WasmPtr): number,
//     zw_put(session_ptr: WasmPtr, key_expr_ptr: WasmPtr, value: Uint8Array): number,
//     zw_close_session(session_ptr: WasmPtr): number,
//     // Key Expr
//     zw_declare_ke(session_ptr: WasmPtr, key_expr_str: string): number,
//     zw_delete_ke(key_expr_ptr: WasmPtr): number,
//     zw_make_ke(keyexpr_str: string): WasmPtr,
//     // Subscruber
//     zw_declare_subscriber(session_ptr: WasmPtr, key_expr_ptr: WasmPtr, fn: SubCallback): number,
//     //  Publisher  
//     zw_declare_publisher(session_ptr: WasmPtr, key_expr_ptr: WasmPtr): number,
//     zw_publisher_put(publisher_ptr: WasmPtr, value: Uint8Array): number,
//     zw_undeclare_publisher(publisher_ptr: WasmPtr): number,
//     // Misc
//     zw_version(): number,
// }
import { Logger, ILogObj } from "tslog";

const log: Logger<ILogObj> = new Logger();


import { SampleWS } from './remote_api/interface/SampleWS.js'
// import { RemoteSession, RemoteSubscriber, RemotePublisher } from './remote_api/remote_api.ts'
import { RemoteSession, RemoteSubscriber, RemotePublisher } from './remote_api/remote_api'


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

// export const intoValue = Symbol("intoValue")

export const intoZBytes = Symbol("intoZBytes")

/**
 * Something that may be turned into a Value.
 * 
 * Notable default implementers:
 * - string
 * - Uint8Array
 */
// export interface IntoValue {
//     [intoValue]: () => Promise<Value>
// }

/**
 * Something that may be turned into a Value.
 * 
 * Notable default implementers:
 * - string
 * - Uint8Array
 */
export interface IntoZBytes {
    [intoZBytes]: () => Promise<ZBytes>
}

/**
 * Function to Initialize zenoh interface to WASM binary
 */
// export async function zenoh(): Promise<Module> {
//     if (!mod_instance) {
//         mod_instance = await Module();
//     }
//     return mod_instance
// }

//  ██████  ██████  ███    ██ ███████ ██  ██████  
// ██      ██    ██ ████   ██ ██      ██ ██       
// ██      ██    ██ ██ ██  ██ █████   ██ ██   ███ 
// ██      ██    ██ ██  ██ ██ ██      ██ ██    ██ 
//  ██████  ██████  ██   ████ ██      ██  ██████  

export class Config {
    /**
     * The configuration for a Zenoh Session.
     */
    // __ptr: WasmPtr = 0
    locator: string

    private constructor(locator: string) {
        this.locator = locator
    }
    static async new(locator: string): Promise<Config> {

        return new Config(locator)
    }
}


// ██    ██  █████  ██      ██    ██ ███████ 
// ██    ██ ██   ██ ██      ██    ██ ██      
// ██    ██ ███████ ██      ██    ██ █████   
//  ██  ██  ██   ██ ██      ██    ██ ██      
//   ████   ██   ██ ███████  ██████  ███████ 

// TODO : Add encoding prop later when we need it
// Default to empty string
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


export class ZBytes {
    /**
    * Class to represent an Array of Bytes recieved from Zenoh
    */
    payload: Uint8Array

    constructor(payload: Uint8Array) {
        this.payload = payload
    }

    len(): number {
        return this.payload.length;
    }

    [intoZBytes](): Promise<ZBytes> { return Promise.resolve(this) }

    empty(): ZBytes {
        return new ZBytes(new Uint8Array());
    }

    new(payload: Uint8Array): ZBytes {
        return new ZBytes(payload);
    }
}




// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████  
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██ 
// █████   █████     ████       █████     ███   ██████  ██████  
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██ 
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██ 

export class KeyExpr implements IntoSelector {
    /**
     * Class to represent a Key Expression in Zenoh
     * Key Expression is Allocated and Managed by Zenoh Pico
     * this class only exists to keep track of pointer to WASM c-instance
     */
    inner: string

    [intoKeyExpr](): Promise<KeyExpr> { return Promise.resolve(this) }
    [intoSelector](): Promise<Selector> { return Promise.resolve(new Selector(this)) }

    constructor(key_expr: string) {
        this.inner = key_expr
    }

    static async new(keyexpr: string): Promise<KeyExpr> {
        return new KeyExpr(keyexpr)
    }

}

/**
 * Mutate global Types String, Uint8Array to implement interfaces:
 * Notable default implementers: 
 *    IntoKeyExpr, IntoValue,
 */
Object.defineProperty(String.prototype, intoKeyExpr, function (this: string) {
    return KeyExpr.new(this)
})

/**
 * Makes sure that string is UTF8, gives you blob and encoding.
 */
Object.defineProperty(String.prototype, intoZBytes, function (this: string) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(this);
    return Promise.resolve(new ZBytes(encoded))
})

/**
 * Apply Uint8Array to intoValue
 */
Object.defineProperty(Uint8Array.prototype, intoZBytes, function (this: Uint8Array) {
    return Promise.resolve(new ZBytes(this))
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

// ███████ ██    ██ ██████  ███████  ██████ ██████  ██ ██████  ███████ ██████  
// ██      ██    ██ ██   ██ ██      ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ███████ ██    ██ ██████  ███████ ██      ██████  ██ ██████  █████   ██████  
//      ██ ██    ██ ██   ██      ██ ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ███████  ██████  ██████  ███████  ██████ ██   ██ ██ ██████  ███████ ██   ██ 

export class Subscriber {

    /**
     * Class to hold pointer to subscriber in Wasm Memory
     */
    // receiver: Receiver
    private remote_subscriber: RemoteSubscriber;

    constructor(remote_subscriber: RemoteSubscriber, session: Session) {
        this.remote_subscriber = remote_subscriber;
    }


    async recieve() {

        this.remote_subscriber.recieve();
    }

    async undeclare() {
        this.remote_subscriber.undeclare();
    }


    static async new(keyexpr: IntoKeyExpr,
        session: Session,
        callback?: ((sample: Sample) => Promise<void>)): Promise<Subscriber> {

        let key_expr = await keyexpr[intoKeyExpr]();

        let remote_subscriber: RemoteSubscriber;

        if (callback != undefined) {
            const callback_conversion = async function (sample_ws: SampleWS): Promise<void> {
                let key_expr: KeyExpr = new KeyExpr(sample_ws.key_expr);
                let payload: ZBytes = new ZBytes(Uint8Array.from(sample_ws.value));
                let sample_kind: SampleKind = SampleKind[sample_ws.kind];

                callback(new Sample(key_expr, payload, sample_kind))
            }
            remote_subscriber = await session.remote_session.declare_subscriber(key_expr.inner, callback_conversion);
        } else {
            remote_subscriber = await session.remote_session.declare_subscriber(key_expr.inner, callback);
        }

        return new Subscriber(remote_subscriber, session);
    }
}

// TODO: Mimic Rust Channels 
/**
 * Interface to mimic Rust Channels from the WASM -> Typescript 
 * Meant for use in Subscribers, with Events being receiving a new sample on the socket
 */
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

/**
 * Kinds of Samples that can be recieved from Zenoh
 */
export enum SampleKind {
    PUT = "PUT",
    DELETE = "DELETE",
}


/**
 * Samples are publication events receieved on the Socket
 */
export class Sample {
    keyexpr: KeyExpr
    payload: ZBytes
    kind: SampleKind
    // TODO : Add Encoding
    constructor(
        keyexpr: KeyExpr,
        payload: ZBytes,
        kind: SampleKind) {
        this.keyexpr = keyexpr
        this.payload = payload
        this.kind = kind
    }

    new(keyexpr: KeyExpr, payload: ZBytes, kind: SampleKind): Sample {
        return new Sample(keyexpr, payload, kind);
    }
}

/**
 * Extend String to IntoSelector
 */
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


// TODO Implement Query API for Zenoh
export class Query {
    selector: Selector
    async reply(sample: Sample): Promise<void> { }
    async reply_err(error: IntoZBytes): Promise<void> { }

    constructor(selector: Selector) {
        this.selector = selector
    }
}

// TODO Implement Reply API
export class Reply { }

// ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
//      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

/**
 * Session Class 
 * Holds pointer to Session Instance in WASM Memory
 * methods
 */

export class Session {
    // WebSocket Backend
    remote_session: RemoteSession

    private constructor(remote_session: RemoteSession) {
        this.remote_session = remote_session;
    }

    /**
     * Creates a new Session instance in WASM Memory given a config
     *
     * @remarks
     *  The open function also runs zw_start_tasks, 
     *  starting `zp_start_read_task`,`zp_start_lease_task` 
     *  associating a read and write task to this session
     *
     * @param config - Config for session
     * @returns Typescript instance of a Session
     *
     */

    static async open(config: Promise<Config> | Config): Promise<Session> {
        const cfg = await config;
        let remote_session: RemoteSession = await RemoteSession.new(cfg.locator);
        return new Session(remote_session);
    }

    /**
     * Closes a session, cleaning up the resource in Zenoh, 
     * and unregistering the instance of the class from TypeScript
     *
     * @returns Nothing
     */
    async close() {
        this.remote_session.close();
    }

    /**
     * Puts a value on the session, on a specific key expression KeyExpr 
     * 
     * @param keyexpr - something that implements intoKeyExpr
     * @param value - something that implements intoValue
     * 
     * @returns success: 0, failure : -1
     */
    async put(keyexpr: IntoKeyExpr, zbytes: IntoZBytes): Promise<void> {

        const [key, z_bytes]: [KeyExpr, ZBytes] = await Promise.all([keyexpr[intoKeyExpr](), zbytes[intoZBytes]()]);

        this.remote_session.put(key.inner, Array.from(z_bytes.payload));
    }


    async delete(keyexpr: IntoKeyExpr): Promise<void> {
        const key: KeyExpr = await keyexpr[intoKeyExpr]();
        this.remote_session.delete(key.inner);
    }


    /**
     * Declares a Key Expression on a session
     *
     * @param keyexpr - string of key_expression
     * 
     * @returns success: 0, failure : -1
     */
    // TODO do i want to 
    // async declare_ke(keyexpr: string): Promise<KeyExpr> {
    // return new KeyExpr();
    // }

    // TODO:  Implement get
    // async get(into_selector: IntoSelector, query: Query, callback: () => void): Promise<number> {
    //     throw "TODO"
    // }

    // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver>): Promise<Subscriber<Receiver>>;
    // async declare_subscriber(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>>;
    // async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler: IntoHandler<Sample, Receiver> | ((sample: Sample) => Promise<void>)): Promise<Subscriber<Receiver | void>> {
    async declare_subscriber<Receiver>(keyexpr: IntoKeyExpr, handler?: ((sample: Sample) => Promise<void>)): Promise<Subscriber> {
        let subscriber = Subscriber.new(keyexpr, this, undefined);
        return subscriber
    }


    async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {
        log.debug("TEST LOGGIN", keyexpr)
        let key_expr: KeyExpr = await keyexpr[intoKeyExpr]();
        var publisher: Publisher = await Publisher.new(key_expr, this);
        return publisher
    }

}

// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 
export class Publisher {
    /**
     * Class that creates and keeps a reference to a publisher inside the WASM memory
     */
    publisher: RemotePublisher;

    private constructor(publisher: RemotePublisher) {
        this.publisher = publisher;
    }

    /**
     * Puts a value on the publisher associated with this class instance
     *
     * @param value -  something that can bec converted into a Value
     * 
     * @returns success: 0, failure : -1
     */
    async put(payload: IntoZBytes): Promise<void> {
        let zbytes: ZBytes = await payload[intoZBytes]();

        this.publisher.put(Array.from(zbytes.payload))

        return await new Promise(resolve => resolve());
    }

    /**
     * Creates a new Publisher on a session
     * @param keyexpr -  something that can be converted into a Key Expression
    *
     * @param session -  A Session to create the publisher on
     * 
     * @returns a new Publisher instance
     */
    static async new(keyexpr: IntoKeyExpr, session: Session): Promise<Publisher> {
        let key_expr: KeyExpr = await keyexpr[intoKeyExpr]();

        let remote_publisher: RemotePublisher = await session.remote_session.declare_publisher(key_expr.inner);

        return new Publisher(remote_publisher)
    }
}
