export type IntoZBytes =
  | ZBytes
  | Uint8Array
  | number[]
  | Array<number>
  | String
  | string;

export class ZBytes {
  /**
   * Class to represent an Array of Bytes recieved from Zenoh
   */
  private buffer: Uint8Array;

  private constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

  len(): number {
    return this.buffer.length;
  }

  empty(): ZBytes {
    return new ZBytes(new Uint8Array());
  }

  payload(): Uint8Array {
    return this.buffer;
  }

  static new(bytes: IntoZBytes): ZBytes {
    if (bytes instanceof ZBytes) {
      return bytes;
    } else if (bytes instanceof String || typeof bytes === "string") {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(bytes.toString());
      return new ZBytes(encoded);
    } else {
      return new ZBytes(Uint8Array.from(bytes));
    }
  }
}
