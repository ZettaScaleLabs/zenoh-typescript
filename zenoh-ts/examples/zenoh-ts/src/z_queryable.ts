import "./style.css";
import "./webpage.ts";

import { Config, KeyExpr, Query, Queryable, Session, ZBytes } from "@ZettaScaleLabs/zenoh-ts";


export async function main_queryable() {
  const session = await Session.open(Config.new("ws/127.0.0.1:10000"));
  let key_expr = KeyExpr.new("demo/test/queryable");

  const payload = [122, 101, 110, 111, 104]; 
  
  // Declaring a queryable with a callback
  function callback(query: Query){
    let zbytes: ZBytes | null = query.payload();

    if (zbytes == null) {
      console.log!(`>> [Queryable ] Received Query ${query.selector()}`);
    } else {
      console.log!(
        `>> [Queryable ] Received Query ${query.selector()} with payload '${zbytes}'`,
      );
    }

    console.log(
      `>> [Queryable ] Responding ${key_expr.toString()} with payload '${payload}'`,
    );
    query.reply("demo/test/queryable", payload);
  }

  let queryable_cb: Queryable = await session.declare_queryable(key_expr, true, callback);
  await sleep(1000 * 2);
  queryable_cb.undeclare()
  
  // Declaring a Queryable with a handler
  let queryable: Queryable = await session.declare_queryable(key_expr, true);

  let query = await queryable.receive();
  while (query instanceof Query) {
    console.log("Query Payload");
    console.log(query.selector());
    let zbytes: ZBytes | null = query.payload();

    if (zbytes == null) {
      console.log!(`>> [Queryable ] Received Query ${query.selector()}`);
    } else {
      console.log!(
        `>> [Queryable ] Received Query ${query.selector()} with payload '${zbytes}'`,
      );
    }

    console.log(
      `>> [Queryable ] Responding ${key_expr.toString()} with payload '${payload}'`,
    );
    query.reply("demo/test/queryable", payload);

    query = await queryable.receive();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
