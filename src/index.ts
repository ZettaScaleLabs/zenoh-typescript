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

// import { Logger, ILogObj } from "tslog";
// const log: Logger<ILogObj> = new Logger();

import { SampleWS } from './remote_api/interface/SampleWS'
import { RemoteSession, RemoteSubscriber, RemotePublisher } from './remote_api/remote_api'


//  ██████  ██████  ███    ██ ███████ ██  ██████  
// ██      ██    ██ ████   ██ ██      ██ ██       
// ██      ██    ██ ██ ██  ██ █████   ██ ██   ███ 
// ██      ██    ██ ██  ██ ██ ██      ██ ██    ██ 
//  ██████  ██████  ██   ████ ██      ██  ██████  

export class Config {
    /**
     * The configuration for a Zenoh Session.
     */
    locator: string

    private constructor(locator: string) {
        this.locator = locator
    }
    static async new(locator: string): Promise<Config> {

        return new Config(locator)
    }
}

export type IntoZBytes = ZBytes | Uint8Array | number[] | Array<number> | String | string;
export class ZBytes {
    /**
    * Class to represent an Array of Bytes recieved from Zenoh
    */
    private buffer: Uint8Array

    private constructor(buffer: Uint8Array) {
        this.buffer = buffer
    }

    len(): number {
        return this.buffer.length;
    }

    empty(): ZBytes {
        return new ZBytes(new Uint8Array());
    }

    payload(): Uint8Array {
        return this.buffer;
    }

    static new(bytes: IntoZBytes): ZBytes {
        if (bytes instanceof ZBytes) {
            return bytes;
        } else if( bytes instanceof String || typeof bytes === "string" ){
            const encoder = new TextEncoder();
            const encoded = encoder.encode(bytes.toString());
            return new ZBytes(encoded)
        } else {
            return new ZBytes(Uint8Array.from(bytes))
        }
    }
}

// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████  
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██ 
// █████   █████     ████       █████     ███   ██████  ██████  
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██ 
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██ 

export type IntoKeyExpr = KeyExpr | String | string;
export class KeyExpr {
    /**
     * Class to represent a Key Expression in Zenoh
     * Key Expression is Allocated and Managed by Zenoh Pico
     * this class only exists to keep track of pointer to WASM c-instance
     */
    private _inner: string
    // RemoteKeyExpr

    private constructor(key_expr: string) {
        this._inner = key_expr
    }

    inner(): string {
        return this._inner
    }

    static new(keyexpr: IntoKeyExpr): KeyExpr {
        if (keyexpr instanceof KeyExpr) {
            return keyexpr;
        } else if (keyexpr instanceof String) {
            return new KeyExpr(keyexpr.toString());
        } else {
            return new KeyExpr(keyexpr);
        }
    }
}

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
    private callback_subscriber: boolean;

    constructor(remote_subscriber: RemoteSubscriber, callback_subscriber: boolean) {
        this.remote_subscriber = remote_subscriber;
        this.callback_subscriber = callback_subscriber;
    }

    async recieve(): Promise<Sample | void> {
        if (this.callback_subscriber === true) {
            var message = "Cannot call `recieve()` on Subscriber created with callback:";
            console.log(message);
            return
        }

        let opt_sample_ws = await this.remote_subscriber.recieve();
        if (opt_sample_ws != undefined) {
            let sample_ws: SampleWS = opt_sample_ws;
            let key_expr: KeyExpr = KeyExpr.new(sample_ws.key_expr);
            let payload: ZBytes = ZBytes.new(sample_ws.value);
            let sample_kind: SampleKind = SampleKind[sample_ws.kind];
            return Sample.new(key_expr, payload, sample_kind);
        } else {
            console.log("Receieve returned unexpected void from RemoteSubscriber")
            return
        }
    }

    async undeclare() {
        this.remote_subscriber.undeclare();
    }


    static async new(
        into_key_expr: IntoKeyExpr,
        session: Session,
        callback?: ((sample: Sample) => Promise<void>)): Promise<Subscriber> {
        console.log("   new remote subscriber", callback)

        let key_expr = KeyExpr.new(into_key_expr);

        let remote_subscriber: RemoteSubscriber;
        let callback_subscriber = false;
        if (callback != undefined) {
            callback_subscriber = true;
            const callback_conversion = async function (sample_ws: SampleWS): Promise<void> {
                let key_expr: KeyExpr = KeyExpr.new(sample_ws.key_expr);
                let payload: ZBytes = ZBytes.new(sample_ws.value);
                let sample_kind: SampleKind = SampleKind[sample_ws.kind];
                callback(new Sample(key_expr, payload, sample_kind))
            }
            remote_subscriber = await session.remote_session.declare_subscriber(key_expr.inner(), callback_conversion);
        } else {
            remote_subscriber = await session.remote_session.declare_subscriber(key_expr.inner());
        }

        return new Subscriber(remote_subscriber, callback_subscriber);
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

// type IntoSample = SampleWS | [KeyExpr, ZBytes, SampleKind];
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

    static new(keyexpr: KeyExpr, payload: ZBytes, kind: SampleKind): Sample {

        return new Sample(keyexpr, payload, kind);
    }
}


