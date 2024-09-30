// Remote API
import { RemoteSubscriber, RemotePublisher } from "./remote_api/pubsub";

// API
import { KeyExpr } from "./key_expr";
import { IntoZBytes, ZBytes } from "./z_bytes";
import {
  CongestionControl,
  Priority,
  Reliability,
  Sample,
  Sample_from_SampleWS,
} from "./sample";
import { Encoding, IntoEncoding } from "./encoding";

// ███████ ██    ██ ██████  ███████  ██████ ██████  ██ ██████  ███████ ██████
// ██      ██    ██ ██   ██ ██      ██      ██   ██ ██ ██   ██ ██      ██   ██
// ███████ ██    ██ ██████  ███████ ██      ██████  ██ ██████  █████   ██████
//      ██ ██    ██ ██   ██      ██ ██      ██   ██ ██ ██   ██ ██      ██   ██
// ███████  ██████  ██████  ███████  ██████ ██   ██ ██ ██████  ███████ ██   ██


/**
 * Class to represent a Subscriber on Zenoh, 
 * created via calling `declare_subscriber()` on a `session`
 */

export class Subscriber {
  /**
   * @hidden 
   */
  private remote_subscriber: RemoteSubscriber;
  /**
   * @hidden 
   */
  private callback_subscriber: boolean;
  /** Finalization registry used for cleanup on drop
   * @hidden 
   */
  static registry: FinalizationRegistry<RemoteSubscriber> = new FinalizationRegistry((r_subscriber: RemoteSubscriber) => r_subscriber.undeclare());
  /**
   * @hidden 
   */
  dispose() {
    this.undeclare();
    Subscriber.registry.unregister(this);
  }
  /**
   * @hidden 
   */
  constructor(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
  ) {
    this.remote_subscriber = remote_subscriber;
    this.callback_subscriber = callback_subscriber;
    Subscriber.registry.register(this, remote_subscriber, this)
  }

  /**
   * Receives a new message on the subscriber
   *  note: If subscriber was created with a callback, this recieve will return undefined, 
   *  as new samples are being sent to the callback.
   *
   * @returns Promise<Sample | void>
   */
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

  /**
   * Undeclares a subscriber on the session
   *
   */
  undeclare() {
    this.remote_subscriber.undeclare();
    Subscriber.registry.unregister(this);
  }

  /**
   * Create a new subscriber, 
   * note : This function should never be called directly by the user
   * please use `declare_subscriber` on a session to create a subscriber
   * @hidden
   */
  static async new(
    remote_subscriber: RemoteSubscriber,
    callback_subscriber: boolean,
  ): Promise<Subscriber> {
    return new Subscriber(remote_subscriber, callback_subscriber);
  }
}

/**
 * Type of Channel that will be created, 
 * Fifo: will block incoming messages when full
 * Ring: will drop oldest data when full
 */
export enum ChannelType {
  Ring,
  Fifo,
}

/**
 * General interface for a Handler, not to be exposed by the user
 * @hidden
 */
export interface Handler {
  size: number;
  channel_type: ChannelType;
}

/**
  * RingChannel handler: 
  *   Semantic: will drop oldest data when full
 */
export class RingChannel implements Handler {
  size: number
  channel_type: ChannelType = ChannelType.Ring;
  constructor(size: number) {
    this.size = size;
  }
}

/**
  * FifoChannel Handler: 
  *   Semantic: will block incoming messages when full
 */
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
   * Class that represents a Zenoh Publisher, 
   * created by calling `declare_publisher()` on a `session`
   */
  private _remote_publisher: RemotePublisher;
  private _key_expr: KeyExpr;
  private _congestion_control: CongestionControl;
  private _priority: Priority;
  private _reliability: Reliability;
  private _encoding: Encoding;
  /** Finalization registry used for cleanup on drop
   * @hidden 
   */
  static registry: FinalizationRegistry<RemotePublisher> = new FinalizationRegistry((r_publisher: RemotePublisher) => r_publisher.undeclare());

  /** 
   * @hidden 
   */
  dispose() {
    this.undeclare();
    Publisher.registry.unregister(this);
  }

  /** 
   * @hidden 
   */
  private constructor(
    remote_publisher: RemotePublisher,
    key_expr: KeyExpr,
    congestion_control: CongestionControl,
    priority: Priority,
    reliability: Reliability,
    encoding: Encoding,
  ) {
    this._remote_publisher = remote_publisher;
    this._key_expr = key_expr;
    this._congestion_control = congestion_control;
    this._priority = priority;
    this._reliability = reliability;
    this._encoding = encoding;

    Publisher.registry.register(this, remote_publisher, this)
  }

  /**
   * gets the Key Expression from Publisher
   *
   * @returns {KeyExpr} instance
   */
  key_expr(): KeyExpr {
    return this._key_expr;
  }

  /**
   * Puts a payload on the publisher associated with this class instance
   *
   * @param {IntoZBytes} payload  - user payload, type that can be converted into a ZBytes
   * @param {IntoEncoding=} encoding  - Encoding parameter for Zenoh data
   * @param {IntoZBytes=} attachment - optional extra data to send with Payload
   *
   * @returns void
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
  * get Encoding declared for Publisher
  *   
  * @returns {Encoding}
  */
  encoding(): Encoding {
    return this._encoding;
  }

  /**
  * get Priority declared for Publisher
  *   
  * @returns {Priority}
  */
  priority(): Priority {
    return this._priority;
  }

  /**
  * get Reliability declared for Publisher
  *   
  * @returns {Reliability}
  */
  reliability(): Reliability {
    return this._reliability;
  }

  /**
   * get Congestion Control for a Publisher
   *   
   * @returns {CongestionControl}
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
   *  Note: this should never be called directly by the user. 
   *  please use `declare_publisher` on a session.
   * 
   * @param {KeyExpr} key_expr -  A Key Expression
   * @param {RemotePublisher} remote_publisher -  A Session to create the publisher on
   * @param {CongestionControl} congestion_control -  Congestion control 
   * @param {Priority} priority -  Priority for Zenoh Data
   * @param {Reliability} reliability - Reliability for publishing data
   * 
   * @returns a new Publisher instance
   * @hidden 
   */
  static new(
    key_expr: KeyExpr,
    remote_publisher: RemotePublisher,
    congestion_control: CongestionControl,
    priority: Priority,
    reliability: Reliability,
    encoding: Encoding,
  ): Publisher {
    return new Publisher(
      remote_publisher,
      key_expr,
      congestion_control,
      priority,
      reliability,
      encoding
    );
  }
}
