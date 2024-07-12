import { Option, some, none, fold } from 'fp-ts/Option';
import * as O from 'fp-ts/Option'

import { v4 as uuidv4 } from 'uuid';

export enum CtrlMsgVar {
    OpenSession = "OpenSession",
    CloseSession = "CloseSession",
    UndeclareSession = "UndeclareSession",
}

export  class CreateKeyExpr {
    CreateKeyExpr: String
    constructor(input: String) {
        this.CreateKeyExpr = input;
    }
}

export  class DeclareSubscriber {
    DeclareSubscriber: [String, String]
    constructor(key_expr: String, uuid: String) {
        this.DeclareSubscriber = [key_expr, uuid];
    }
}

export  class DeclarePublisher {
    DeclarePublisher: [String, String]
    constructor(key_expr: String, uuid: String) {
        this.DeclarePublisher = [key_expr, uuid];
    }
}

export interface ControlInterface<T> {
    Control: T,
    to_json(input: T): string
}


export interface Session_Msg {
    UUID: string
}
export interface KeyExpr_Msg {
    key_expr_wrapper: string
}
export interface Subscriber_Msg {
    UUID: string
}
export interface Publisher_Msg {
    UUID: string
}

type FrontEndMessage = Session_Msg | KeyExpr_Msg | Subscriber_Msg | Publisher_Msg;

export interface WebSocketMessageLike {
    message: DataMessageLike | ControlMessage<FrontEndMessage>
    try_as_data_message(): Option<DataMessage>;
    try_as_control_message(): Option<ControlMessage<FrontEndMessage>>;
}

export class WebSocketMessage {
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
        if (this.message.hasOwnProperty('Control')) {
            let d_message: ControlMessage<FrontEndMessage> = this.message as ControlMessage<FrontEndMessage>;
            return some(d_message)
        } else {
            return none
        }
    }
}


// ███████  █████  ███    ███ ██████  ██      ███████ 
// ██      ██   ██ ████  ████ ██   ██ ██      ██      
// ███████ ███████ ██ ████ ██ ██████  ██      █████   
//      ██ ██   ██ ██  ██  ██ ██      ██      ██      
// ███████ ██   ██ ██      ██ ██      ███████ ███████ 

export interface SampleLike {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Uint8Array;
}

export class Sample {
    key_expr: string
    kind: string
    timestamp: string | null
    value: Uint8Array;

    constructor(data: SampleLike) {
        this.key_expr = data.key_expr;
        this.kind = data.kind;
        this.timestamp = data.timestamp;
        this.value = data.value;
    }
}

// ██████   █████  ████████  █████      ███    ███ ███████ ███████ ███████  █████   ██████  ███████ 
// ██   ██ ██   ██    ██    ██   ██     ████  ████ ██      ██      ██      ██   ██ ██       ██      
// ██   ██ ███████    ██    ███████     ██ ████ ██ █████   ███████ ███████ ███████ ██   ███ █████   
// ██   ██ ██   ██    ██    ██   ██     ██  ██  ██ ██           ██      ██ ██   ██ ██    ██ ██      
// ██████  ██   ██    ██    ██   ██     ██      ██ ███████ ███████ ███████ ██   ██  ██████  ███████ 

export interface DataMessageLike {
    Sample: [SampleLike, uuidv4]
    get_sample(): Sample
    get_subscription_id(): uuidv4
}

export class DataMessage {
    Sample: Sample;
    SubscriptionID: uuidv4

    constructor(data: DataMessageLike) {
        console.log(data)
        this.Sample = data.Sample[0];
        this.SubscriptionID = data.Sample[1];
    }

    get_sample(): Sample {
        return this.Sample
    }
    get_subscription_id(): uuidv4 {
        return this.SubscriptionID
    }
}

//  ██████  ██████  ███    ██ ████████ ██████   ██████  ██          ███    ███ ███████ ███████ ███████  █████   ██████  ███████ 
// ██      ██    ██ ████   ██    ██    ██   ██ ██    ██ ██          ████  ████ ██      ██      ██      ██   ██ ██       ██      
// ██      ██    ██ ██ ██  ██    ██    ██████  ██    ██ ██          ██ ████ ██ █████   ███████ ███████ ███████ ██   ███ █████   
// ██      ██    ██ ██  ██ ██    ██    ██   ██ ██    ██ ██          ██  ██  ██ ██           ██      ██ ██   ██ ██    ██ ██      
//  ██████  ██████  ██   ████    ██    ██   ██  ██████  ███████     ██      ██ ███████ ███████ ███████ ██   ██  ██████  ███████ 

export class ControlMessage<T> implements ControlInterface<T> {
    Control: T;

    constructor(input: T) {
        this.Control = input;
    }
    to_json(): string {
        return JSON.stringify(this);
    }
}

