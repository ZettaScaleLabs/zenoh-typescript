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


import { SampleWS } from './remote_api/interface/SampleWS'
import { QueryWS } from './remote_api/interface/QueryWS'
import { RemoteSubscriber, RemotePublisher } from './remote_api/pubsub'
import { RemoteSession } from './remote_api/session'
import { RemoteQueryable } from './remote_api/query'


type Option<T> = T | null;


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
        } else if (bytes instanceof String || typeof bytes === "string") {
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

        // from SampleWS -> Sample
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
        remote_subscriber: RemoteSubscriber,
        callback_subscriber: boolean
    ): Promise<Subscriber> {
        return new Subscriber(remote_subscriber, callback_subscriber);
    }
}


//  ██████  ██    ██ ███████ ██████  ██    ██  █████  ██████  ██      ███████ 
// ██    ██ ██    ██ ██      ██   ██  ██  ██  ██   ██ ██   ██ ██      ██      
// ██    ██ ██    ██ █████   ██████    ████   ███████ ██████  ██      █████   
// ██ ▄▄ ██ ██    ██ ██      ██   ██    ██    ██   ██ ██   ██ ██      ██      
//  ██████   ██████  ███████ ██   ██    ██    ██   ██ ██████  ███████ ███████ 
//     ▀▀                                                                     

export class Queryable {

    /**
     * Class to hold pointer to subscriber in Wasm Memory
     */
    // receiver: Receiver
    private remote_queryable: RemoteQueryable;
    // private callback_queryable: boolean;

    constructor(remote_queryable: RemoteQueryable, callback_queryable: boolean) {
        this.remote_queryable = remote_queryable;
        // this.callback_queryable = callback_queryable;
    }

    async recieve(): Promise<Query | void> {
        // if (this.callback_queryable === true) {
        //     var message = "Cannot call `recieve()` on Subscriber created with callback:";
        //     console.log(message);
        //     return
        // }

        // QueryWS -> Query
        let opt_query_ws = await this.remote_queryable.recieve();
        if (opt_query_ws != undefined) {

            let query_ws = opt_query_ws[0];
            let reply_tx = opt_query_ws[1];

            let key_expr: KeyExpr = KeyExpr.new(query_ws.key_expr);
            let payload: Option<ZBytes> = null;
            let attachment: Option<ZBytes> = null;
            if (query_ws.payload != null) {
                payload = ZBytes.new(query_ws.payload)
            }
            if (query_ws.attachment != null) {
                attachment = ZBytes.new(query_ws.attachment);
            }
            return Query.new(
                key_expr,
                query_ws.parameters,
                payload,
                attachment,
                query_ws.encoding,
                remote_queryable,
            );
        } else {
            console.log("Receieve returned unexpected void from RemoteQueryable")
            return
        }
    }

    async undeclare() {
        this.remote_queryable.undeclare();
    }

