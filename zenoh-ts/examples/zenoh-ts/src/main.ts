import "./style.css";
import "./webpage.ts";
import {main_thr} from  "./z_sub_thr.ts";
import { main_get } from  "./z_get.ts";
import { main_ping } from "./z_ping.ts";
import { main_pong } from "./z_pong.ts";
import { main_sub } from "./z_sub.ts";
import { main_pub } from "./z_pub.ts";
import { main_put } from "./z_put.ts";
import { main_queryable } from "./z_queryable.ts";
import { main_delete } from "./z_delete.ts";

async function main() {
  // main_thr();
  // main_ping();
  // main_pong();
  // main_sub();
  // main_pub();
  // main_queryable();
  // main_get();
  // main_delete();
  // main_put();

  let count = 0;
  while (true) {
    let seconds = 100;
    await sleep(1000 * seconds);
    console.log("Main Loop ? ", count);
    count = count + 1;
  }
}

main()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.log(e);
    throw e;
  });


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


