


import { SimpleChannel } from "channel-ts";
// Remote API
import { RemoteQueryable } from "./remote_api/query";
import { ReplyWS } from "./remote_api/interface/ReplyWS";
import { SampleWS } from "./remote_api/interface/SampleWS";
import { SampleKindWS } from "./remote_api/interface/SampleKindWS";
import { OwnedKeyExprWrapper } from "./remote_api/interface/OwnedKeyExprWrapper";
import { ReplyErrorWS } from "./remote_api/interface/ReplyErrorWS";
// Remote API
import { IntoKeyExpr, KeyExpr } from "./key_expr";
import { IntoZBytes, ZBytes } from "./z_bytes";
import { Sample, SampleKind, Sample_from_SampleWS } from "./sample";
import { UUIDv4 } from "./remote_api/session";
import { QueryWS } from "./remote_api/interface/QueryWS";
import { Encoding } from "./encoding";

//  ██████  ██    ██ ███████ ██████  ██    ██  █████  ██████  ██      ███████ 
// ██    ██ ██    ██ ██      ██   ██  ██  ██  ██   ██ ██   ██ ██      ██      
// ██    ██ ██    ██ █████   ██████    ████   ███████ ██████  ██      █████   
// ██ ▄▄ ██ ██    ██ ██      ██   ██    ██    ██   ██ ██   ██ ██      ██      
//  ██████   ██████  ███████ ██   ██    ██    ██   ██ ██████  ███████ ███████ 
//     ▀▀                                                                     

export type Option<T> = T | null;

export class Queryable {

    /**
     * Class to hold pointer to subscriber in Wasm Memory
     */
    private _remote_queryable: RemoteQueryable;

    constructor(remote_queryable: RemoteQueryable) {
        this._remote_queryable = remote_queryable;
    }

    async recieve(): Promise<Query | void> {
        // TODO: Make this Callback Subscriber ?
        // if (this.callback_queryable === true) {
        //     var message = "Cannot call `recieve()` on Subscriber created with callback:";
        //     console.log(message);
        //     return
        // }

        // QueryWS -> Query
        let opt_query_ws = await this._remote_queryable.recieve();
        if (opt_query_ws != undefined) {

            let query_ws = opt_query_ws[0];
            let reply_tx = opt_query_ws[1];
            return QueryWS_to_Query(query_ws, reply_tx);
        } else {
            console.log("Receieve returned unexpected void from RemoteQueryable")
            return
        }
    }

    async undeclare() {
        this._remote_queryable.undeclare();
    }

    static async new(
        remote_queryable: RemoteQueryable,
    ): Promise<Queryable> {

        return new Queryable(remote_queryable);
    }
}

export function QueryWS_to_Query(query_ws: QueryWS, reply_tx: SimpleChannel<ReplyWS>): Query {
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
        query_ws.query_uuid,
        key_expr,
        query_ws.parameters,
        payload,
        attachment,
        query_ws.encoding,
        reply_tx
    );
}



//  ██████  ██    ██ ███████ ██████  ██    ██
// ██    ██ ██    ██ ██      ██   ██  ██  ██ 
// ██    ██ ██    ██ █████   ██████    ████  
// ██ ▄▄ ██ ██    ██ ██      ██   ██    ██   
//  ██████   ██████  ███████ ██   ██    ██   
//     ▀▀                                                                     

export class Query {
    private _query_id: UUIDv4;
    private _key_expr: KeyExpr;
    private _parameters: Parameters;
    private _payload: Option<ZBytes>;
    private _attachment: Option<ZBytes>;
    private _encoding: Option<Encoding>;
    private _reply_tx: SimpleChannel<ReplyWS>;

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
    encoding(): Encoding | null {
        return this._encoding
    }
    attachment(): Option<ZBytes> {
        return this._attachment
    }

    // Send Reply here.
    private async reply_sample(sample: Sample): Promise<void> {
        let key_expr: OwnedKeyExprWrapper = sample.keyexpr.toString();
        let value: Array<number> = Array.from(sample.payload().payload());
        let sample_kind: SampleKindWS;
        if (sample.kind() == SampleKind.DELETE) {
            sample_kind = "Delete"
        } else if (sample.kind() == SampleKind.PUT) {
            sample_kind = "Put"
        } else {
            console.log("Sample Kind not PUT | DELETE, defaulting to PUT: ", sample.kind());
            sample_kind = "Put"
        };
        let sample_ws: SampleWS = { key_expr: key_expr, value: value, kind: sample_kind };
        let reply: ReplyWS = { query_uuid: this._query_id as string, result: { Ok: sample_ws } };

        this._reply_tx.send(reply)
    }

    async reply(keyexpr: IntoKeyExpr, payload: IntoZBytes): Promise<void> {
        let key_expr: KeyExpr = KeyExpr.new(keyexpr);
        let z_bytes: ZBytes = ZBytes.new(payload);

        this.reply_sample(Sample.new(key_expr, z_bytes, SampleKind.PUT))
    }
    async reply_err(payload: IntoZBytes): Promise<void> {
        let z_bytes: ZBytes = ZBytes.new(payload);
        let encoding: Encoding;

        if (this._encoding == null) {
            // TODO :What kind of encoding ? Default Value
            encoding = Encoding.default()
        } else {
            encoding = this._encoding
        };

        let err: ReplyErrorWS = { payload: Array.from(z_bytes.payload()), encoding: encoding.tostring() };
        let reply: ReplyWS = { query_uuid: this._query_id as string, result: { Err: err } };
        this._reply_tx.send(reply)
    }

