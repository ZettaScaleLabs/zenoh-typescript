//
// Copyright (c) 2023 ZettaScale Technology
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
// which is available at https://www.apache.org/licenses/LICENSE-2.0.
//
// SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
//
// Contributors:
//   ZettaScale Zenoh Team, <zenoh@zettascale.tech>
//

// Zenoh
#include "zenoh-pico.h"
#include "zenoh-pico/api/macros.h"
#include "zenoh-pico/api/types.h"
#include "zenoh-pico/system/platform.h"
#include "zenoh-pico/net/primitives.h"
#include "zenoh-pico/session/resource.h"

// Emscripten
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#include <emscripten/val.h>
#include <emscripten/proxying.h>

// General C / C++
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <thread>
#include <unistd.h>
#include <pthread.h>

// Program State
pthread_t main_thread;
em_proxying_queue *proxy_queue = NULL;

// Expose Interface To TS
EMSCRIPTEN_DECLARE_VAL_TYPE(CallbackType);

// A type Representing a pointer from Typescropt
typedef size_t ts_ptr; // number

// void *zw_session_close(z_owned_config_t *config)
// {
//   z_owned_session_t *session =
//       (z_owned_session_t *)z_malloc(sizeof(z_owned_session_t));

  // TODO:CLOSE SESSION
  // *session = z_open(z_move(*config));
  // if (!z_check(*session))
  // {
  //   printf("Unable to open session!\n");
  //   z_free(session);
  //   return NULL;
  // }
  // return session;
// }

// TODO Complete
// int zw_get(z_owned_session_t *s, // TODO: Do I need an owned session T ?
//            z_owned_keyexpr_t *ke,
//            // z_session_t *s,
//            //  z_keyexpr_t *ke,
//            const char *parameters,
//            int js_callback)
// {
//   z_get_options_t options = z_get_options_default();
//   z_owned_closure_sample_t callback =
//       z_closure(wrapping_sub_callback, remove_js_callback, (void
//       *)js_callback);
//   int8_t get = z_get(z_loan(*s), z_loan(*ke), parameters, z_move(callback),
//   &options);
//   return get;
// }

int zw_default_config(std::string locator_str)
{
  const char *locator = (const char *)locator_str.data();

  if (locator == NULL)
  {
    return NULL;
  }

  z_owned_config_t *config =
      (z_owned_config_t *)z_malloc(sizeof(z_owned_config_t));
  *config = z_config_default();
  zp_config_insert(z_loan(*config), Z_CONFIG_CONNECT_KEY,
                   z_string_make(locator));
  return (int)config;
}

// ███████ ███████ ███████ ███████ ██  ██████  ███    ██
// ██      ██      ██      ██      ██ ██    ██ ████   ██
// ███████ █████   ███████ ███████ ██ ██    ██ ██ ██  ██
//      ██ ██           ██      ██ ██ ██    ██ ██  ██ ██
// ███████ ███████ ███████ ███████ ██  ██████  ██   ████

int zw_open_session(ts_ptr config_ptr)
{

  main_thread = pthread_self();
  proxy_queue = em_proxying_queue_create();

  // TODO: Surely this is the wrong kind of cast ?
  z_owned_config_t *config = reinterpret_cast<z_owned_config_t *>(config_ptr);
  z_owned_session_t *session =
      (z_owned_session_t *)z_malloc(sizeof(z_owned_session_t));
  *session = z_open(z_move(*config));
  if (!z_check(*session))
  {
    printf("Unable to open session!\n");
    z_free(session);
    return NULL;
  }

  return (int)session;
}

void zw_close_session(ts_ptr session_ptr)
{
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_close(z_move(*s));
}

int zw_start_tasks(ts_ptr session_ptr)
{
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  if (zp_start_read_task(z_loan(*s), NULL) != 0 ||
      zp_start_lease_task(z_loan(*s), NULL) != 0)
  {
    printf("Unable to start read and lease tasks");
    return -1;
  }
  return 0;
}

// Execute a Put on a session
int zw_put(ts_ptr session_ptr, ts_ptr key_expr_ptr, std::string value_str)
{

  z_put_options_t options = z_put_options_default();
  options.encoding = z_encoding(Z_ENCODING_PREFIX_TEXT_PLAIN, NULL);

  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);

  // TODO: Static cast is supposed to safer ?
  const uint8_t *value = (const uint8_t *)value_str.data();

  return z_put(z_loan(*s), z_loan(*ke), value, value_str.length(), &options);
}

// ██   ██ ███████ ██    ██     ███████ ██   ██ ██████  ██████
// ██  ██  ██       ██  ██      ██       ██ ██  ██   ██ ██   ██
// █████   █████     ████       █████     ███   ██████  ██████
// ██  ██  ██         ██        ██       ██ ██  ██      ██   ██
// ██   ██ ███████    ██        ███████ ██   ██ ██      ██   ██

