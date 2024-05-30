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

class DataMessage {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Array<number>;

    constructor(key_expr: string, kind: string, timestamp: string | null, value: Array<number>) {
        this.key_expr = key_expr;
        this.kind = kind;
        this.timestamp = timestamp;
        this.value = value;
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

type DescribableFunction = {
    (keyexpr: String, value: Uint8Array): void
};



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

    async send_ctrl_message<T>(ctrl_msg: ControlMessage<T>) {
        // {"Control":{"CreateKeyExpr":"/demo/test"}}
        console.log("Control Message:")
        console.log(ctrl_msg.to_json())

        this.ws.send(ctrl_msg.to_json());
    }


    async channel_receive() {
        // use async iterator to receive data
        for await (const data of this.ch) {
            println("Data1: ", data);
            // console.log("       channel_receive this.subscribers", this.subscribers)
            // console.log("       channel_receive this.subscribers", Object.keys(this.subscribers))

            for (const key of Object.keys(this.subscribers)) {
                console.log("KEY", key);
            }
            console.log(`Received: ${data}`);
        }
        console.log("Closed");
    }

    //
    async declare_ke(key_expr: string) {
        this.send_ctrl_message(new ControlMessage(new CreateKeyExpr(key_expr)))
    }

    async declare_subscriber(
        key_expr: string,
        fn: (keyexpr: String, value: Uint8Array)=> void
    ) {
        this.subscribers[key_expr] = fn;
        // console.log("declare_subscriber");
        // println("       key_expr", key_expr)
        // console.log("       CALL FUNCTION")
        // this.subscribers[key_expr]("MY KEY EXPR", new Uint8Array());
        // console.log("       END FUNCTION")
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
            let msg_from_svr = JSON.parse(event.data) as DataMessage;
            console.log("msg_from_svr",msg_from_svr);
            console.log(msg_from_svr)
            chan.send(event)
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