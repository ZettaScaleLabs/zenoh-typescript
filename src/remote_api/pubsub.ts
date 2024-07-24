import { SimpleChannel } from "channel-ts";
import { v4 as uuidv4 } from 'uuid';

// Import interface 
import { SampleWS } from "./interface/SampleWS";
import { DataMsg } from "./interface/DataMsg";
import { ControlMsg } from "./interface/ControlMsg";

// Remote Api
import { RemoteSession } from './session';

// const log = new Logger({ stylePrettyLogs: false });

function executeAsync(func: any) {
    setTimeout(func, 0);
}

// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 

type UUID = typeof uuidv4 | string

export class RemotePublisher {
    private key_expr: String;
    private publisher_id: UUID;
    private session_ref: RemoteSession;
    private undeclared: boolean;

    constructor(key_expr: String, publisher_id: UUID, session_ref: RemoteSession) {
        this.key_expr = key_expr;
        this.publisher_id = publisher_id;
        this.session_ref = session_ref;
        this.undeclared = false;
    }

    async put(value: Array<number>) {
        if (this.undeclared == true) {
            var message = "Publisher keyexpr:`" + this.key_expr + "` id:`" + this.publisher_id + "` already undeclared";
            console.log(message)
            return
        }
        let data_msg: DataMsg = { "PublisherPut": [value, this.publisher_id.toString()] };
        this.session_ref.send_data_message(data_msg);
    }

    async undeclare() {
        if (this.undeclared == true) {
            var message = "Publisher keyexpr:`" + this.key_expr + "` id:`" + this.publisher_id + "` already undeclared";
            console.log(message)
            return
        }
        this.undeclared = true;
        let ctrl_message: ControlMsg = { "UndeclarePublisher": this.publisher_id.toString() };
        this.session_ref.send_ctrl_message(ctrl_message)
    }
}

// ██████  ███████ ███    ███  ██████  ████████ ███████     ███████ ██    ██ ██████  ███████  ██████ ██████  ██ ██████  ███████ ██████  
// ██   ██ ██      ████  ████ ██    ██    ██    ██          ██      ██    ██ ██   ██ ██      ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ██████  █████   ██ ████ ██ ██    ██    ██    █████       ███████ ██    ██ ██████  ███████ ██      ██████  ██ ██████  █████   ██████  
// ██   ██ ██      ██  ██  ██ ██    ██    ██    ██               ██ ██    ██ ██   ██      ██ ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ██   ██ ███████ ██      ██  ██████     ██    ███████     ███████  ██████  ██████  ███████  ██████ ██   ██ ██ ██████  ███████ ██   ██ 

// If defined with a Callback, All samples passed to the Callback, 
// else, must call recieve on the 
export class RemoteSubscriber {
    private key_expr: String;
    private subscriber_id: UUID;
    private session_ref: RemoteSession;
    private callback?: (sample: SampleWS) => void
    private rx: SimpleChannel<SampleWS>;

    private undeclared: boolean;

    private constructor(
        key_expr: String,
        subscriber_id: UUID,
        session_ref: RemoteSession,
        rx: SimpleChannel<SampleWS>,
        callback?: (sample: SampleWS) => void
    ) {
        this.key_expr = key_expr;
        this.subscriber_id = subscriber_id;
        this.session_ref = session_ref;
        this.rx = rx;
        this.callback = callback;
        this.undeclared = false;
    }

    static async new(
        key_expr: String,
        subscriber_id: UUID,
        session_ref: RemoteSession,
        rx: SimpleChannel<SampleWS>,
        callback?: (sample: SampleWS) => void
    ) {

        // Note this will run this callback listenning for messages indefinitely
        if (callback != undefined) {
            executeAsync(async () => {
                for await (const message of rx) {
                    callback(message)
                }
            })
        }

        return new RemoteSubscriber(
            key_expr,
            subscriber_id,
            session_ref,
            rx,
            callback
        );
    }

    async recieve(): Promise<SampleWS | void> {
        if (this.undeclared == true) {
            var message = "Subscriber keyexpr:`" + this.key_expr + "` id:`" + this.subscriber_id + "`";
            console.log(message)
            return
        }

        if (this.callback != undefined) {
            var message = "Cannot Call recieve on Subscriber created with callback:`" + this.key_expr + "` id:`" + this.subscriber_id + "`";
            console.log(message)
            return
        }

        return this.rx.receive();
    }

    async undeclare() {
        if (this.undeclared == true) {
            var message = "Subscriber keyexpr:`" + this.key_expr + "` id:`" + this.subscriber_id + "` already closed";
            console.log(message)
            return
        }

        this.undeclared = true;
        let ctrl_message: ControlMsg = { "UndeclareSubscriber": this.subscriber_id.toString() };
        this.session_ref.send_ctrl_message(ctrl_message)
        this.rx.close();
    }
}
export { RemoteSession };