int zw_make_ke(std::string keyexpr_str)
{
  
  const char *keyexpr = (const char *)keyexpr_str.data();

  z_owned_keyexpr_t *ke = NULL;
  z_owned_keyexpr_t oke = z_keyexpr_new(keyexpr);
  if (z_check(oke))
  {
    ke = (z_owned_keyexpr_t *)z_malloc(sizeof(z_owned_keyexpr_t));
    _z_keyexpr_set_owns_suffix(oke._value, true);
    *ke = oke;
  }

  return (int)ke;
}

int zw_declare_ke(ts_ptr session_ptr, std::string keyexpr_str)
{
  // TODO CLEANUP
  // std::cout << "Called : zw_declare_ke " << std::endl;
  // std::cout << "session_ptr: " << session_ptr << std::endl;
  // std::cout << "keyexpr_str: " << keyexpr_str << std::endl;

  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);

  z_owned_keyexpr_t *ke =
      (z_owned_keyexpr_t *)z_malloc(sizeof(z_owned_keyexpr_t));

  const char *keyexpr_string = (const char *)keyexpr_str.data();

  z_keyexpr_t keyexpr = z_keyexpr(keyexpr_string);

  *ke = z_declare_keyexpr(z_loan(*s), keyexpr);

  if (!z_check(*ke))
  {
    printf("Unable to declare key expression!\n");
    exit(-1);
  }

  // TODO Cleanup
  // printf("zw_declare_ke \n");
  // printf("pointer : %p \n", ke);
  // printf("decimal : %d \n", (int)ke);
  // printf("zw_declare_ke\n");

  return (int)ke;
}

void zw_delete_ke(ts_ptr keyexpr_ptr)
{
  z_owned_keyexpr_t *key_expr = reinterpret_cast<z_owned_keyexpr_t *>(keyexpr_ptr);
  return z_drop(key_expr);
}

// TODO : WIP:  ADD SESSION POINTER emscripten::val zw_get_keyexpr(ts_ptr session_ptr, ts_ptr keyexpr_ptr)
// Session needs to handle resource pool
// Look into .resolve
emscripten::val zw_get_keyexpr(ts_ptr keyexpr_ptr)
{

  // TODO Cleanup
  printf("zw_get_keyexpr \n");
  printf("pointer : %p \n", keyexpr_ptr);
  printf("decimal : %d \n", (int)keyexpr_ptr);
  printf("zw_get_keyexpr\n");

  z_owned_keyexpr_t *owned_key_expr = reinterpret_cast<z_owned_keyexpr_t *>(keyexpr_ptr);
  
  // printf("z_owned_keyexpr_t *owned_key_expr value : %s \n", owned_key_expr->_value);
  
  // This KeyExpr is Null, only get the ID
  // z_keyexpr_t key_expr = z_loan(*owned_key_expr);

  // TODO: Get resource properly from Resource Pool managed by Zenoh Pico
  // _z_resource_t *r = _z_get_resource_by_key(s=>, owned_key_expr->_value); 
  // 
  const char* my_str = "PLACEHOLDER/KEY/EXPR";
  emscripten::val ts_str = emscripten::val::u8string(my_str);
  return ts_str;
}

// ████████ ███████                ██████  █████  ██      ██      ██████   █████   ██████ ██   ██
//    ██    ██                    ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██
//    ██    ███████     █████     ██      ███████ ██      ██      ██████  ███████ ██      █████
//    ██         ██               ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██
//    ██    ███████                ██████ ██   ██ ███████ ███████ ██████  ██   ██  ██████ ██   ██

struct closure_t
{
  void *cb;
  const z_sample_t *sample;
};

void run_callback(void *arg)
{
  printf("------ thread %lu: RUN CB ------\n", pthread_self());
  
  closure_t *closure = (closure_t *)arg;
  printf("------  RUN CB  After Get Closure ------\n");

  emscripten::val *cb = (emscripten::val *)closure->cb;
  printf("------ RUN CB After CB destruct ------\n");
  
  z_owned_str_t keystr = z_keyexpr_to_string(closure->sample->keyexpr);
  printf("------ RUN CB After KeyExpr to String ------\n");

  // std::cout << "========== run_callback ============= " << std::endl;
  // printf(">> '%s' '%p' \n", z_str_loan(&keystr), (int)z_str_loan(&keystr));
  // std::cout << "========== run_callback ============= " << std::endl;
  printf("------ RUN CB Before Call ------\n");
  (*cb)(
      (int)z_str_loan(&keystr), 
      (int)closure->sample->payload.start, 
      (int)closure->sample->payload.len
      );
  printf("------ RUN CB After Call ------\n");
  // Experiment Experiment Experiment Experiment Experiment
  //
  // TODO: Check, will this allocate a new string on every single sample.
  // emscripten::val *keystr_val = new emscripten::val(keystr._value);
  // (*cb)(keystr_val, (int)closure->sample->payload.start, (int)closure->sample->payload.len);
  //
  // Experiment Experiment Experiment Experiment

  z_str_drop(z_str_move(&keystr));
  printf("------ RUN CB After z_str_drop ------\n");
}