    static async new(
        remote_queryable: RemoteQueryable,
    ): Promise<Subscriber> {
        return new Queryable(remote_queryable);
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
    private _keyexpr: KeyExpr
    private _payload: ZBytes
    private _kind: SampleKind
    // TODO : Add Encoding

    keyexpr(): KeyExpr {
        return this._keyexpr;
    }
    payload(): ZBytes {
        return this._payload;
    }
    kind(): SampleKind {
        return this._kind;
    }
    constructor(
        keyexpr: KeyExpr,
        payload: ZBytes,
        kind: SampleKind) {
        this._keyexpr = keyexpr
        this._payload = payload
        this._kind = kind
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


export class Parameters { }
// export class Selector { }


// TODO replace encoding with Proper Type
export class Query {
    private _key_expr: KeyExpr;
    private _parameters: Parameters;
    private _payload: Option<ZBytes>;
    private _attachment: Option<ZBytes>;
    private _encoding: string | null;
    private _remote_session: RemoteSession;

    selector() {
        // return new Selector
    }

    key_expr(): KeyExpr {
        return this._key_expr
    }
    parameters(): Parameters {
        return this._parameters
    }
    payload(): Option<ZBytes> {
        return this._payload;
    }
    encoding(): string | null {
        return this._encoding
    }
    attachment(): Option<ZBytes> {
        return this._attachment
    }

    async reply(sample: Sample): Promise<void> { }
    async reply_err(error: IntoZBytes): Promise<void> { }
    async reply_del(error: IntoZBytes): Promise<void> { }

    private constructor(
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: string | null,
        remote_sesison: RemoteSession,
    ) {
        this._key_expr = key_expr;
        this._parameters = parameters;
        this._payload = payload;
        this._attachment = attachment;
        this._encoding = encoding;
        this._remote_session = remote_sesison;
    }

    static new(
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: string | null,
        // 
        remote_sesison: RemoteQueryable
    ) {

        return new Query(
            key_expr,
            parameters,
            payload,
            attachment,
            encoding,
            remote_sesison,
        );
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
    private remote_session: RemoteSession

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

    // private map_sample_ws()

    async declare_subscriber(into_key_expr: IntoKeyExpr, handler?: ((sample: Sample) => Promise<void>)): Promise<Subscriber> {

        let key_expr = KeyExpr.new(into_key_expr);
        let remote_subscriber: RemoteSubscriber;
        let callback_subscriber = false;
        if (handler != undefined) {
            callback_subscriber = true;
            const callback_conversion = async function (sample_ws: SampleWS): Promise<void> {
                let key_expr: KeyExpr = KeyExpr.new(sample_ws.key_expr);
                let payload: ZBytes = ZBytes.new(sample_ws.value);
                let sample_kind: SampleKind = SampleKind[sample_ws.kind];
                handler(new Sample(key_expr, payload, sample_kind))
            }
            remote_subscriber = await this.remote_session.declare_subscriber(key_expr.inner(), callback_conversion);
        } else {
            remote_subscriber = await this.remote_session.declare_subscriber(key_expr.inner());
        }


        let subscriber = await Subscriber.new(remote_subscriber, callback_subscriber);
        return subscriber
    }


    async declare_queryable(into_key_expr: IntoKeyExpr, complete: boolean, handler?: ((query: Query) => Promise<void>)): Promise<Subscriber> {

        let key_expr = KeyExpr.new(into_key_expr);
        let remote_queryable: RemoteQueryable;
        let callback_queryable = false;
        if (handler != undefined) {
            callback_queryable = true;
            let remote_session = this.remote_session;
            const callback_conversion = async function (query_ws: QueryWS): Promise<void> {
                console.log("Handle Query Conversion")
                let key_expr: KeyExpr = KeyExpr.new(query_ws.key_expr);
                let payload: Option<ZBytes> = null;
                let attachment: Option<ZBytes> = null;

                if (query_ws.payload != null) {
                    payload = ZBytes.new(query_ws.payload)
                }
                if (query_ws.attachment != null) {
                    attachment = ZBytes.new(query_ws.attachment);
                }

                handler(Query.new(
                    key_expr,
                    query_ws.parameters,
                    payload,
                    attachment,
                    query_ws.encoding,
                    remote_session,
                ))
            }
            remote_queryable = await this.remote_session.declare_queryable(key_expr.inner(), complete, callback_conversion);
        } else {
            remote_queryable = await this.remote_session.declare_queryable(key_expr.inner(), complete);
        }

        let queryable = await Queryable.new(remote_queryable);
        return queryable
    }



    async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {
        let key_expr: KeyExpr = KeyExpr.new(keyexpr)

        var publisher: Publisher = await Publisher.new(key_expr, this.remote_session);
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
    static async new(into_key_expr: IntoKeyExpr, remote_session: RemoteSession): Promise<Publisher> {
        const key_expr = KeyExpr.new(into_key_expr);

        let remote_publisher: RemotePublisher = await remote_session.declare_publisher(key_expr.inner());

        return new Publisher(remote_publisher)
    }
}


export function open(config: Config): Promise<Session> {
    return Session.open(config)
}