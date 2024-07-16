import { Option, some, none, fold } from 'fp-ts/Option';
import { SimpleChannel } from "channel-ts";
import adze from 'adze';
import { v4 as uuidv4 } from 'uuid';

// Import interface 
import { RemoteAPIMsg } from "./interface/RemoteAPIMsg";
import { SampleWS } from "./interface/SampleWS";
import { SampleKindWS } from "./interface/SampleKindWS";
import { DataMsg } from "./interface/DataMsg";
import { ControlMsg } from "./interface/ControlMsg";
import { OwnedKeyExprWrapper } from './interface/OwnedKeyExprWrapper';

export function subscriber2(ke: string, handler: (key_expr: String, value: Uint8Array) => void) {
    console.log("  SUBSCRIBER 2");
    console.log("  key_expr ", ke)
    console.log("  handler ", handler)
    console.log("  Calling Handler ", handler(ke, new Uint8Array([1, 2, 3])))
}

// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 


type UUID = typeof uuidv4 | string
export class Publisher {
    key_expr: String;
    publisher_id: UUID;
    session_ref: RemoteSession;
    private undeclared: boolean;

    constructor(key_expr: String, publisher_id: UUID, session_ref: RemoteSession) {
        this.key_expr = key_expr;
        this.publisher_id = publisher_id;
        this.session_ref = session_ref;
        this.undeclared = false;
    }

    put(value: Array<number>) {
        if (this.undeclared == true) {
            var message = "Publisher keyexpr:`" + this.key_expr + "` id:`" + this.publisher_id + "`";
            console.log(message)
            return
        }
        let data_msg: DataMsg = { "PublisherPut": [value, this.publisher_id] };
        this.session_ref.send_data_message(data_msg);
    }

    async undeclare() {
        if (this.undeclared == true) {
            var message = "Publisher keyexpr:`" + this.key_expr + "` id:`" + this.publisher_id + "` already closed";
            console.log(message)
            return
        }
        this.undeclared = true;
        let ctrl_message: ControlMsg = { "UndeclarePublisher": this.publisher_id };
        this.session_ref.send_ctrl_message(ctrl_message)
    }
}

export type SubCallback = (keyexpr: String, value: Uint8Array) => void;

export class Subscriber {
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

interface Subscriber {
    [subscriber_uuid: string]: (keyexpr: String, value: Uint8Array) => void
}

type JSONMessage = string;
type UUIDv4 = String | string;

export class RemoteSession {

    ws: WebSocket;
    chan: SimpleChannel<JSONMessage>;
    session: Option<UUIDv4>;
    subscribers: Subscriber

    private constructor(ws: WebSocket, chan: SimpleChannel<JSONMessage>) {
        this.ws = ws;
        this.chan = chan;
        this.session = none;
        this.subscribers = {};
    }

