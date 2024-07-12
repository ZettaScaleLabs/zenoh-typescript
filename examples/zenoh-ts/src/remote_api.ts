import { Option, some, none, fold } from 'fp-ts/Option';
import * as O from 'fp-ts/Option'
import { SimpleChannel } from "channel-ts";
import adze from 'adze';
import { v4 as uuidv4 } from 'uuid';

// Import interface 
import { RemoteAPIMsg } from "./interface/RemoteAPIMsg";
import { SampleWS } from "./interface/SampleWS";
import { SampleKindWS } from "./interface/SampleKindWS";
import { ErrorMsg } from "./interface/ErrorMsg";
import { DataMsg } from "./interface/DataMsg";
import { ControlMsg } from "./interface/ControlMsg";

// Import My interface
import { CtrlMsgVar, CreateKeyExpr, DeclareSubscriber, DeclarePublisher, } from "./my_interface";
import { Session_Msg, KeyExpr_Msg, Subscriber_Msg, } from "./my_interface";
import { Publisher_Msg, WebSocketMessageLike, WebSocketMessage, } from "./my_interface";
import { SampleLike, Sample, DataMessageLike, DataMessage, ControlMessage } from "./my_interface";


export function subscriber2(ke: string, handler: (key_expr: String, value: Uint8Array) => void) {
    console.log("  SUBSCRIBER 2");
    console.log("  key_expr ", ke)
    console.log("  handler ", handler)
    console.log("  Calling Handler ", handler(ke, new Uint8Array([1, 2, 3])))
}

interface Subscriber {
    [subscriber_uuid: string]: (keyexpr: String, value: Uint8Array) => void
}

// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 


export class Publisher {
    key_expr: String;
    publisher_id: uuidv4;
    ws: WebSocket;

    constructor(key_expr: String, publisher_id: uuidv4, ws: WebSocket) {
        this.key_expr = key_expr;
        this.publisher_id = publisher_id;
        this.ws = ws;
    }

    put(value: String) {
        // 
        let sample: SampleWS = {
            "key_expr": this.key_expr,
            "kind": "PUT",
            "value": value,
        };


        let datamsg: DataMsg = {
            Sample: [sample, this.publisher_id]
        };

        let websocket_message = new WebSocketMessage(datamsg);

        let remote_api_message: RemoteAPIMsg = { "Data": datamsg };

        let string_message = JSON.stringify(websocket_message);


        this.ws.send(string_message);
    }

    async undeclare() {
        console.log("TODO Undeclare Publisher")
    }
}

export type SubCallback = (keyexpr: String, value: Uint8Array) => void;

export class SubClass {
    fn: SubCallback;
    key_expr: String
    constructor(key_expr: String, fn: SubCallback) {
        this.fn = fn
        this.key_expr = key_expr
    }
}


// ██████  ███████ ███    ███  ██████  ████████ ███████     ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// ██   ██ ██      ████  ████ ██    ██    ██    ██          ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// ██████  █████   ██ ████ ██ ██    ██    ██    █████       ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
// ██   ██ ██      ██  ██  ██ ██    ██    ██    ██               ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// ██   ██ ███████ ██      ██  ██████     ██    ███████     ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

export class RemoteSession {

    ws: WebSocket;
    ch: SimpleChannel<string>;
    session: Option<string>;
    subscribers: Subscriber

    // private constructor(ws: WebSocket, ch: SimpleChannel<string>, worker:Worker) {
    private constructor(ws: WebSocket, ch: SimpleChannel<string>) {
        this.ws = ws;
        this.ch = ch;
        this.session = none;
        this.subscribers = {};
    }

    async put(keyexpr: string, val: string): Promise<void> {
        let json = {
            "keyexpr": keyexpr,
            "val": val
        };

        this.ws.send(JSON.stringify(json));
    }

    async subscriber(keyexpr: string, handler: ((val: string) => Promise<void>)): Promise<void> {
        for await (const data of this.ch) { // use async iterator to receive data
            handler(data);
        }
    }

    private async send_ctrl_message<T>(ctrl_msg: ControlMessage<T>) {
        console.log("Control Message:")
        console.log(ctrl_msg.to_json())

        this.ws.send(ctrl_msg.to_json());
    }

    private async channel_receive() {
        // use async iterator to receive data

        for await (const message of this.ch) {

            let ws_message_like: DataMessageLike = JSON.parse(message) as DataMessageLike;
            let ws_message = new WebSocketMessage(ws_message_like);

            println("Data Message: -", ws_message);
            println("Type : -", typeof ws_message);
            if (ws_message.hasOwnProperty('Session')) {
                console.log("Continue Ignore Session Messages")
                continue
            }

            // TODO: Clean Up checking of Value 
            let opt_ctrl_msg = ws_message.try_as_control_message();
            if (opt_ctrl_msg._tag == "Some") {
                this.handle_control_message(opt_ctrl_msg.value["Control"])
                continue
            }
            let opt_data_msg = ws_message.try_as_data_message();
            if (opt_data_msg._tag == "Some") {
                this.handle_data_message(opt_data_msg.value["Data"])
                continue
            }

        }
        console.log("Closed");
    }

    private async handle_control_message<T>(control_msg: ControlMessage<T>) {
        console.log("ControlMessage ", control_msg)
    }

    private async handle_data_message(data_msg_like: DataMessageLike) {
        let data_msg = new DataMessage(data_msg_like)
        for (const sub_id_key of Object.keys(this.subscribers)) {

            let sub_id_msg: uuidv4 = data_msg.get_subscription_id();
            let sample: Sample = data_msg.get_sample();

            if (sub_id_msg == sub_id_key) {
                // TODO : matching logic of keyexpr

                this.subscribers[sub_id_msg](sample.key_expr, sample.value);
                break
            }
        }
    }

    async declare_ke(key_expr: string) {
        this.send_ctrl_message(new ControlMessage(new CreateKeyExpr(key_expr)))
    }

    async declare_subscriber(
        key_expr: string,
        fn: (keyexpr: String, value: Uint8Array) => void
    ) {
        let uuid = uuidv4();
        this.subscribers[uuid] = fn;
        this.send_ctrl_message(new ControlMessage(new DeclareSubscriber(key_expr, uuid)));
    }

    async declare_publisher(
        key_expr: string,
    ): Promise<Publisher> {
        let uuid = uuidv4();

        let publisher = new Publisher(key_expr, uuid, this.ws);

        this.send_ctrl_message(new ControlMessage(new DeclarePublisher(key_expr, uuid)));

        return publisher
    }

    static async new(config: string): Promise<RemoteSession> {
        adze().info(`New Remote Session`);
        const chan = new SimpleChannel<string>(); // creates a new simple channel
        let ws = new WebSocket(config);

        ws.onopen = function (event: any) {
            // `this` here is a websocket object
            var ctrl_msg = new ControlMessage(CtrlMsgVar.OpenSession);
            this.send(ctrl_msg.to_json());
        };

        ws.onmessage = function (event: any) {
            // `this` here is a websocket object
            console.log("   MSG FROM SVR", event.data);
            chan.send(event.data)
        };

        while (ws.readyState != 1) {
            adze().debug("Websocket Ready State " + ws.readyState)
            await sleep(100);
        }

        var session = new RemoteSession(ws, chan);
        session.channel_receive();
        adze().info(`Return Session`);
        return session
    }
}

function println(msg: string, obj: any) {
    console.log(msg, JSON.stringify(obj))
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}