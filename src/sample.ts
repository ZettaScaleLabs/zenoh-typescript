import { KeyExpr } from "./key_expr";
import { OwnedKeyExprWrapper } from "./remote_api/interface/OwnedKeyExprWrapper";
import { SampleKindWS } from "./remote_api/interface/SampleKindWS";
import { SampleWS } from "./remote_api/interface/SampleWS";
import { ZBytes } from "./z_bytes";
import { Option } from "./session";
import { Encoding } from "./encoding";

/**
 * Kinds of Samples that can be recieved from Zenoh
 */
export enum SampleKind {
  PUT = "PUT",
  DELETE = "DELETE",
}

/**
 * Congestion control for Publishers
 */
export enum CongestionControl {
  DROP = "DROP",
  BLOCK = "BLOCK",
}

/**
 * Convenience function to convert between Congestion function and int
 */
export function congestion_control_from_int(
  prio_u8: number,
): CongestionControl {
  switch (prio_u8) {
    case 0:
      return CongestionControl.DROP;
    case 1:
      return CongestionControl.BLOCK;
    default:
      console.log("Unknown CongestionControl Variant, default to DROP");
      return CongestionControl.DROP;
  }
}

/**
 * Convenience function to convert between Congestion function and int
 */
export function congestion_control_to_int(
  congestion_control: CongestionControl,
): number {
  switch (congestion_control) {
    case CongestionControl.DROP:
      return 0;
    case CongestionControl.BLOCK:
      return 1;
  }
}

/**
 * Priority enum for Publisher
 */
export enum Priority {
  REAL_TIME = "REAL_TIME",
  INTERACTIVE_HIGH = "INTERACTIVE_HIGH",
  INTERACTIVE_LOW = "INTERACTIVE_LOW",
  DATA_HIGH = "DATA_HIGH",
  DATA = "DATA",
  DATA_LOW = "DATA_LOW",
  BACKGROUND = "BACKGROUND",
}

/**
 * Convenience function to convert between Priority function and int
 */
export function priority_from_int(prio_u8: number): Priority {
  switch (prio_u8) {
    case 1:
      return Priority.REAL_TIME;
    case 2:
      return Priority.INTERACTIVE_HIGH;
    case 3:
      return Priority.INTERACTIVE_LOW;
    case 4:
      return Priority.DATA_HIGH;
    case 5:
      return Priority.DATA;
    case 6:
      return Priority.DATA_LOW;
    case 7:
      return Priority.BACKGROUND;
    default:
      console.log("Unknown Priority Variant, default to Data");
      return Priority.DATA;
  }
}

/**
 * Convenience function to convert between Priority function and int
 */
export function priority_to_int(prio: Priority): number {
  switch (prio) {
    case Priority.REAL_TIME:
      return 1;
    case Priority.INTERACTIVE_HIGH:
      return 2;
    case Priority.INTERACTIVE_LOW:
      return 3;
    case Priority.DATA_HIGH:
      return 4;
    case Priority.DATA:
      return 5;
    case Priority.DATA_LOW:
      return 6;
    case Priority.BACKGROUND:
      return 7;
  }
}

/**
 * Sample class receieved from Subscriber
 */
export class Sample {
  private _keyexpr: KeyExpr;
  private _payload: ZBytes;
  private _kind: SampleKind;
  private _encoding: Encoding;
  private _priority: Priority;
  private _timestamp: Option<string>;
  private _congestion_control: CongestionControl;
  private _express: boolean;
  private _attachment: Option<ZBytes>;

  keyexpr(): KeyExpr {
    return this._keyexpr;
  }
  payload(): ZBytes {
    return this._payload;
  }
  kind(): SampleKind {
    return this._kind;
  }
  encoding(): Encoding {
    return this._encoding;
  }
  timestamp(): Option<string> {
    return this._timestamp;
  }
  congestion_control(): CongestionControl {
    return this._congestion_control;
  }
  priority(): Priority {
    return this._priority;
  }
  express(): boolean {
    return this._express;
  }
  attachment(): Option<ZBytes> {
    return this._attachment;
  }

  private constructor(
    keyexpr: KeyExpr,
    payload: ZBytes,
    kind: SampleKind,
    encoding: Encoding,
    priority: Priority,
    timestamp: Option<string>,
    congestion_control: CongestionControl,
    express: boolean,
    attachment: Option<ZBytes>,
  ) {
    this._keyexpr = keyexpr;
    this._payload = payload;
    this._kind = kind;
    this._encoding = encoding;
    this._priority = priority;
    this._timestamp = timestamp;
    this._congestion_control = congestion_control;
    this._express = express;
    this._attachment = attachment;
  }

  static new(
    key_expr: KeyExpr,
    payload: ZBytes,
    kind: SampleKind,
    encoding: Encoding,
    priority: Priority,
    timestamp: Option<string>,
    congestion_control: CongestionControl,
    express: boolean,
    attachment: Option<ZBytes>,
  ): Sample {
    return new Sample(
      key_expr,
      payload,
      kind,
      encoding,
      priority,
      timestamp,
      congestion_control,
      express,
      attachment,
    );
  }
}


/**
 * Convenience function to convert between Sample and SampleWS
 */
export function Sample_from_SampleWS(sample_ws: SampleWS) {
  let sample_kind: SampleKind;
  if (sample_ws.kind == "Delete") {
    sample_kind = SampleKind.DELETE;
  } else {
    sample_kind = SampleKind.PUT;
  }

  let payload = ZBytes.new(sample_ws.value);

  let key_exr = KeyExpr.new(sample_ws.key_expr);

  let encoding = Encoding.from_str(sample_ws.encoding);

  let priority = priority_from_int(sample_ws.priority);

  let congestion_control = congestion_control_from_int(
    sample_ws.congestion_control,
  );

  let timestamp: string | null = sample_ws.timestamp;

  let express: boolean = sample_ws.express;

  let attachment = null;
  if (sample_ws.attachement != null) {
    attachment = ZBytes.new(sample_ws.attachement);
  }

  return Sample.new(
    key_exr,
    payload,
    sample_kind,
    encoding,
    priority,
    timestamp,
    congestion_control,
    express,
    attachment,
  );
}

/**
 * Convenience function to convert between SampleWS and Sample 
 */
export function SampleWS_from_Sample(
  sample: Sample,
  encoding: Encoding,
  priority: Priority,
  congestion_control: CongestionControl,
  express: boolean,
  attachement: Option<ZBytes>,
): SampleWS {
  let key_expr: OwnedKeyExprWrapper = sample.keyexpr().toString();
  let value: Array<number> = Array.from(sample.payload().payload());

  let sample_kind: SampleKindWS;
  if (sample.kind() == SampleKind.DELETE) {
    sample_kind = "Delete";
  } else if (sample.kind() == SampleKind.PUT) {
    sample_kind = "Put";
  } else {
    console.log(
      "Sample Kind not PUT | DELETE, defaulting to PUT: ",
      sample.kind(),
    );
    sample_kind = "Put";
  }

  let attach = null;
  if (attachement != null) {
    attach = Array.from(attachement.payload());
  }

  let sample_ws: SampleWS = {
    key_expr: key_expr,
    value: value,
    kind: sample_kind,
    encoding: encoding.toString(),
    timestamp: null,
    priority: priority_to_int(priority),
    congestion_control: congestion_control_to_int(congestion_control),
    express: express,
    attachement: attach,
  };

  return sample_ws;
}