    // 
    // Initialize Class
    // 
    static async new(config: string): Promise<RemoteSession> {
        adze().info(`New Remote Session`);
        const chan = new SimpleChannel<JSONMessage>(); // creates a new simple channel
        let ws = new WebSocket(config);

        ws.onopen = function (_event: any) {
            // `this` here is a websocket object
            let control_message: ControlMsg = "OpenSession";
            let remote_api_message: RemoteAPIMsg = { "Control": control_message };
            this.send(JSON.stringify(remote_api_message));
        };

        ws.onmessage = function (event: any) {
            // `this` here is a websocket object
            // console.log("   MSG FROM SVR", event.data);
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

    // 
    // Zenoh Session Functions
    // 
    // Put 
    async put(key_expr: string, payload: Array<number>): Promise<void> {
        console.log(payload);
        let owned_keyexpr: OwnedKeyExprWrapper = key_expr;
        let data_message: DataMsg = { "Put": { key_expr: owned_keyexpr, payload: payload } };

        // let 
        this.send_data_message(data_message)
    }

    // get 
    async get(selector: string): Promise<void> {
        // TODO GET 
        // let control_message: ControlMsg = { "Put": { key_expr: OwnedKeyExprWrapper, payload: Array<number>, } };
        // this.ws.send(JSON.stringify(json));
    }

    // delete 
    async delete(key_expr: string): Promise<void> {
        let owned_keyexpr: OwnedKeyExprWrapper = key_expr;
        let data_message: DataMsg = { "Delete": { key_expr: owned_keyexpr } };
        this.send_data_message(data_message);
    }

    // async declare_ke(key_expr: string) {
    //     let control_message: ControlMsg = { "CreateKeyExpr": key_expr };
    //     this.send_ctrl_message(control_message);
    // }

    async declare_subscriber(
        key_expr: string,
        fn: (keyexpr: String, value: Uint8Array) => void
    ) {
        //                                                        KeyExpr, Uuid
        let uuid = uuidv4();
        let control_message: ControlMsg = { "DeclareSubscriber": { key_expr: key_expr, id: uuid } };

        this.subscribers[uuid] = fn;
        this.send_ctrl_message(control_message);
    }

    async declare_publisher(
        key_expr: string,
    ): Promise<Publisher> {

        let uuid: string = uuidv4();
        let publisher = new Publisher(key_expr, uuid, this);
        let control_message: ControlMsg = { "DeclarePublisher": { key_expr: key_expr, id: uuid } };
        this.send_ctrl_message(control_message);
        return publisher
    }

    async subscriber(key_expr: string, handler: ((val: string) => Promise<void>)): Promise<void> {
        for await (const data of this.chan) { // use async iterator to receive data
            handler(data);
        }
    }

    // 
    // Sending Messages
    // 
    async send_data_message(data_message: DataMsg) {
        let remote_api_message: RemoteAPIMsg = { "Data": data_message };
        this.send_remote_api_message(remote_api_message);
    }

    async send_ctrl_message(ctrl_message: ControlMsg) {
        let remote_api_message: RemoteAPIMsg = { "Control": ctrl_message };
        this.send_remote_api_message(remote_api_message);
    }

    private async send_remote_api_message(remote_api_message: RemoteAPIMsg) {
        this.ws.send(JSON.stringify(remote_api_message));
    }

    // 
    // Manager Session and handle messages
    // 
    private async channel_receive() {
        // use async iterator to receive data
        for await (const message of this.chan) {

            let remote_api_message: RemoteAPIMsg = JSON.parse(message) as RemoteAPIMsg;
            // println("         Parsed Remote API message ", remote_api_message);
            // println("Type : -", typeof remote_api_message);
            // println("Message : -", remote_api_message);
            // println("Session : -", remote_api_message.hasOwnProperty('Session'));
            // println("Control : -", remote_api_message.hasOwnProperty('Control'));
            // println("Data : -", remote_api_message.hasOwnProperty('Data'));

            if ('Session' in remote_api_message) {
                console.log("Continue Ignore Session Messages")
                continue
            } else if ('Control' in remote_api_message) {
                this.handle_control_message(remote_api_message["Control"])
                continue
            } else if ("Data" in remote_api_message) {
                this.handle_data_message(remote_api_message["Data"])
                continue
            }
            else {
                adze().error(`RemoteAPIMsg Does not contain known Members`, remote_api_message);
            }
        }
        console.log("Closed");
    }

    private async handle_control_message(control_msg: ControlMsg) {
        ///
        console.log("ControlMessage ", control_msg)
        if ('Session' in control_msg) {
            this.session = some(control_msg["Session"]);
        }
    }

    private async handle_data_message(data_msg: DataMsg) {

        for (const sub_id_key of Object.keys(this.subscribers)) {
            if ('Sample' in data_msg) {

                let sample: SampleWS = data_msg[0];
                let subscription_uuid: UUIDv4 = data_msg[1];

                if (subscription_uuid == sub_id_key) {
                    this.subscribers[subscription_uuid](sample.key_expr, sample.value);
                    break
                }
            }
        }
    }


}

function println(msg: string, obj: any) {
    console.log(msg, JSON.stringify(obj))
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}