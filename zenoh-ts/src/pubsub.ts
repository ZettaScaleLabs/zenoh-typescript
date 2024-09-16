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

  static registry: FinalizationRegistry<RemoteSubscriber> = new FinalizationRegistry((r_subscriber: RemoteSubscriber) => r_subscriber.undeclare());

  dispose() {
    this.undeclare();
    Subscriber.registry.unregister(this);
  }

  constructor(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
  ) {
    this.remote_subscriber = remote_subscriber;
    this.callback_subscriber = callback_subscriber;
    Subscriber.registry.register(this, remote_subscriber, this)
  }

  async receive(): Promise<Sample | void> {
    if (this.callback_subscriber === true) {
      console.log("Cannot call `receive()` on Subscriber created with callback:");
      return;
    }

    // from SampleWS -> Sample
    let opt_sample_ws = await this.remote_subscriber.receive();
    if (opt_sample_ws != undefined) {
      return Sample_from_SampleWS(opt_sample_ws);
    } else {
      console.log("Receieve returned unexpected void from RemoteSubscriber");
      return;
    }
  }

  undeclare() {
    this.remote_subscriber.undeclare();
    Subscriber.registry.unregister(this);
  }

  static async new(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
  ): Promise<Subscriber> {
    return new Subscriber(remote_subscriber, callback_subscriber);
  }
}

export enum ChannelType {
  Ring,
  Fifo,
}

export interface Handler {
  size: number;
  channel_type: ChannelType;
}

export class RingChannel implements Handler {
  size: number
  channel_type: ChannelType = ChannelType.Ring;
  constructor(size: number) {
    this.size = size;
  }
}

export class FifoChannel implements Handler {
  size: number
  channel_type: ChannelType = ChannelType.Fifo;
  constructor(size: number) {
    this.size = size;
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
  static registry: FinalizationRegistry<RemotePublisher> = new FinalizationRegistry((r_publisher: RemotePublisher) => r_publisher.undeclare());

  dispose() {
    this.undeclare();
    Publisher.registry.unregister(this);
  }

  private constructor(
    remote_publisher: RemotePublisher,
    key_expr: KeyExpr,
    congestion_control: CongestionControl,
    priority: Priority,
  ) {
    this._remote_publisher = remote_publisher;
    this._key_expr = key_expr;
    this._congestion_control = congestion_control;
    this._priority = priority;
    Publisher.registry.register(this, remote_publisher, this)
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
  ): void {
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
  undeclare() {
    this._remote_publisher.undeclare();
    Publisher.registry.unregister(this);
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
