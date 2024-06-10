import { Option, some, none, fold } from 'fp-ts/Option';
import { SimpleChannel } from "channel-ts";

enum CtrlMsgVar {
    OpenSession = "OpenSession",
    CloseSession = "CloseSession",
    UndeclareSession = "UndeclareSession",
}

class SessionMsg {
    Session: String
    constructor(input: String) {
        this.Session = input;
    }
}

class CreateKeyExpr {
    CreateKeyExpr: String
    constructor(input: String) {
        this.CreateKeyExpr = input;
    }
}

class DeclareSubscriber {
    DeclareSubscriber: String
    constructor(input: String) {
        this.DeclareSubscriber = input;
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
        console.log("Control Message:")
        console.log(ctrl_msg.to_json())

        this.ws.send(ctrl_msg.to_json());
    } 

    // TODO TEST
    // TODO TEST
    // TODO TEST
    // TODO TEST 
    // TODO TEST
    async channel_receive() {
        // use async iterator to receive data
        for await(const data of this.ch) { 
            var str = JSON.stringify(data, null, 4); // (Optional) beautiful indented output.
            console.log(`Data1: ${str}`);
            console.log(`New Message : ${this.subscribers}`);

            for (const [key, func] of Object.keys(this.subscribers.keys)) {
                console.log(`${key}: ${func}`);
            }
            console.log(`Received: ${data}`);
        }
        console.log("Closed");
    }

    //
    async declare_ke(key_expr: string) {
        this.send_ctrl_message(new ControlMessage(new CreateKeyExpr(key_expr)))
    }

    async declare_subscriber(key_expr: string, handler: (keyexpr: String, value: Uint8Array) => void){
        this.subscribers[key_expr] = handler;
        this.send_ctrl_message(new ControlMessage(new DeclareSubscriber(key_expr)));
    }

    static async new(config: string): Promise<RemoteSession> {
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

            console.log(msg_from_svr)

            chan.send(event)
        };
        
        // const worker = new Worker("worker.js");
        // worker.onmessage = function(event:any) {
        //     console.log("Worker recieved message")
        // }

        while (ws.readyState != 1) {
            await sleep(1);
        }

        var session = new RemoteSession(ws, chan);
        session.channel_receive();
        return session
    }
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}