void data_handler(const z_sample_t *sample, void *arg)
{
  // printf("------ thread %lu: DATA HANDLER ------\n", pthread_self());
  // (void)(arg);
  // z_owned_str_t keystr = z_keyexpr_to_string(sample->keyexpr);
  // printf(">> [Subscriber] Received ('%s': '%.*s')\n", z_str_loan(&keystr), (int)sample->payload.len,
  //         sample->payload.start);
  // z_str_drop(z_str_move(&keystr));

  closure_t closure;
  closure.cb = arg;
  closure.sample = sample;
  printf("before Emscripten Proxy Sync \n");
  emscripten_proxy_sync(proxy_queue, main_thread, run_callback, &closure);
}

// ██████  ███████  ██████ ██       █████  ██████  ███████
// ██   ██ ██      ██      ██      ██   ██ ██   ██ ██
// ██   ██ █████   ██      ██      ███████ ██████  █████
// ██   ██ ██      ██      ██      ██   ██ ██   ██ ██
// ██████  ███████  ██████ ███████ ██   ██ ██   ██ ███████

int zw_declare_subscriber(ts_ptr session_ptr, ts_ptr key_expr_ptr, emscripten::val ts_cb)
{
  z_subscriber_options_t options = z_subscriber_options_t();

  // TODO: surely Reinterpret_Cast is not the right kind of cast here ?
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);

  emscripten::val *ts_cb_ptr = new emscripten::val(std::move(ts_cb));

  z_owned_closure_sample_t *callback =
      (z_owned_closure_sample_t *)z_malloc(sizeof(z_owned_closure_sample_t));

  *callback = z_closure_sample(data_handler, NULL, ts_cb_ptr);

  z_owned_subscriber_t *sub =
      (z_owned_subscriber_t *)z_malloc(sizeof(z_owned_subscriber_t));

  *sub = z_declare_subscriber(z_loan(*s), z_loan(*ke), z_closure_sample_move(callback), &options);

  // TODO:There is a bug that the subscriber will
  // Not be able to start if a subscriber already exsists
  if (!z_check(*sub))
  {
    printf("Unable to declare subscriber!\n");
    z_free(sub);
    return NULL;
  }

  return (int)sub;
}

// ██████  ██    ██ ██████  ██      ██ ███████ ██   ██ ███████ ██████
// ██   ██ ██    ██ ██   ██ ██      ██ ██      ██   ██ ██      ██   ██
// ██████  ██    ██ ██████  ██      ██ ███████ ███████ █████   ██████
// ██      ██    ██ ██   ██ ██      ██      ██ ██   ██ ██      ██   ██
// ██       ██████  ██████  ███████ ██ ███████ ██   ██ ███████ ██   ██

int zw_declare_publisher(ts_ptr session_ptr, ts_ptr key_expr_ptr)
{

  z_publisher_options_t options = z_publisher_options_t();

  // TODO: surely Reinterpret_Cast is not the right kind of cast here ?
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);

  z_owned_publisher_t *pub =
      (z_owned_publisher_t *)z_malloc(sizeof(z_owned_publisher_t));

  *pub = z_declare_publisher(
      z_loan(*s),
      z_loan(*ke),
      &options);

  // TODO:There is a bug that the subscriber will
  // Not be able to start if a subscriber already exsists
  if (!z_check(*pub))
  {
    printf("Unable to declare publisher!\n");
    z_free(pub);
    return NULL;
  }

  return (int)pub;
}

int zw_publisher_put(ts_ptr publisher, std::string value_str)
{
  const z_publisher_put_options_t *options;

  const uint8_t *value = (const uint8_t *)value_str.data();

  z_owned_publisher_t *pub = reinterpret_cast<z_owned_publisher_t *>(publisher);
  // int8_t z_publisher_put(const z_publisher_t pub, const uint8_t *payload, size_t len,  const z_publisher_put_options_t *options);
  int8_t res = z_publisher_put(z_loan(*pub), value, value_str.length(), NULL);

  if (!z_check(*pub))
  {
    printf("Unable to declare publisher!\n");
    z_free(pub);
    return NULL;
  }

  return (int)pub;
}

