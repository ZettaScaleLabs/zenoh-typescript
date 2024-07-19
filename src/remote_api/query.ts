import { SimpleChannel } from "channel-ts";
import { Logger } from "tslog";

// Import interface 
import { SampleWS } from "./interface/SampleWS";
import { DataMsg } from "./interface/DataMsg";
import { ControlMsg } from "./interface/ControlMsg";

// Remote Api
import { RemoteSession, UUIDv4 } from './session';
import { QueryWS } from "./interface/QueryWS";
import { ReplyWS } from "./interface/ReplyWS";

// const log = new Logger({ stylePrettyLogs: false });

function executeAsync(func: any) {
    setTimeout(func, 0);
}

// ██████  ███████ ███    ███  ██████  ████████ ███████      ██████  ██    ██ ███████ ██████  ██    ██  █████  ██████  ██      ███████ 
// ██   ██ ██      ████  ████ ██    ██    ██    ██          ██    ██ ██    ██ ██      ██   ██  ██  ██  ██   ██ ██   ██ ██      ██      
// ██████  █████   ██ ████ ██ ██    ██    ██    █████       ██    ██ ██    ██ █████   ██████    ████   ███████ ██████  ██      █████   
// ██   ██ ██      ██  ██  ██ ██    ██    ██    ██          ██ ▄▄ ██ ██    ██ ██      ██   ██    ██    ██   ██ ██   ██ ██      ██      
// ██   ██ ███████ ██      ██  ██████     ██    ███████      ██████   ██████  ███████ ██   ██    ██    ██   ██ ██████  ███████ ███████ 
//                                                              ▀▀                                                                     

// If defined with a Callback, All samples passed to the Callback, 
// else, must call recieve on the 
export class RemoteQueryable {
    private key_expr: String;
    private queryable_id: UUIDv4;
    private session_ref: RemoteSession;
    private callback?: (sample: QueryWS) => void
    // 
    private rx: SimpleChannel<QueryWS>;
    //
    private tx: SimpleChannel<ReplyWS>;

    private undeclared: boolean;

    private constructor(
        key_expr: String,
        queryable_id: UUIDv4,
        session_ref: RemoteSession,
        rx: SimpleChannel<QueryWS>,
        callback?: (sample: QueryWS) => void
    ) {
        this.key_expr = key_expr;
        this.queryable_id = queryable_id;
        this.session_ref = session_ref;
        this.rx = rx;
        this.callback = callback;
        this.undeclared = false;
    }

    static async new(
        key_expr: String,
        queryable_id: UUIDv4,
        session_ref: RemoteSession,
        rx: SimpleChannel<QueryWS>,
        tx: SimpleChannel<ReplyWS>,
        callback?: (sample: QueryWS) => void
    ) {

        // Note this will run this callback listenning for messages indefinitely
        if (callback != undefined) {
            executeAsync(async () => {
                for await (const message of rx) {
                    callback(message)
                }
            })
        }

        return new RemoteQueryable(
            key_expr,
            queryable_id,
            session_ref,
            rx,
            callback
        );
    }

    async recieve(): Promise<[QueryWS, SimpleChannel<ReplyWS>] | void> {
        if (this.undeclared == true) {
            var message = "Subscriber keyexpr:`" + this.key_expr + "` id:`" + this.queryable_id + "`";
            console.log(message)
            return
        }

        if (this.callback != undefined) {
            var message = "Cannot Call recieve on Subscriber created with callback:`" + this.key_expr + "` id:`" + this.queryable_id + "`";
            console.log(message)
            return
        }

        return [await this.rx.receive(), this.tx];
    }

    async undeclare() {
        if (this.undeclared == true) {
            var message = "Subscriber keyexpr:`" + this.key_expr + "` id:`" + this.queryable_id + "` already closed";
            console.log(message)
            return
        }

        this.undeclared = true;
        let ctrl_message: ControlMsg = { "UndeclareSubscriber": this.queryable_id.toString() };
        this.session_ref.send_ctrl_message(ctrl_message)
        this.rx.close();
    }
}
