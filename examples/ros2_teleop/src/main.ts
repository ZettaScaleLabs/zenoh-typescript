import { CDRReader, CDRWriter } from "jscdr";
// import { ByteBuffer } from "bytebuffer";
import { Session, Config, Sample } from "zenoh"

import { BatteryState, LaserScan, Log, Twist, Vector3 } from "./ros2_types";
import ByteBuffer from "bytebuffer";

const TOPIC_DRIVE = "cmd_vel";
const TOPIC_BATTERY = "battery_state";
const TOPIC_LIDAR = "scan";
const TOPIC_LOGS = "rosout";
const TOPIC_MQTT = "zigbee2mqtt/device/**"

var document = window.document;

//Zenoh Session
var locator = document.getElementById("locator").value;
const session = await Session.open(Config.new(locator));

function reloadPage(rest: string, s: string) {
  window.location.search = 'rest=' + rest + "&scope=" + s;
}

// Add listener for input changes REST API and Scope inputs
if (document.getElementById("locator") != null) {
  document.getElementById("locator").addEventListener('change', (event) => {
    reloadPage(event.target.value, document.getElementById("scope_input").value);
  });
}

document.getElementById("scope_input").addEventListener('change', (event) => {
  reloadPage(document.getElementById("remote_api").value, event.target.value);
});

// The scope (used as a prefix for all Zenoh keys to publish and subscribe if not containing '*')
var scope = document.getElementById("scope_input").value;
if (scope.length > 0 && !scope.endsWith("/")) { scope += "/" }
// If scope contains '*', default to "bot1" for subscription to avoid display conflicts of camera+lidar
var sub_scope = scope.includes('*') ? "bot/" : scope;

async function pubTwist(linear: number, angular: number) {
  // Get scales from HTML
  var linear_scale = document.getElementById("linear_scale").value;
  var angular_scale = document.getElementById("angular_scale").value;

  // Create a Twist message
  var twist = new Twist(
    new Vector3(linear * linear_scale, 0.0, 0.0),
    new Vector3(0.0, 0.0, angular * angular_scale)
  );

  // Since it's going to DDS, encode it using a jscdr.CDRWriter
  var writer = new CDRWriter();
  twist.encode(writer);
  // The key expression for publication
  var key_expr = scope + TOPIC_DRIVE;
  console.log("Publish to", key_expr, twist)
  console.log(session)
  await session.put(key_expr, writer.buf.view);
}
document.pubTwist = pubTwist;

// callback on keyboard's down key event
async function onkeydown(e) {
  if (e.keyCode == '38') {      // up arrow
    await pubTwist(1.0, 0.0);
  }
  else if (e.keyCode == '40') { // down arrow
    await pubTwist(-1.0, 0.0);
  }
  else if (e.keyCode == '37') { // left arrow
    await pubTwist(0.0, 1.0);
  }
  else if (e.keyCode == '39') { // right arrow
    await pubTwist(0.0, -1.0);
  }
  else if (e.keyCode == '32') { // spacebar
    await pubTwist(0.0, 0.0);
  }
}
// register callback on key down
document.onkeydown = onkeydown;

// callback on keyboard's up key event
function onkeyup(e) {
  // if key pressed was an arrow, send a Twist(0,0) to stop the robot
  if (e.keyCode == '37' || e.keyCode == '38' || e.keyCode == '39' || e.keyCode == '40')
    pubTwist(0.0, 0.0);
}
// register callback on key up
document.onkeyup = onkeyup;

////////////////////////////
//  Battery subscription  //
////////////////////////////

// the key expression to subscribe
var key_expr = sub_scope + TOPIC_BATTERY;

const battery_subscriber = async function (sample: Sample): Promise<void> {
  let reader = new CDRReader(ByteBuffer.wrap(sample.payload().payload()));
  let battery = BatteryState.decode(reader);
  let elem = document.getElementById("battery_label");
  if (elem != undefined) {
    elem.innerHTML = "Battery: " + Math.round(battery.percentage) + " %";
  }
}

console.log("battery Topic:", key_expr);
await session.declare_subscriber(key_expr, battery_subscriber)
console.log("After Subscriber:");
//////////////////////////////////////////////////////////////////
//  Camera subscription (as motion-JPEG via WebService plugin)  //
//////////////////////////////////////////////////////////////////

// If your robot has a camera and zcapture installed (from zenoh-demos/computer-vision/zcam/):
// the zcapture must be started with "-k <scope>/camera", and the zenoh router must have the WebServer plugin running
// if (document.getElementById("camera_img") != null) {
//   // update Camera label
//   let elem = document.getElementById("camera_label");
//   elem.innerHTML = "Camera ( " + sub_scope + "camera )";

//   // Set "camera_img" element's src to the same URL host, but with port 8080 (WebServer plugin)
//   // and with path: "<scope>/camera?_method=SUB"
//   img_url = remote_api.replace(":8000", ":8080") + sub_scope + "camera?_method=SUB";
//   document.getElementById("camera_img").src = img_url;
// }

///////////////////////////////
//    Lidar subscription     //
///////////////////////////////
// Test if Server-Source Event is supported

