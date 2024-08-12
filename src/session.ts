// Remote API interface
import {
  RemoteRecvErr as GetChannelClose,
  RemoteSession,
} from "./remote_api/session";
import { ReplyWS } from "./remote_api/interface/ReplyWS";
import { RemotePublisher, RemoteSubscriber } from "./remote_api/pubsub";
import { SampleWS } from "./remote_api/interface/SampleWS";
import { RemoteQueryable } from "./remote_api/query";
import { QueryWS } from "./remote_api/interface/QueryWS";
// API interface
import { IntoKeyExpr, KeyExpr } from "./key_expr";
import { IntoZBytes, ZBytes } from "./z_bytes";
import {
  IntoSelector,
  Query,
  Queryable,
  QueryWS_to_Query,
  Reply,
  Selector,
} from "./query";
import { SimpleChannel } from "channel-ts";
import { Publisher, Subscriber } from "./pubsub";
import {
  priority_to_int,
  congestion_control_to_int,
  CongestionControl,
  Priority,
  Sample,
  Sample_from_SampleWS,
} from "./sample";
import { State } from "channel-ts/lib/channel";
import { Config } from "./config";
import { Encoding } from "./encoding";
import { QueryReplyWS } from "./remote_api/interface/QueryReplyWS";

export type Option<T> = T | null;
// ███████ ███████ ███████ ███████ ██  ██████  ███    ██
// ██      ██      ██      ██      ██ ██    ██ ████   ██
// ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██
//      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██
// ███████ ███████ ███████ ███████ ██  ██████  ██   ████

/**
 * Session Class
 * Holds pointer to Session Instance in WASM Memory
 * methods
 */

export class Session {
  // WebSocket Backend
  private remote_session: RemoteSession;

  private constructor(remote_session: RemoteSession) {
    this.remote_session = remote_session;
  }

  /**
   * Creates a new Session instance in WASM Memory given a config
   *
   * @remarks
   *  The open function also runs zw_start_tasks,
   *  starting `zp_start_read_task`,`zp_start_lease_task`
   *  associating a read and write task to this session
   *
   * @param config - Config for session
   * @returns Typescript instance of a Session
   *
   */

  static async open(config: Promise<Config> | Config): Promise<Session> {
    const cfg = await config;
    let remote_session: RemoteSession = await RemoteSession.new(cfg.locator);
    return new Session(remote_session);
  }

  /**
   * Closes a session, cleaning up the resource in Zenoh,
   * and unregistering the instance of the class from TypeScript
   *
   * @returns Nothing
   */
  async close() {
    this.remote_session.close();
  }

  /**
   * Puts a value on the session, on a specific key expression KeyExpr
   *
   * @param keyexpr - something that implements intoKeyExpr
   * @param value - something that implements intoValue
   *
   * @returns success: 0, failure : -1
   */
  async put(
    into_key_expr: IntoKeyExpr,
    into_zbytes: IntoZBytes,
  ): Promise<void> {
    let key_expr = KeyExpr.new(into_key_expr);
    let z_bytes = ZBytes.new(into_zbytes);

    this.remote_session.put(key_expr.toString(), Array.from(z_bytes.payload()));
  }

  async delete(into_key_expr: IntoKeyExpr): Promise<void> {
    let key_expr = KeyExpr.new(into_key_expr);

    this.remote_session.delete(key_expr.toString());
  }
  /**
   * Declares a Key Expression on a session
   *
   * @param keyexpr - string of key_expression
   *
   * @returns success: 0, failure : -1
   */
  // TODO Do i need a Declare Key_Expression
  // async declare_ke(keyexpr: string): Promise<KeyExpr> {
  //     return new KeyExpr();
  // }

  async get(into_selector: IntoSelector): Promise<Receiver> {
    let selector: Selector = Selector.new(into_selector);
    let chan: SimpleChannel<ReplyWS> = await this.remote_session.get(
      selector.get_key_expr().toString(),
      selector.parameters().toString(),
    );
    let receiver = Receiver.new(chan);
    return receiver;
  }

