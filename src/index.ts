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

// Interface Files
import { SampleWS } from './remote_api/interface/SampleWS'
import { QueryWS } from './remote_api/interface/QueryWS'


// Remote API
import { RemoteSession } from './remote_api/session'
import { RemoteQueryable } from './remote_api/query'

// API Layer Files
import { KeyExpr, IntoKeyExpr } from './key_expr'
import { ZBytes, IntoZBytes} from './z_bytes'
import { Sample, SampleKind } from './sample'
import { RemoteSubscriber } from './remote_api/pubsub'
import { Publisher, Subscriber } from './pubsub'
// import { Query } from './query'

export type Option<T> = T | null;

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

    async declare_queryable(into_key_expr: IntoKeyExpr, complete: boolean, handler?: ((query: Query) => Promise<void>)): Promise<Queryable> {
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

        // remote_queryable
        let queryable = await Queryable.new(remote_queryable);
        return queryable
    }



    async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {
        let key_expr: KeyExpr = KeyExpr.new(keyexpr)

        var publisher: Publisher = await Publisher.new(key_expr, this.remote_session);
        return publisher
    }

}



export function open(config: Config): Promise<Session> {
    return Session.open(config)
}