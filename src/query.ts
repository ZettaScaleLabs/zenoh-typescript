


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
import { Sample, SampleKind } from "./sample";

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
    // receiver: Receiver
    private remote_queryable: RemoteQueryable;
    private reply_tx: SimpleChannel<ReplyWS>;

    constructor(remote_queryable: RemoteQueryable, reply_tx: SimpleChannel<ReplyWS>) {
        this.remote_queryable = remote_queryable;
        this.reply_tx = reply_tx;
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
        
        return new Queryable(remote_queryable, remote_queryable.reply_tx);
    }
}


//  ██████  ██    ██ ███████ ██████  ██    ██
// ██    ██ ██    ██ ██      ██   ██  ██  ██ 
// ██    ██ ██    ██ █████   ██████    ████  
// ██ ▄▄ ██ ██    ██ ██      ██   ██    ██   
//  ██████   ██████  ███████ ██   ██    ██   
//     ▀▀                                                                     

export class Query {
    private _key_expr: KeyExpr;
    private _parameters: Parameters;
    private _payload: Option<ZBytes>;
    private _attachment: Option<ZBytes>;
    private _encoding: string | null;
    private reply_tx: SimpleChannel<ReplyWS>;

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
        let reply: ReplyWS = { result: { Ok: sample_ws } };

        this.reply_tx.send(reply)
    }

    async reply(keyexpr: IntoKeyExpr, payload: IntoZBytes): Promise<void> {
        let key_expr: KeyExpr = KeyExpr.new(keyexpr);
        let z_bytes: ZBytes = ZBytes.new(payload);

        this.reply_sample(Sample.new(key_expr, z_bytes, SampleKind.PUT))
    }
    async reply_err(payload: IntoZBytes): Promise<void> {
        let z_bytes: ZBytes = ZBytes.new(payload);
        let encoding: string;

        if (this._encoding == null) {
            // TODO :What kind of encoding ? Default Value
            encoding = ""
        } else {
            encoding = this._encoding
        };

        let err: ReplyErrorWS = { payload: Array.from(z_bytes.payload()), encoding: encoding };
        let reply: ReplyWS = { result: { Err: err } };
        this.reply_tx.send(reply)
    }

    async reply_del(payload: IntoZBytes): Promise<void> {
        // let key_expr: KeyExpr = KeyExpr.new(keyexpr);
        // let z_bytes: ZBytes = ZBytes.new(payload);
        // this.reply_sample(Sample.new(key_expr, z_bytes, SampleKind.PUT))

        // TODO Add delete type
        // let reply: ReplyWS = { result: { Ok: sample } | { Err: ReplyErrorWS }, };
    }

    private constructor(
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: string | null,
        reply_tx: SimpleChannel<ReplyWS>,
    ) {
        this._key_expr = key_expr;
        this._parameters = parameters;
        this._payload = payload;
        this._attachment = attachment;
        this._encoding = encoding;
        this.reply_tx = reply_tx;
    }

    static new(
        key_expr: KeyExpr,
        parameters: Parameters,
        payload: Option<ZBytes>,
        attachment: Option<ZBytes>,
        encoding: string | null,
        reply_tx: SimpleChannel<ReplyWS>
    ) {
        return new Query(
            key_expr,
            parameters,
            payload,
            attachment,
            encoding,
            reply_tx,
        );
    }
}


export class Parameters { }
// export class Selector { }

// TODO Implement Reply API
export class Reply {

}