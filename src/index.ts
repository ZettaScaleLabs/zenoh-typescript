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
import { SimpleChannel } from 'channel-ts';
import { Option, some, none, fold } from 'fp-ts/Option';

let ws: Option<WebSocket> = none;

export class Session {

    ws: WebSocket;
    ch: SimpleChannel<string>;

    private constructor(ws: WebSocket, ch: SimpleChannel<string>) {
        this.ws = ws;
        this.ch = ch;
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

    // private onMessage(config: string): Promise<Session> {

    // }

    static async new(config: string): Promise<Session> {

        const chan = new SimpleChannel<string>(); // creates a new simple channel

        let ws = new WebSocket(config);

        ws.onopen = function (event: any) {
            console.log("Connected to RemoteAPI")
            this.send("New Session");
        };

        ws.onmessage = function (event: any) {
            console.log("msg from server", event)
            chan.send(event)
        };

        while (ws.readyState != 1) {
            await sleep(1);
            // console.log(ws.readyState);
        }
        
        return new Session(ws, chan );
    }

    /**
     * Closes a session, cleaning up the resource in Zenoh, 
     * and unregistering the instance of the class from TypeScript
     *
     * @returns Nothing
     */
    async close() {
        // this.ws.send()
        // TODO: Is this correct ?
        // const Zenoh: Module = await zenoh();
        // await Zenoh.zw_close_session(this.__ptr)
        // Session.registry.unregister(this)
    }

    /**
     * Puts a value on the session, on a specific key expression KeyExpr 
     * 
     * @param keyexpr - something that implements intoKeyExpr
     * @param value - something that implements intoValue
     * 
     * @returns success: 0, failure : -1
     */
    async put(): Promise<number> {
    // async put(keyexpr: IntoKeyExpr, value: IntoValue): Promise<number> {

        // const [key, val]: [KeyExpr, Value] = await Promise.all([keyexpr[intoKeyExpr](), value[intoValue]()]);

        // const ret = Zenoh.zw_put(this.__ptr, key.__ptr, val.payload);
        // TODO: PUT ON WS

        // if (ret < 0) {
        //     throw `Error ${ret} while putting`
        // }
        // TODO: FIX
        return -1
    }

    /**
     * Declares a Key Expression on a session
     *
     * @param keyexpr - string of key_expression
     * 
     * @returns success: 0, failure : -1
     */
    // async declare_ke(keyexpr: string): Promise<KeyExpr> {
    async declare_ke(keyexpr: string): Promise<number> {

        // const Zenoh: Module = await zenoh();

        // const ret = Zenoh.zw_declare_ke(this.__ptr, keyexpr);

        // if (ret < 0) {
        //     throw "An error occured while Declaring Key Expr"
        // }

        // const key_expr = new KeyExpr(ret);
        // return key_expr;
        return 10;
    }

    // TODO:  Implement get
    // async get(into_selector: IntoSelector, query: Query, callback: () => void): Promise<number> {
    //     throw "TODO"
    // }

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

    // TODO : Support Sync as well ? 
    // async declare_subscriber(keyexpr: IntoKeyExpr, handler: (keyexpr: String, value: Uint8Array) => void): Promise<Subscriber<void>> {
    //     const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);

    //     const ret = await Zenoh.zw_declare_subscriber(
    //         this.__ptr,
    //         key.__ptr,
    //         (keyexpr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
    //             handler(Zenoh.UTF8ToString(keyexpr), Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len))
    //         });

    //     if (ret < 0) {
    //         throw `Error ${ret} while declaring Subscriber`
    //     }
    //     return ret
    // }

    /**
     * Declares a Subscriber handler on a Session
     *
     * @remarks
     *  The handler function will be passed to the Wasm Module and executed when a new sample arrives on the socket
     * @param keyexpr - Something that implements IntoKeyExpr
     * @param handler -  A callback function that takes a Sample and returns a Void
     * 
     * @returns success: 0, failure : -1
     */
    // async declare_subscriber_handler(keyexpr: IntoKeyExpr, handler: (sample: Sample) => void): Promise<Subscriber<void>> {
    async declare_subscriber_handler(): Promise<number> {
        // const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
        // const [key]: [KeyExpr] = await Promise.all([keyexpr[intoKeyExpr]()]);

        // const ret = await Zenoh.zw_declare_subscriber(
        //     this.__ptr,
        //     key.__ptr,
        //     async (keyexpr_ptr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
        //         // Looks into WASM Memory
        //         let uint8_array_view: Uint8Array = Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len);

        //         // Copies value from WASM to Javascript
        //         let uint8_array_cloned = new Uint8Array(uint8_array_view)
        //         // 
        //         let value = new Value(uint8_array_cloned);
        //         // TODO : Actually get the Sample kind from the Sample
        //         let kind = SampleKind.PUT;

        //         handler(new Sample(key, value, kind))
        //     });

        // if (ret < 0) {
        //     throw `Error ${ret} while declaring Subscriber`
        // }
        // return new Subscriber<void>(ret);

       return 10;
    }

    /**
     * Declares a Subscriber handler on a Session
     *
     * @remarks
     *  The handler function will be passed to the Wasm Module and executed when a new sample arrives on the socket
     * @param keyexpr - Something that implements IntoKeyExpr
     * @param handler -  A callback function that takes a Sample and returns a Void
     * 
     * @returns success: 0, failure : -1
     */
    async declare_subscriber_handler_async(): Promise<number> {
    // async declare_subscriber_handler_async(keyexpr: IntoKeyExpr, handler: (sample: Sample) => Promise<void>): Promise<Subscriber<void>> {
        // const [Zenoh, key]: [Module, KeyExpr] = await Promise.all([zenoh(), keyexpr[intoKeyExpr]()]);
        // const [key]: [ KeyExpr] = await Promise.all([ keyexpr[intoKeyExpr]()]);

        // TODO: Get KeyExpr from Sample, 
        // Therefore internally get KeyExpr from Resource Pool managed by Zenoh-pico/Zenoh-cpp WASM
        // const ret = await Zenoh.zw_declare_subscriber(
        //     this.__ptr,
        //     key.__ptr,
        //     async (keyexpr_ptr: WasmPtr, pl_start: WasmPtr, pl_len: WasmPtr) => {
        //         // console.log("Sub Before Sub Array ", pl_start, " : ", pl_start + pl_len)
        //         let uint8_array_view: Uint8Array = Zenoh.HEAPU8.subarray(pl_start, pl_start + pl_len);
        //         // console.log("After Sub Array")
        //         let uint8_array_cloned = new Uint8Array(uint8_array_view)
        //         // console.log("After Sub Array Clone to TS")

        //         let value = new Value(uint8_array_cloned);

        //         let key_expr: KeyExpr = await KeyExpr.new(Zenoh.UTF8ToString(keyexpr_ptr));
        //         let kind = SampleKind.PUT;

        //         handler(new Sample(key_expr, value, kind))
        //     });

        // if (ret < 0) {
        //     throw `Error ${ret} while declaring Subscriber`
        // }

        // TODO implement Proper Reciever
        return 10;
        // return new Subscriber<void>();
        // return new Subscriber<void>(ret);
    }

    // async declare_publisher(keyexpr: IntoKeyExpr): Promise<Publisher> {
    async declare_publisher(): Promise<number> {
 
        // TODO Test this  
        // var publisher: Publisher = await Publisher.new(keyexpr, this);
        // return publisher
        return 10
    }

}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}