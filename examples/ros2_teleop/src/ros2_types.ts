import { CDRReader, CDRWriter } from "jscdr";


/////////////////////////////////////////////////////////////
// ROS2 Types declaration with CDR encode/decode functions //
/////////////////////////////////////////////////////////////

// ROS2 Time type
export class Time {
    sec: number;
    nsec: number;

    constructor(sec: number, nsec: number) {
        this.sec = sec;
        this.nsec = nsec;
    }

    static decode(cdrReader: any) {
        let sec = cdrReader.readInt32();
        let nsec = cdrReader.readUint32();
        return new Time(sec, nsec);
    }
}

// ROS2 Log type (received in 'rosout' topic)
export class Log {
    time: Time;
    level: number;
    name: string;
    msg: string;
    file: string;
    fn: string;
    line: number;

    constructor(time: Time, level: number, name: string, msg: string, file: string, fn: string, line: number) {
        this.time = time;
        this.level = level;
        this.name = name;
        this.msg = msg;
        this.file = file;
        this.fn = fn;
        this.line = line;
    }

    static decode(cdrReader: CDRReader) {
        let time = Time.decode(cdrReader);
        let level = cdrReader.readByte();
        let name = cdrReader.readString();
        let msg = cdrReader.readString();
        let file = cdrReader.readString();
        let fn = cdrReader.readString();
        let line = cdrReader.readUint32();
        return new Log(time, level, name, msg, file, fn, line);
    }
}

// ROS2 Vector3 type
export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    encode(cdrWriter: CDRWriter) {
        cdrWriter.writeFloat64(this.x);
        cdrWriter.writeFloat64(this.y);
        cdrWriter.writeFloat64(this.z);
    }

    static decode(cdrReader: CDRReader) {
        let x = cdrReader.readFloat64();
        let y = cdrReader.readFloat64();
        let z = cdrReader.readFloat64();
        return new Vector3(x, y, z);
    }
}

// ROS2 Quaternion type
export class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    static decode(cdrReader: CDRReader) {
        let x = cdrReader.readFloat64();
        let y = cdrReader.readFloat64();
        let z = cdrReader.readFloat64();
        let w = cdrReader.readFloat64();
        return new Quaternion(x, y, z, w);
    }
}

// ROS2 Twist type (published in 'cmd_vel' topic)
export class Twist {
    linear: Vector3;
    angular: Vector3;

    constructor(linear: Vector3, angular: Vector3) {
        this.linear = linear;
        this.angular = angular;
    }

    encode(cdrWriter: CDRWriter) {
        this.linear.encode(cdrWriter);
        this.angular.encode(cdrWriter);
    }
}

// ROS2 Header type
export class Header {
    time: Time;
    frame_id: string;
    constructor(time: Time, frame_id: string) {
        this.time = time;
        this.frame_id = frame_id;
    }

    static decode(cdrReader: CDRReader): Header {
        let time = Time.decode(cdrReader);
        let frame_id = cdrReader.readString();
        return new Header(time, frame_id)
    }
}


// ROS2 BatteryState type (received in 'battery_state' topic)
// Warning: not complete, since we only need to decode up-to 'percentage'
export class BatteryState {
    header: Header;
    voltage: number;
    temperature: number;
    current: number;
    charge: number;
    capacity: number;
    design_capacity: number;
    percentage: number;


    constructor(header: Header, voltage: number, temperature: number, current: number, charge: number, capacity: number, design_capacity: number, percentage: number) {
        this.header = header;
        this.voltage = voltage;
        this.temperature = temperature;
        this.current = current;
        this.charge = charge;
        this.capacity = capacity;
        this.design_capacity = design_capacity;
        this.percentage = percentage;
    }

    static decode(cdrReader: CDRReader) {
        let header = Header.decode(cdrReader);
        let voltage = cdrReader.readFloat32();
        let temperature = cdrReader.readFloat32();
        let current = cdrReader.readFloat32();
        let charge = cdrReader.readFloat32();
        let capacity = cdrReader.readFloat32();
        let design_capacity = cdrReader.readFloat32();
        let percentage = cdrReader.readFloat32();
        return new BatteryState(header, voltage, temperature, current, charge, capacity, design_capacity, percentage);
    }
}

// ROS2 LaserScan type (received in 'scan' topic)
export class LaserScan {
    header: Header;
    angle_min: number;
    angle_max: number;
    angle_increment: number;
    time_increment: number;
    scan_time: number;
    range_min: number;
    range_max: number;
    ranges: Array<number>;
    intensities: Array<number>;

    constructor(header: Header, angle_min: number, angle_max: number, angle_increment: number, time_increment: number, scan_time: number, range_min: number, range_max: number, ranges: Array<number>, intensities: Array<number>) {
        this.header = header;
        this.angle_min = angle_min;
        this.angle_max = angle_max;
        this.angle_increment = angle_increment;
        this.time_increment = time_increment;
        this.scan_time = scan_time;
        this.range_min = range_min;
        this.range_max = range_max;
        this.ranges = ranges;
        this.intensities = intensities;
    }

    static decode(cdrReader: CDRReader) {
        let header = Header.decode(cdrReader);
        let angle_min = cdrReader.readFloat32();
        let angle_max = cdrReader.readFloat32();
        let angle_increment = cdrReader.readFloat32();
        let time_increment = cdrReader.readFloat32();
        let scan_time = cdrReader.readFloat32();
        let range_min = cdrReader.readFloat32();
        let range_max = cdrReader.readFloat32();

        let ranges_length = cdrReader.readInt32()
        let ranges = [];
        for (const x of Array(ranges_length).keys()) {
            ranges.push(cdrReader.readFloat32())
        }

        let intensities_length = cdrReader.readInt32()
        let intensities = [];
        for (const x of Array(intensities_length).keys()) {
            intensities.push(cdrReader.readFloat32())
        }
        return new LaserScan(header, angle_min, angle_max, angle_increment, time_increment, scan_time, range_min, range_max, ranges, intensities);
    }
}