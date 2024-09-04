/**
 * Union Type to convert various primitives and containers into ZBytes
 */
export type IntoZBytes =
  | ZBytes
  | Uint8Array
  | number[]
  | Array<number>
  | String
  | string
  | boolean;

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
    return this.buffer
  }

  /**
 * Deserialize the unit8array buffer into the desired type
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
    } else if (typeof bytes === "boolean") {
      return new ZBytes(Uint8Array.from([bytes === true ? 1 : 0]));
    } else {
      return new ZBytes(Uint8Array.from(bytes));
    }
  }
}

// export type = number[] | Array<number>;

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
export class BooleanDeserilaizer implements Deserialize<boolean> {
  static err = "Boolean Deserialization Failed";

  deserialize(buffer: Uint8Array): boolean {
    if (buffer.length != 1) {
      throw BooleanDeserilaizer.err + " buffer length excepted 1";
    }
    switch (buffer[0]) {
      case 0:
        return false
      case 1:
        return true
      default:
        throw BooleanDeserilaizer.err + " expected value 0 or 1";
    }
  }
}

/**
 * Convienence class to convert Zbytes to a Unsigned Integer
 * 
 * @returns string
 */
export class UnsignedIntegerDeserilaizer implements Deserialize<number | bigint> {
  static err = "Unsigned Integer Deserialization Failed";

  deserialize(buffer: Uint8Array): number | bigint {
    let buff_length = buffer.length;

    if (buffer.length > 8) {
      throw UnsignedIntegerDeserilaizer.err + " buffer length excepted < 8 bytes, actual : " + buffer.length;
    }

    let padded = new Uint8Array(8);
    padded.set(buffer, 0)

    const data_view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
    if (buff_length > 4) {
      return data_view.getBigUint64(0, true);
    } else if (buff_length > 2) {
      return data_view.getUint32(0, true);
    } else if (buff_length > 1) {
      return data_view.getUint16(0, true);
    } else {
      return data_view.getUint8(0);
    }
  }
}

/**
 * Convienence class to convert Zbytes to a Signed Integer
 * 
 * @returns string
 */
export class SignedIntegerDeserilaizer implements Deserialize<number | bigint> {
  static err = "Signed Integer Deserialization Failed";

  deserialize(buffer: Uint8Array): number | bigint {
    let buff_length = buffer.length;

    if (buffer.length > 8) {
      throw SignedIntegerDeserilaizer.err + " buffer length excepted < 8 bytes, actual : " + buffer.length;
    }

    let padded = new Uint8Array(8);
    padded.set(buffer, 0)

    const data_view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
    if (buff_length > 4) {
      return data_view.getBigInt64(0, true);
    } else if (buff_length > 2) {
      return data_view.getInt32(0, true);
    } else if (buff_length > 1) {
      return data_view.getInt16(0, true);
    } else {
      return data_view.getInt8(0);
    }
  }
}


export class FloatingPointDeserilaizer implements Deserialize<number | bigint> {
  static err = "Floating Point Deserialization Failed";

  deserialize(buffer: Uint8Array): number | bigint {
    let buff_length = buffer.length;

    if (buffer.length > 8) {
      throw FloatingPointDeserilaizer.err + " buffer length excepted < 8 bytes, actual : " + buffer.length;
    }

    let padded = new Uint8Array(8);
    padded.set(buffer, 0)

    const data_view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
    if (buff_length > 4) {
      return data_view.getFloat64(0, true);
    } else {
      return data_view.getFloat32(0, true);
    }
  }
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
