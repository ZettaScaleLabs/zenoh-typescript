
import { Encoding } from 'zenoh/encoding';
import './style.css'
import './webpage.ts'

import { Config, Session } from "zenoh"
import { CongestionControl } from 'zenoh/sample';

export async function main() {

  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  let sub = await session.declare_subscriber("test/pong");
  let pub = await session.declare_publisher(
    "test/ping", Encoding.default(), CongestionControl.BLOCK
  )

  // Warm up
  console.log("Warming up for 5 seconds...")

  let startTime = new Date();
  let data = [122, 101, 110, 111, 104];

  while (elapsed(startTime) < 5) {
    await pub.put(data);
    await sub.recieve();
  }

  let samples = 600;
  let samples_out = [];
  for (var i = 0; i < samples; i++) {
    let write_time = new Date();
    await pub.put(data)
    await sub.recieve()
    samples_out.push(elapsed_ms(write_time))
  }

  for (var i = 0; i < samples_out.length; i++) {
    let rtt = samples_out[i];
    console.log(data.length + "bytes: seq=" + i + " rtt=" + rtt + "ms lat=" + rtt / 2 + "ms")
  }
}

function elapsed(startTime: Date) {
  var endTime = (new Date());

  var timeDiff = (endTime.getMilliseconds() - startTime.getMilliseconds()) / 1000; //in s
  var seconds = Math.round(timeDiff);
  return seconds
}

function elapsed_ms(startTime: Date) {
  var endTime = new Date();
  var timeDiff: number = (endTime.getMilliseconds() - startTime.getMilliseconds()); //in ms
  return timeDiff
}


main().then(() => console.log("Done")).catch(e => {
  console.log(e)
  throw e
})
