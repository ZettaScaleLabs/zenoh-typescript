import { Option, some, none } from 'fp-ts/Option';
import { SimpleChannel } from "channel-ts";
import { v4 as uuidv4 } from 'uuid';
import { Logger, ILogObj } from "tslog";

const log: Logger<ILogObj> = new Logger();


// Import interface 
import { RemoteAPIMsg } from "./interface/RemoteAPIMsg";
import { SampleWS } from "./interface/SampleWS";
// import { SampleKindWS } from "./interface/SampleKindWS";
import { DataMsg } from "./interface/DataMsg";
import { ControlMsg } from "./interface/ControlMsg";
import { OwnedKeyExprWrapper } from './interface/OwnedKeyExprWrapper';


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

// ██████  ███████ ███    ███  ██████  ████████ ███████     ███████ ███████ ███████ ███████ ██  ██████  ███    ██ 
// ██   ██ ██      ████  ████ ██    ██    ██    ██          ██      ██      ██      ██      ██ ██    ██ ████   ██ 
// ██████  █████   ██ ████ ██ ██    ██    ██    █████       ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██ 
// ██   ██ ██      ██  ██  ██ ██    ██    ██    ██               ██ ██           ██      ██ ██ ██    ██ ██  ██ ██ 
// ██   ██ ███████ ██      ██  ██████     ██    ███████     ███████ ███████ ███████ ███████ ██  ██████  ██   ████ 

// interface Subscriber {
//     [subscriber_uuid: string]: (keyexpr: String, value: Uint8Array) => void
// }

type JSONMessage = string;
type UUIDv4 = String | string;

export class RemoteSession {

    ws: WebSocket;
    chan: SimpleChannel<JSONMessage>;
    session: Option<UUIDv4>;
    subscribers: Map<UUIDv4, SimpleChannel<SampleWS>>;

    private constructor(ws: WebSocket, chan: SimpleChannel<JSONMessage>) {
        this.ws = ws;
        this.chan = chan;
        this.session = none;
        this.subscribers = new Map<UUIDv4, SimpleChannel<SampleWS>>();
    }

    // 
    // Initialize Class
    // 
    static async new(url: string): Promise<RemoteSession> {
        let split = url.split("/");
        let websocket_endpoint = split[0] + "://" + split[1];

        const chan = new SimpleChannel<JSONMessage>(); // creates a new simple channel
        let ws = new WebSocket(websocket_endpoint);

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
            log.debug("Websocket Ready State " + ws.readyState)
            await sleep(100);
        }

        var session = new RemoteSession(ws, chan);
        session.channel_receive();
        log.info(`Return Session`);
        return session
    }

    // 
    // Zenoh Session Functions
    // 
    // Put 
    async put(key_expr: string, payload: Array<number>): Promise<void> {
        let owned_keyexpr: OwnedKeyExprWrapper = key_expr;
        let data_message: DataMsg = { "Put": { key_expr: owned_keyexpr, payload: payload } };
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

    async close(): Promise<void> {
        let data_message: ControlMsg = "CloseSession";
        this.send_ctrl_message(data_message);
        this.ws.close()
    }

    // async declare_ke(key_expr: string) {
    //     let control_message: ControlMsg = { "CreateKeyExpr": key_expr };
    //     this.send_ctrl_message(control_message);
    // }

    async declare_subscriber(
        key_expr: string,
        // callback?: (keyexpr: String, value: Uint8Array) => void
        callback?: ((sample: SampleWS) => Promise<void>)
    ): Promise<RemoteSubscriber> {

        let uuid = uuidv4();

        let control_message: ControlMsg = { "DeclareSubscriber": { key_expr: key_expr, id: uuid } };

        let channel: SimpleChannel<SampleWS> = new SimpleChannel<SampleWS>();

        this.subscribers.set(uuid, channel);

        this.send_ctrl_message(control_message);

        let subscriber = RemoteSubscriber.new(
            key_expr,
            uuid,
            this,
            channel,
            callback
        );
        return subscriber;
    }

    async declare_publisher(
        key_expr: string,
    ): Promise<RemotePublisher> {

        let uuid: string = uuidv4();
        let publisher = new RemotePublisher(key_expr, uuid, this);
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
                log.error(`RemoteAPIMsg Does not contain known Members`, remote_api_message);
            }
        }
        console.log("Closed");
    }

    private async handle_control_message(control_msg: ControlMsg) {

        console.log("ControlMessage ", control_msg)
        if (typeof control_msg === "string") {
            // TODO : 
            console.log(control_msg);

        } else if ((typeof control_msg === "object")) {
            if ('Session' in (control_msg)) {
                this.session = some(control_msg["Session"]);
            }
        }
    }

    private async handle_data_message(data_msg: DataMsg) {
        // console.log("handle_data_message",data_msg)
        if ("Sample" in data_msg) {

            let subscription_uuid: UUIDv4 = data_msg["Sample"][1]

            let opt_subscriber = this.subscribers.get(subscription_uuid);
            if (opt_subscriber != undefined) {

                let channel: SimpleChannel<SampleWS> = opt_subscriber;
                let sample: SampleWS = data_msg["Sample"][0];
                channel.send(sample);
            } else {
                console.log("SubscrptionUUID not in map", subscription_uuid)
            }
        }
    }
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}