int zw_undeclare_publisher(ts_ptr publisher)
{
  z_owned_publisher_t *pub = reinterpret_cast<z_owned_publisher_t *>(publisher);

  z_undeclare_publisher(z_move(*pub));
}

//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
// zw_sub

// void *zw_sub(z_owned_session_t *s, z_owned_keyexpr_t *ke, int js_callback)
// {

//   z_owned_subscriber_t *sub =
//       (z_owned_subscriber_t *)z_malloc(sizeof(z_owned_subscriber_t));

//   z_owned_closure_sample_t callback =
//       z_closure(wrapping_sub_callback, remove_js_callback, (void
//       *)js_callback);

//   *sub = z_declare_subscriber(z_loan(*s), z_loan(*ke),
//                               z_move(callback), NULL);

//   if (!z_check(*sub))
//   {
//     printf("Unable to declare subscriber.\n");
//     exit(-1);
//   }
//   return sub;
// }

//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////

int zw_version() { return Z_PROTO_VERSION; }

// ██████  ███████ ██    ██
// ██   ██ ██      ██    ██
// ██   ██ █████   ██    ██
// ██   ██ ██       ██  ██
// ██████  ███████   ████

// C++ Way of Calling Callbacks
// cb : Async Function from JS
// cb : is a js object, ripe for any and all JS fuckery
int callback_test_async(emscripten::val cb)
{
  printf("------ callback_test_async ------\n");

  int ret = cb(5).await().as<int>();

  return ret;
}

int callback_test(emscripten::val cb)
{
  printf("------ callback_test ------\n");

  int ret = cb(5).as<int>();

  printf("   ret val: %d \n", ret);

  return ret;
}

int callback_test_typed(CallbackType cb)
{
  printf("------ callback_test ------\n");

  int ret = cb(5).as<int>();

  printf("   ret val: %d \n", ret);

  return ret;
}

int pass_arr_cpp(std::string js_arr)
{

  printf("------ pass_arr_cpp ------\n");
  for (unsigned char item : js_arr)
  {
    std::cout << item << std::endl;
  }
  return 10;
}

pthread_t worker;
int i = 0;

void run_job(void *arg)
{
  // printf("------ thread %lu: RUN JOB ------\n", pthread_self());
  emscripten::val *cb = (emscripten::val *)arg;
  (*cb)(i);
  i++;
}

static void *worker_main(void *arg)
{
  while (true)
  {
    // printf("------ thread %lu: PROXY JOB ------\n", pthread_self());
    emscripten_proxy_sync(proxy_queue, main_thread, run_job, arg);
    sleep(1);
  }
}

int run_on_event(emscripten::val arg)
{
  // printf("------ thread %lu: run_on_event ------\n", pthread_self());
  main_thread = pthread_self();

  emscripten::val *cb = new emscripten::val(std::move(arg));

  pthread_create(&worker, NULL, worker_main, (void *)cb);

  proxy_queue = em_proxying_queue_create();
  return 0;
}

// Macro to Expose Functions
EMSCRIPTEN_BINDINGS(my_module)
{
  // Types
  // TODO SAMPLE ?
  emscripten::register_type<CallbackType>("(num: number) => number");
  // async function async_ts_callback(num: number): Promise<number> {

  emscripten::function("zw_default_config", &zw_default_config);
  // Session
  emscripten::function("zw_open_session", &zw_open_session);
  emscripten::function("zw_start_tasks", &zw_start_tasks);
  emscripten::function("zw_put", &zw_put);
  emscripten::function("zw_close_session", &zw_close_session);
  // Key Expr
  emscripten::function("zw_make_ke", &zw_make_ke);
  emscripten::function("zw_delete_ke", &zw_delete_ke);
  emscripten::function("zw_declare_ke", &zw_declare_ke);
  emscripten::function("zw_get_keyexpr", &zw_get_keyexpr);
  // Sub
  emscripten::function("zw_declare_subscriber", &zw_declare_subscriber);
  // Pub
  emscripten::function("zw_declare_publisher", &zw_declare_publisher);
  emscripten::function("zw_publisher_put", &zw_publisher_put);
  emscripten::function("zw_undeclare_publisher", &zw_undeclare_publisher);
  // Misc
  emscripten::function("zw_version", &zw_version);

  // DEV
  emscripten::function("callback_test", &callback_test);
  emscripten::function("callback_test_typed", &callback_test_typed);
  emscripten::function("callback_test_async", &callback_test_async);
  emscripten::function("pass_arr_cpp", &pass_arr_cpp);
  emscripten::function("run_on_event", &run_on_event);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
