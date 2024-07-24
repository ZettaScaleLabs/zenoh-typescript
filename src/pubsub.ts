
// Remote API
import { RemoteSubscriber, RemotePublisher, RemoteSession } from './remote_api/pubsub'
import { SampleWS } from './remote_api/interface/SampleWS';

// API
import { IntoKeyExpr, KeyExpr } from './key_expr'
import { IntoZBytes, ZBytes } from './z_bytes'
import { Sample, SampleKind } from './sample';

// ███████ ██    ██ ██████  ███████  ██████ ██████  ██ ██████  ███████ ██████  
// ██      ██    ██ ██   ██ ██      ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ███████ ██    ██ ██████  ███████ ██      ██████  ██ ██████  █████   ██████  
//      ██ ██    ██ ██   ██      ██ ██      ██   ██ ██ ██   ██ ██      ██   ██ 
// ███████  ██████  ██████  ███████  ██████ ██   ██ ██ ██████  ███████ ██   ██ 

export class Subscriber {

    /**
     * Class to hold pointer to subscriber in Wasm Memory
     */
    // receiver: Receiver
    private remote_subscriber: RemoteSubscriber;
    private callback_subscriber: boolean;

    constructor(remote_subscriber: RemoteSubscriber, callback_subscriber: boolean) {
        this.remote_subscriber = remote_subscriber;
        this.callback_subscriber = callback_subscriber;
    }

    async recieve(): Promise<Sample | void> {
        if (this.callback_subscriber === true) {
            var message = "Cannot call `recieve()` on Subscriber created with callback:";
            console.log(message);
            return
        }

        // from SampleWS -> Sample
        let opt_sample_ws = await this.remote_subscriber.recieve();
        if (opt_sample_ws != undefined) {
            let sample_ws: SampleWS = opt_sample_ws;
            let key_expr: KeyExpr = KeyExpr.new(sample_ws.key_expr);
            let payload: ZBytes = ZBytes.new(sample_ws.value);
            let sample_kind: SampleKind;

            if (sample_ws.kind = "Put") {
                sample_kind = SampleKind.PUT;
            } else if (sample_ws.kind = "Delete") {
                sample_kind = SampleKind.PUT;
            } else {
                console.log("Recieved Unknown SampleKind Variant from Websocket, Defaulting to PUT");
                sample_kind = SampleKind.PUT;
            }
            return Sample.new(key_expr, payload, sample_kind);
        } else {
            console.log("Receieve returned unexpected void from RemoteSubscriber")
            return
        }
    }

    async undeclare() {
        this.remote_subscriber.undeclare();
    }

    static async new(
        remote_subscriber: RemoteSubscriber,
        callback_subscriber: boolean
    ): Promise<Subscriber> {
        return new Subscriber(remote_subscriber, callback_subscriber);
    }
}


// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████  
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██ 
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████  
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██ 
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██ 
export class Publisher {
    /**
     * Class that creates and keeps a reference to a publisher inside the WASM memory
     */
    private remote_publisher: RemotePublisher;

    private constructor(publisher: RemotePublisher) {
        this.remote_publisher = publisher;
    }

    /**
     * Puts a value on the publisher associated with this class instance
     *
     * @param value -  something that can bec converted into a Value
     * 
     * @returns success: 0, failure : -1
     */
    async put(payload: IntoZBytes): Promise<void> {
        let zbytes: ZBytes = ZBytes.new(payload);

        return this.remote_publisher.put(Array.from(zbytes.payload()))
    }

    async undeclare() {
        await this.remote_publisher.undeclare()
    }

    /**
     * Creates a new Publisher on a session
     * @param keyexpr -  something that can be converted into a Key Expression
    *
     * @param session -  A Session to create the publisher on
     * 
     * @returns a new Publisher instance
     */
    static async new(into_key_expr: IntoKeyExpr, remote_session: RemoteSession): Promise<Publisher> {
        const key_expr = KeyExpr.new(into_key_expr);

        let remote_publisher: RemotePublisher = await remote_session.declare_publisher(key_expr.inner());

        return new Publisher(remote_publisher)
    }
}