  async declare_subscriber(
    into_key_expr: IntoKeyExpr,
    handler?: (sample: Sample) => Promise<void>,
  ): Promise<Subscriber> {
    let key_expr = KeyExpr.new(into_key_expr);
    let remote_subscriber: RemoteSubscriber;
    let callback_subscriber = false;
    if (handler != undefined) {
      callback_subscriber = true;
      const callback_conversion = async function (
        sample_ws: SampleWS,
      ): Promise<void> {
        let sample: Sample = Sample_from_SampleWS(sample_ws);
        handler(sample);
      };
      remote_subscriber = await this.remote_session.declare_subscriber(
        key_expr.toString(),
        callback_conversion,
      );
    } else {
      remote_subscriber = await this.remote_session.declare_subscriber(
        key_expr.toString(),
      );
    }
    let subscriber = await Subscriber.new(
      remote_subscriber,
      callback_subscriber,
    );
    return subscriber;
  }

  async declare_queryable(
    into_key_expr: IntoKeyExpr,
    complete: boolean,
    handler?: (query: Query) => Promise<void>,
  ): Promise<Queryable> {
    let key_expr = KeyExpr.new(into_key_expr);
    let remote_queryable: RemoteQueryable;
    let reply_tx: SimpleChannel<QueryReplyWS> =
      new SimpleChannel<QueryReplyWS>();

    if (handler != undefined) {
      const callback_conversion = async function (
        query_ws: QueryWS,
      ): Promise<void> {
        let query: Query = QueryWS_to_Query(query_ws, reply_tx);

        handler(query);
      };
      remote_queryable = await this.remote_session.declare_queryable(
        key_expr.toString(),
        complete,
        reply_tx,
        callback_conversion,
      );
    } else {
      remote_queryable = await this.remote_session.declare_queryable(
        key_expr.toString(),
        complete,
        reply_tx,
      );
    }

    // remote_queryable
    let queryable = await Queryable.new(remote_queryable);
    return queryable;
  }

  async declare_publisher(
    keyexpr: IntoKeyExpr,
    encoding?: Encoding,
    congestion_control?: CongestionControl,
    priority?: Priority,
    express?: boolean,
  ): Promise<Publisher> {
    let key_expr: KeyExpr = KeyExpr.new(keyexpr);

    let _congestion_ctrl = 0; // Default CongestionControl.DROP
    if (congestion_control != null) {
      _congestion_ctrl = congestion_control_to_int(congestion_control);
    } else {
      congestion_control = CongestionControl.DROP;
    }

    let _priority = 5; // Default Priority.DATA
    if (priority != null) {
      _priority = priority_to_int(priority);
    } else {
      priority = Priority.DATA;
    }

    let _express = false;
    if (express != null) {
      _express = express;
    }

    let _encoding = Encoding.default();
    if (encoding != null) {
      _encoding = encoding;
    }

    let remote_publisher: RemotePublisher =
      await this.remote_session.declare_publisher(
        key_expr.toString(),
        _encoding.toString(),
        _congestion_ctrl,
        _priority,
        _express,
      );

    var publisher: Publisher = await Publisher.new(
      key_expr,
      remote_publisher,
      congestion_control,
      priority,
    );
    return publisher;
  }
}

function isGetChannelClose(msg: any): msg is GetChannelClose {
  return msg === GetChannelClose.Disconnected;
}

// Type guard to check if channel_msg is of type ReplyWS
function isReplyWS(msg: any): msg is ReplyWS {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "query_uuid" in msg &&
    "result" in msg
  );
}

export enum RecvErr {
  Disconnected,
  MalformedReply,
}

export class Receiver {
  private receiver: SimpleChannel<ReplyWS | RecvErr>;

  private constructor(receiver: SimpleChannel<ReplyWS | RecvErr>) {
    this.receiver = receiver;
  }

  async receive(): Promise<Reply | RecvErr> {
    if (this.receiver.state == State.close) {
      return RecvErr.Disconnected;
    } else {
      let channel_msg: ReplyWS | RecvErr = await this.receiver.receive();

      if (isGetChannelClose(channel_msg)) {
        return RecvErr.Disconnected;
      } else if (isReplyWS(channel_msg)) {
        // Handle the ReplyWS case
        let opt_reply = Reply.new(channel_msg);
        if (opt_reply == undefined) {
          return RecvErr.MalformedReply;
        } else {
          return opt_reply;
        }
      }
      return RecvErr.MalformedReply;
    }
  }
  static new(reply_tx: SimpleChannel<ReplyWS>) {
    return new Receiver(reply_tx);
  }
}

export function open(config: Config): Promise<Session> {
  return Session.open(config);
}