var key_expr = sub_scope + TOPIC_LIDAR;

// // update Lidar label
// let elem = document.getElementById("lidar_label");
// elem.innerHTML = "Lidar ( " + key_expr + " )";

// // Get canvas context and get its dimensions
const canvas = document.getElementById('Lidar-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// // Clear canvas
ctx.clearRect(0, 0, width, height);

const lidar_callback = async function (sample: Sample): Promise<void> {
  console.log("Received sample: " + sample);
  let reader = new CDRReader(ByteBuffer.wrap(sample.payload().payload()));
  // Decode the buffer as an LaserScan message
  let scan = LaserScan.decode(reader);
  // Force range_max to 3.5 for consistency between robots
  var max_range_displayed = 3.5;

  // Convert to [x,y, isInRange] points, where:
  //  - if isInRange==true then {x,y} are the relative coordinates computed from {angle,range}
  //  - if isInRange==false then the range was out of range_min/range_max and {x,y} are the relative
  //    coordinate of {angle,LIMIT} where LIMIT is range_max or range_min (the closest bound).
  let angle = -3.1415927410125732;
  let scale = Math.min(canvas.width, canvas.height) / 2 / max_range_displayed;
  let points = [];
  for (const range of scan.ranges) {
    var r = range;
    var isInRange = true;
    if (range > scan.range_max) {
      r = scan.range_max;
      isInRange = false;
    } else if (range < scan.range_min) {
      r = scan.range_min;
      isInRange = false;
    }

    const x = r * scale * Math.sin(angle);
    const y = r * scale * Math.cos(angle);
    points.push([x, y, isInRange]);
    angle += scan.angle_increment;
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw rays
  ctx.lineWidth = 2;
  for (const [x, y, isInRange] of points) {
    var ctx_x = x + width / 2;
    var ctx_y = y + height / 2;
    ctx.beginPath();
    if (isInRange) {
      ctx.strokeStyle = 'LightGray';
    } else {
      ctx.strokeStyle = 'Gainsboro';
    }
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(ctx_x, ctx_y);
    ctx.stroke();
  }

  // Draw points
  ctx.fillStyle = 'red';
  for (const [x, y, isInRange] of points) {
    var ctx_x = x + width / 2;
    var ctx_y = y + height / 2;
    if (isInRange) {
      ctx.fillRect(ctx_x, ctx_y, 1, 1);
    }
  }

  // Draw axis lines
  ctx.beginPath();
  ctx.strokeStyle = 'DimGray';
  ctx.lineWidth = 1;
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
}
console.log("Lidar Sub:", key_expr);
session.declare_subscriber(key_expr, lidar_callback)

//////////////////////////////////
//    Logs subscription (ROS2)  //
//////////////////////////////////
// var ros2_logs_source = null;

// Test if Server-Source Event is supported

// the key expression to subscribe
var key_expr = sub_scope + TOPIC_LOGS;

// update Lidar label
let elem = document.getElementById("logs_label");
elem.innerHTML = "Logs ( " + key_expr + " + " + TOPIC_MQTT + " )";

// Create EventSource for subscription to key_expr
const logs_callback = async function (sample: Sample): Promise<void> {
  console.log("Received sample: " + sample);
  // The payload buffer is in "value" field, encoded as base64.
  // Since it's comming from DDS, we decode it using a jscdr.CDRReader.
  let reader = new CDRReader(ByteBuffer.wrap(sample.payload().payload()));
  // Decode the buffer as a Log message
  let log = Log.decode(reader);
  // Add it to "rosout_logs" HTML element
  let elem = document.getElementById("rosout_logs");
  elem.innerHTML += "ROS2: [" + log.time.sec + "." + log.time.nsec + "] [" + log.name + "]: " + log.msg + "<br>";
  // Auto-scroll to the bottom
  elem.scrollTop = elem.scrollHeight;
}
console.log("Lidar Sub:", key_expr);
session.declare_subscriber(key_expr, logs_callback)

//////////////////////////////////
//    Logs subscription (MQTT)  //
//////////////////////////////////
// var mqtt_logs_source = null;

// // Test if Server-Source Event is supported
// if (typeof (EventSource) !== "undefined") {
//     // the key expression to subscribe (no scope used by MQTT bridge as only 1)
//     var key_expr = TOPIC_MQTT;

//     console.log("Subscribe to EventSource: " + remote_api + key_expr);
//     ros2_logs_source = new EventSource(remote_api + key_expr);
//     ros2_logs_source.addEventListener("PUT", function (e) {
//         console.log("Received sample: " + e.data);
//         // The zenoh REST API sends JSON objects
//         // that includes "key", "value", "encoding" and "time" (same than a result to GET)
//         let sample = JSON.parse(e.data)
//         // Add it to "rosout_logs" HTML element
//         let elem = document.getElementById("rosout_logs");
//         elem.innerHTML += "MQTT: on " + sample.key + " : " + JSON.stringify(sample.value) + "<br>";
//         // Auto-scroll to the bottom
//         elem.scrollTop = elem.scrollHeight;
//     }, false);

// } else {
//     document.getElementById("rosout_logs").innerHTML = "Sorry, your browser does not support server-sent events...";
// }