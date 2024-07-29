import './style.css'
import './webpage.ts'

import { Session, Config, Query, Sample, KeyExpr, Publisher, Subscriber, Receiver, RecvErr } from "zenoh"

const TOPIC_DRIVE = "cmd_vel";
const TOPIC_LIDAR = "scan";
const TOPIC_BATTERY = "battery_state";
const TOPIC_LOGS = "rosout";
const TOPIC_MQTT = "zigbee2mqtt/device/**"


async function main() {

  // Loop to spin and keep alive
  var count = 0;
  while (true) {
    var seconds = 100;
    await sleep(1000 * seconds);
    console.log("Main Loop ? ", count)
    count = count + 1;
  }
}

main().then(() => console.log("Done")).catch(e => {
  console.log(e)
  throw e
})

function executeAsync(func: any) {
  setTimeout(func, 0);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}