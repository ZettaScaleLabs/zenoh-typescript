import { Option, some, none, fold } from 'fp-ts/Option';
import { SimpleChannel } from "channel-ts";
import adze from 'adze';

export function subscriber2(ke: string, handler: (key_expr: String, value: Uint8Array) => void) {
    console.log("  SUBSCRIBER 2");
    console.log("  key_expr ", ke)
    console.log("  handler ", handler)
    console.log("  Calling Handler ", handler(ke, new Uint8Array([1, 2, 3])))
}

enum CtrlMsgVar {
    OpenSession = "OpenSession",
    CloseSession = "CloseSession",
    UndeclareSession = "UndeclareSession",
}

class CreateKeyExpr {
    CreateKeyExpr: String
    constructor(input: String) {
        this.CreateKeyExpr = input;
    }
}

class CreateSubscriber {
    CreateSubscriber: String
    constructor(input: String) {
        this.CreateSubscriber = input;
    }
}

interface ControlInterface<T> {
    Control: T,
    to_json(input: T): string
}


interface Session_Msg {
    UUID: string 
}
interface KeyExpr_Msg{
    key_expr_wrapper: string 
}
interface Subscriber_Msg {
    UUID: string
}
interface Publisher_Msg {
    UUID: string
}

type FrontEndMessage = Session_Msg | KeyExpr_Msg | Subscriber_Msg | Publisher_Msg;


class WebSocketMessage {
    message: DataMessageLike | ControlMessage<FrontEndMessage>

    constructor(message: DataMessageLike) {
        this.message = message;
    }

    try_as_data_message(): Option<DataMessage> {
        if (this.message.hasOwnProperty('Data')) {
            let d_message: DataMessage = this.message as DataMessage;
            return some(d_message)
        } else {
            return none
        }
    }

    try_as_control_message(): Option<ControlMessage<FrontEndMessage>> {
        if (this.message.hasOwnProperty('Data')) {
            let d_message: ControlMessage<FrontEndMessage> = this.message as ControlMessage<FrontEndMessage>;
            return some(d_message)
        } else {
            return none
        }
    }
}


interface SampleLike {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Array<number>;
}

class Sample {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Array<number>;

    constructor(data: SampleLike) {
        this.key_expr = data.key_expr;
        this.kind = data.kind;
        this.timestamp = data.timestamp;
        this.value = data.value;
    }
}

interface DataMessageLike {
    sample: SampleLike
    get_sample(): Sample
}

// {"Data":{"Sample":{"key_expr":"demo/1","value":[91,49,49,52,48,93,32,80,117,98,32,102,114,111,109,32,82,117,115,116,33],"kind":"Put","timestamp":null}}}
class DataMessage {
    sample: Sample

    constructor(data: DataMessageLike) {
        this.sample = data.sample;
    }

    get_sample(): Sample {
        return this.sample
    }
}

class ControlMessage<T> implements ControlInterface<T> {
    Control: T;

    constructor(input: T) {
        this.Control = input;
    }
    to_json(): string {
        return JSON.stringify(this);
    }
}

interface Subscriber {
    [keyexpr: string]: (keyexpr: String, value: Uint8Array) => void
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

export class RemoteSession {

    ws: WebSocket;
    ch: SimpleChannel<string>;
    session: Option<string>;
    subscribers: Subscriber
    // worker:Worker;
    // key_expr: Array<string>;
    // ch_runner: 

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
        // this.subscribers
        for await (const data of this.ch) { // use async iterator to receive data
            handler(data);
        }

    }

    private async send_ctrl_message<T>(ctrl_msg: ControlMessage<T>) {
        // {"Control":{"CreateKeyExpr":"/demo/test"}}
        console.log("Control Message:")
        console.log(ctrl_msg.to_json())

        this.ws.send(ctrl_msg.to_json());
    }

    private async channel_receive() {
        // use async iterator to receive data

        for await (const message of this.ch) {
            // const person = new Person(data);
            println("Data Message: -", message);
            println("Type : -", typeof message);
            if (message["Session"]){
                console.log("Continue")
                continue

            }
            
            // TODO: Handle Failing here
            let ws_obj: WebSocketMessage = message as WebSocketMessage;
            // let ws_obj: WebSocketMessage = JSON.parse(message);
            let opt_ctrl_msg = ws_obj.try_as_control_message();
            if (opt_ctrl_msg._tag == "Some") {
                this.handle_control_message(opt_ctrl_msg.value)
                continue
            }
            let opt_data_msg = ws_obj.try_as_data_message();
            if (opt_data_msg._tag == "Some") {
                this.handle_data_message(opt_data_msg.value)
                continue
            }

        }
        console.log("Closed");
    }

    private async handle_control_message<T>(control_msg: ControlMessage<T>) {
        console.log("ControlMessage ", control_msg)
    }

    private async handle_data_message(data_msg: DataMessage) {

        console.log("DataMessage ", data_msg)
        for (const key of Object.keys(this.subscribers)) {
            console.log("KEY", key);
        }
    }

    //
    async declare_ke(key_expr: string) {
        this.send_ctrl_message(new ControlMessage(new CreateKeyExpr(key_expr)))
    }

    async declare_subscriber(
        key_expr: string,
        fn: (keyexpr: String, value: Uint8Array) => void
    ) {
        this.subscribers[key_expr] = fn;
        // console.log("declare_subscriber");
        // println("       key_expr", key_expr)
        // this.subscribers[key_expr]("MY KEY EXPR", new Uint8Array());
        // console.log("       this.subscribers", this.subscribers)
        this.send_ctrl_message(new ControlMessage(new CreateSubscriber(key_expr)));
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
            let msg_from_svr = JSON.parse(event.data);
            console.log("   1   MSG FROM SVR", msg_from_svr);
            chan.send(msg_from_svr)
            // console.log("   1   AFTER", msg_from_svr);

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