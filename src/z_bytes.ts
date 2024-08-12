/**
 * Union Type to convert various primitives and containers into ZBytes
 */
export type IntoZBytes =
  | ZBytes
  | Uint8Array
  | number[]
  | Array<number>
  | String
  | string;

/**
 * Class to represent an Array of Bytes recieved from Zenoh
 */
export class ZBytes {
  private buffer: Uint8Array;

  private constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

   /**
   * returns the length of the ZBytes buffer
   * 
   * @returns number
   */
  len(): number {
    return this.buffer.length;
  }

  /**
   * returns an empty ZBytes buffer
   * 
   * @returns ZBytes
   */
  empty(): ZBytes {
    return new ZBytes(new Uint8Array());
  }

  /**
   * return the underlying Uint8Array buffer
   * 
   * @returns Uint8Array
   */
  payload(): Uint8Array {
    return this.buffer;
  }

  /**
   * new function to create a ZBytes 
   * 
   * @returns ZBytes
   */
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