    async reply_del(payload: IntoZBytes): Promise<void> {
        console.log("TODO reply_del")
        // let key_expr: KeyExpr = KeyExpr.new(keyexpr);
        // let z_bytes: ZBytes = ZBytes.new(payload);
        // this.reply_sample(Sample.new(key_expr, z_bytes, SampleKind.PUT))
        // TODO Add delete type
        // let reply: ReplyWS = { result: { Ok: sample } | { Err: ReplyErrorWS }, };
    }

    private constructor(
        query_id: UUIDv4,
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: Encoding | null,
        reply_tx: SimpleChannel<ReplyWS>,
    ) {
        this._query_id = query_id;
        this._key_expr = key_expr;
        this._parameters = parameters;
        this._payload = payload;
        this._attachment = attachment;
        this._encoding = encoding;
        this._reply_tx = reply_tx;
    }

    static new(
        query_id: UUIDv4,
        // 
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: Encoding | null,
        reply_tx: SimpleChannel<ReplyWS>
    ) {
        return new Query(
            query_id,
            key_expr,
            parameters,
            payload,
            attachment,
            encoding,
            reply_tx,
        );
    }
}

export class Parameters {
    private _params: String;

    private constructor(p: string) {
        this._params = p;
    }
}

export class ReplyError {
    private _payload: ZBytes;
    private _encoding: Encoding;

    payload(): ZBytes {
        return this._payload
    };
    encoding(): Encoding {
        return this._encoding
    };

    private constructor(payload: ZBytes, encoding: Encoding) {
        this._encoding = encoding;
        this._payload = payload;
    }

    static new(reply_err_ws: ReplyErrorWS): ReplyError {
        let zbytes = ZBytes.new(reply_err_ws.payload);
        let encoding = Encoding.from_str(reply_err_ws.encoding);
        return new ReplyError(zbytes, encoding);
    }
}

export class Reply {
    private _result: Sample | ReplyError;

    result(): Sample | ReplyError {
        return this._result
    }

    private constructor(result: Sample | ReplyError) {
        this._result = result
    }

    static new(reply_ws: ReplyWS): Reply | undefined {

        if ("Ok" in reply_ws.result) {
            let sample_ws = reply_ws.result["Ok"];
            let sample = Sample_from_SampleWS(sample_ws);
            return new Reply(sample);
        } else if ("Err" in reply_ws.result) {
            let sample_ws_err: ReplyErrorWS = reply_ws.result["Err"];
            let reply_error = ReplyError.new(sample_ws_err);
            return new Reply(reply_error);
        } else {
            console.log("Expected Ok or Err Variant in ReplyWS message When creating Replys")
            return
        }
    }
}

// ███████ ███████ ██      ███████  ██████ ████████  ██████  ██████  
// ██      ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ █████   ██      █████   ██         ██    ██    ██ ██████  
//      ██ ██      ██      ██      ██         ██    ██    ██ ██   ██ 
// ███████ ███████ ███████ ███████  ██████    ██     ██████  ██   ██ 

// Selector : <keyexpr>?arg1=lol&arg2=hi

export type IntoSelector = Selector | IntoKeyExpr;
export type IntoParameters = string | String | Map<string, string>

export class Selector {

    // KeyExpr object
    private key_expr: KeyExpr

    // Optional : parameter field
    private _parameters?: string;

    // Returns the key expression
    get_key_expr(): KeyExpr {
        return this.key_expr
    }

    parameters(): string {
        if (this._parameters == undefined) {
            return ""
        } else {
            return this._parameters;
        }
    }

    // Would need to replicate full logic of Parameters in Typescript
    // Returns the parameters of the selector
    /// Note: Keep this async incase in the future we want to call C code
    // parameters(): Map<string, string> {
    //     const params = new Map<string, string>();
    //     for (const pair of this._parameters?.split("&") || []) {
    //         const [key, value] = pair.split("=");
    //         params.set(key, value);
    //     }
    //     return params; // If parameter does not exist, then returns undefined
    // }


    // parameter(param_key: string): string | undefined {
    //     for (const pair of this._parameters?.split("&") || []) {
    //         const [key, value] = pair.split("=");
    //         if (key === param_key) {
    //             return value
    //         }
    //     }
    //     return undefined; // If parameter does not exist, then returns undefined
    // }

    private constructor(keyexpr: KeyExpr, parameters?: string) {
        this.key_expr = keyexpr;
        this._parameters = parameters;
    }

    static new(selector: IntoSelector, parameters?: IntoParameters): Selector {

        let key_expr: KeyExpr;
        if (selector instanceof Selector) {
            return selector;
        } else if (selector instanceof KeyExpr) {
            key_expr = selector;
        } else {
            key_expr = KeyExpr.new(selector);
        }

        if (parameters == undefined) {
            return new Selector(key_expr, "")
        } else if (parameters instanceof String) {
            return new Selector(key_expr, parameters.toString())
        } else if (parameters instanceof Map) {
            let param_list: string = "&";
            for (let entry of parameters.entries()) {
                param_list.concat(entry[0] + "=" + entry[1])
            }
            return new Selector(key_expr, param_list)
        } else {
            return new Selector(key_expr, parameters)
        }
    }
}