// ███████ ███████ ██      ███████  ██████ ████████  ██████  ██████  
// ██      ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ █████   ██      █████   ██         ██    ██    ██ ██████  
//      ██ ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ ███████ ███████ ███████  ██████    ██     ██████  ██   ██ 

// Selector : High level <keyexpr>?arg1=lol&arg2=hi


type IntoSelector = Selector | KeyExpr | String | string;
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

    // static new(keyexpr: IntoKeyExpr, parameter: Map<string, string>): Promise<Selector>;
    // static new(selector: IntoSelector): Promise<Selector>;
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
    async put(into_key_expr: IntoKeyExpr,
        into_zbytes: IntoZBytes): Promise<void> {

        let key_expr = KeyExpr.new(into_key_expr);
        let z_bytes = ZBytes.new(into_zbytes);

        this.remote_session.put(key_expr.inner(), Array.from(z_bytes.payload()));
    }

    async delete(into_key_expr: IntoKeyExpr): Promise<void> {
        let key_expr = KeyExpr.new(into_key_expr);

        this.remote_session.delete(key_expr.inner());
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

    async declare_subscriber(keyexpr: IntoKeyExpr, handler?: ((sample: Sample) => Promise<void>)): Promise<Subscriber> {
        let subscriber = await Subscriber.new(keyexpr, this, handler);
        return subscriber
    }

    async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {
        let key_expr: KeyExpr = KeyExpr.new(keyexpr)
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
    private remote_publisher: RemotePublisher;

    private constructor(publisher: RemotePublisher) {
        this.remote_publisher = publisher;
    }

    /**
     * Puts a value on the publisher associated with this class instance
     *
     * @param value -  something that can bec converted into a Value
     * 
     * @returns success: 0, failure : -1
     */
    async put(payload: IntoZBytes): Promise<void> {
        let zbytes: ZBytes = ZBytes.new(payload);

        return this.remote_publisher.put(Array.from(zbytes.payload()))
    }

    async undeclare() {
        await this.remote_publisher.undeclare()
    }

    /**
     * Creates a new Publisher on a session
     * @param keyexpr -  something that can be converted into a Key Expression
    *
     * @param session -  A Session to create the publisher on
     * 
     * @returns a new Publisher instance
     */
    static async new(into_key_expr: IntoKeyExpr, session: Session): Promise<Publisher> {
        const key_expr = KeyExpr.new(into_key_expr);

        let remote_publisher: RemotePublisher = await session.remote_session.declare_publisher(key_expr.inner());

        return new Publisher(remote_publisher)
    }
}


export function open(config: Config): Promise<Session> {
    return Session.open(config)
}