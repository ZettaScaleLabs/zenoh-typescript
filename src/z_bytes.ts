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
 * Class to represent an Array of Bytes received from Zenoh
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
   * return the underlying Uint8Array buffer
   * 
   * @returns Uint8Array
   */
  deserialize<T>(d: Deserialize<T>): T {
    return d.deserialize(this.buffer);
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


/**
 * Interface to support converting ZBytes into type T
 * 
 * @returns T
 */
interface Deserialize<T> {

  deserialize(buffer: Uint8Array): T

}

/**
 * Convienence class to convert Zbytes to a string
 * 
 * @returns string
 */
export class TextDeserializer implements Deserialize<string> {
  deserialize(buffer: Uint8Array): string {
    var decoder = new TextDecoder();
    return decoder.decode(buffer)
  }
}

/**
 * Convienence class to convert Zbytes to a Uint8Array
 * 
 * @returns string
 */
export class Uint8ArrayDeserializer implements Deserialize<Uint8Array> {
  deserialize(buffer: Uint8Array): Uint8Array {
    return buffer
  }
}


/**
 * Convienence class to convert Zbytes to an Array<number>
 * 
 * @returns string
 */
export class ArrayNumberDeserializer implements Deserialize<Array<number>> {
  deserialize(buffer: Uint8Array): Array<number> {
    return Array.from(buffer)
  }
}

