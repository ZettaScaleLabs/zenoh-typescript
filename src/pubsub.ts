// Remote API
import { RemoteSubscriber, RemotePublisher } from "./remote_api/pubsub";

// API
import { KeyExpr } from "./key_expr";
import { IntoZBytes, ZBytes } from "./z_bytes";
import {
  CongestionControl,
  Priority,
  Sample,
  Sample_from_SampleWS,
} from "./sample";
import { Encoding, IntoEncoding } from "./encoding";

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

  constructor(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
  ) {
    this.remote_subscriber = remote_subscriber;
    this.callback_subscriber = callback_subscriber;
  }

  async recieve(): Promise<Sample | void> {
    if (this.callback_subscriber === true) {
      var message =
        "Cannot call `recieve()` on Subscriber created with callback:";
      console.log(message);
      return;
    }

    // from SampleWS -> Sample
    let opt_sample_ws = await this.remote_subscriber.recieve();
    if (opt_sample_ws != undefined) {
      return Sample_from_SampleWS(opt_sample_ws);
    } else {
      console.log("Receieve returned unexpected void from RemoteSubscriber");
      return;
    }
  }

  async undeclare() {
    this.remote_subscriber.undeclare();
  }

  static async new(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
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
  private _remote_publisher: RemotePublisher;
  private _key_expr: KeyExpr;
  private _congestion_control: CongestionControl;
  private _priority: Priority;

  private constructor(
    publisher: RemotePublisher,
    key_expr: KeyExpr,
    congestion_control: CongestionControl,
    priority: Priority,
  ) {
    this._remote_publisher = publisher;
    this._key_expr = key_expr;
    this._congestion_control = congestion_control;
    this._priority = priority;
  }

  /**
   * gets the KeyExpression from Publisher
   *
   * @returns KeyExpr instance
   */
  key_expr(): KeyExpr {
    return this._key_expr;
  }
  
  /**
   * Puts a payload on the publisher associated with this class instance
   *
   * @param payload    - something that can be converted into a ZBytes
   * @param encoding   - something that can be converted into an encoding
   * @param attachment - something that can be converted into a ZBytes
   *
   * @returns Promise<void>
   */
  put(
    payload: IntoZBytes,
    encoding?: IntoEncoding,
    attachment?: IntoZBytes,
  ): Promise<void> {
    let zbytes: ZBytes = ZBytes.new(payload);
    let _encoding;
    if (encoding != null) {
      _encoding = Encoding.into_Encoding(encoding);
    } else {
      _encoding = Encoding.default();
    }

    let _attachment = null;
    if (attachment != null) {
      let att_bytes = ZBytes.new(attachment);
      _attachment = Array.from(att_bytes.payload());
    }

    return this._remote_publisher.put(
      Array.from(zbytes.payload()),
      _attachment,
      _encoding.toString(),
    );
  }


   /**
   * get Priority declared for Publisher
   *   
   * @returns Priority
   */
  priority(): Priority {
    return this._priority;
  }

  /**
   * get Congestion Control for a Publisher
   *   
   * @returns CongestionControl
   */
  congestion_control(): CongestionControl {
    return this._congestion_control;
  }

  /**
   * undeclares publisher
   *   
   * @returns void
   */
  async undeclare() {
    await this._remote_publisher.undeclare();
  }

  /**
   * Creates a new Publisher on a session
   * @param keyexpr -  A Key Expression
   * @param session -  A Session to create the publisher on
   * @param congestion_control -  Congestion control 
   * @param priority -  Priority for Zenoh Data
   * @returns a new Publisher instance
   */
  static async new(
    key_expr: KeyExpr,
    remote_publisher: RemotePublisher,
    congestion_control: CongestionControl,
    priority: Priority,
  ): Promise<Publisher> {
    return new Publisher(
      remote_publisher,
      key_expr,
      congestion_control,
      priority,
    );
  }
}