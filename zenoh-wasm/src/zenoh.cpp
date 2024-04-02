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

// EMSCRIPTEN_KEEPALIVE
// void *zw_default_config(const char *locator)
// {
//   if (locator == NULL)
//   {
//     return NULL;
//   }

//   z_owned_config_t *config =
//       (z_owned_config_t *)z_malloc(sizeof(z_owned_config_t));
//   *config = z_config_default();
//   zp_config_insert(z_loan(*config), Z_CONFIG_CONNECT_KEY,
//                    z_string_make(locator));
//   return (void *)config;
// }

EMSCRIPTEN_KEEPALIVE
void *zw_session_close(z_owned_config_t *config)
{
  z_owned_session_t *session =
      (z_owned_session_t *)z_malloc(sizeof(z_owned_session_t));

  // TODO:CLOSE SESSION
  // *session = z_open(z_move(*config));
  // if (!z_check(*session))
  // {
  //   printf("Unable to open session!\n");
  //   z_free(session);
  //   return NULL;
  // }
  // return session;
}

EMSCRIPTEN_KEEPALIVE
void zw_delete_ke(z_owned_keyexpr_t *keyexpr) { return z_drop(keyexpr); }

// TODO Complete
// EMSCRIPTEN_KEEPALIVE
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

// ███    ██ ███████  ██████
// ████   ██ ██      ██    ██
// ██ ██  ██ █████   ██    ██
// ██  ██ ██ ██      ██    ██
// ██   ████ ███████  ██████

EMSCRIPTEN_KEEPALIVE
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

// returns z_owned_session_t *
int zw_open_session(int config_ptr)
{

  main_thread = pthread_self();
  proxy_queue = em_proxying_queue_create();

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

int zw_start_tasks(int session_ptr)
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

int zw_put(int session_ptr, int key_expr_ptr, std::string value_str)
{
  // TODO: cleanup
  // std::cout << "session_ptr"  << session_ptr << std::endl;
  // std::cout << "key_expr_ptr" << key_expr_ptr << std::endl;
  // std::cout << "value_str"    << value_str << std::endl;
  // printf("zw_put \n");
  // printf("%p \n",(void*)key_expr_ptr);
  // printf("%d \n",key_expr_ptr);
  // printf("zw_put \n");

  z_put_options_t options = z_put_options_default();
  options.encoding = z_encoding(Z_ENCODING_PREFIX_TEXT_PLAIN, NULL);

  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);
  // std::cout << "    zw_put ke " << key_expr_ptr << std::endl;
  // printf("%X",key_expr_ptr);

  // std::cout << "    keyexpr: " << ke->_value->_suffix << std::endl;

  // Static cast is supposed to safer ?
  const uint8_t *value = (const uint8_t *)value_str.data();

  // TODO: Cleanup
  // std::cout << "return value"    << value_str << std::endl;

  return z_put(z_loan(*s), z_loan(*ke), value, value_str.length(), &options);
}

// returns z_owned_keyexpr_t
// int zw_make_ke(const char *keyexpr) {
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

struct closure_t
{
  void *cb;
  const z_sample_t *sample;
};

void run_callback(void *arg)
{
  // printf("------ thread %lu: RUN CB ------\n", pthread_self());
  closure_t *closure = (closure_t *)arg;
  emscripten::val *cb = (emscripten::val *)closure->cb;
  z_owned_str_t keystr = z_keyexpr_to_string(closure->sample->keyexpr);
  (*cb)((int)z_str_loan(&keystr), (int)closure->sample->payload.start, (int)closure->sample->payload.len);
  z_str_drop(z_str_move(&keystr));
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
  emscripten_proxy_sync(proxy_queue, main_thread, run_callback, &closure);
}


// ██████  ███████  ██████ ██       █████  ██████  ███████     
// ██   ██ ██      ██      ██      ██   ██ ██   ██ ██          
// ██   ██ █████   ██      ██      ███████ ██████  █████       
// ██   ██ ██      ██      ██      ██   ██ ██   ██ ██          
// ██████  ███████  ██████ ███████ ██   ██ ██   ██ ███████     

// void *zw_declare_ke(z_owned_session_t *s, const char *keyexpr)
int zw_declare_ke(int session_ptr, std::string keyexpr_str)
{
  // TODO CLEANUP
  // std::cout << "C - zw_declare_ke NEW!" << std::endl;
  // std::cout << "session_ptr: " << session_ptr << std::endl;
  // std::cout << "keyexpr_str: " << keyexpr_str << std::endl;

  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);

  z_owned_keyexpr_t *ke =
      (z_owned_keyexpr_t *)z_malloc(sizeof(z_owned_keyexpr_t));

  const char *keyexpr = (const char *)keyexpr_str.data();

  z_keyexpr_t key = z_keyexpr(keyexpr);

  *ke = z_declare_keyexpr(z_loan(*s), key);

  if (!z_check(*ke))
  {
    printf("Unable to declare key expression!\n");
    exit(-1);
  }

  // TODO Cleanup
  // std::cout << "ke: " << ke << std::endl;
  // std::cout << "=========" << std::endl;
  // std::cout << "    zw_declare_ke ke " << ke << std::endl;
  // printf("zw_declare_ke \n");
  // printf("%p \n", ke);
  // printf("%d \n", (int)ke);
  // printf("zw_declare_ke\n");

  return (int)ke;
}

int zw_declare_subscriber(int session_ptr, int key_expr_ptr, emscripten::val ts_cb)
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

  if (!z_check(*sub))
  {
    printf("Unable to declare subscriber!\n");
    z_free(sub);
    return NULL;
  }

  return (int)sub;
}


int zw_declare_publisher(int session_ptr, int key_expr_ptr, emscripten::val ts_cb)
{

  // z_subscriber_options_t options = z_subscriber_options_t();

  // // TODO: surely Reinterpret_Cast is not the right kind of cast here ?
  // z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  // z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);

  // emscripten::val *ts_cb_ptr = new emscripten::val(std::move(ts_cb));

  // z_owned_closure_sample_t *callback =
  //     (z_owned_closure_sample_t *)z_malloc(sizeof(z_owned_closure_sample_t));

  // *callback = z_closure_sample(data_handler, NULL, ts_cb_ptr);

  // z_owned_subscriber_t *sub =
  //     (z_owned_subscriber_t *)z_malloc(sizeof(z_owned_subscriber_t));

  // *sub = z_declare_subscriber(z_loan(*s), z_loan(*ke), z_closure_sample_move(callback), &options);

  // if (!z_check(*sub))
  // {
  //   printf("Unable to declare subscriber!\n");
  //   z_free(sub);
  //   return NULL;
  // }

  // return (int)sub;
  return  10;
}



void zw_close_session(int session_ptr)
{
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);

  z_close(z_move(*s));
}

//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
// EMSCRIPTEN_KEEPALIVE
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
void remove_js_callback(void *ts_cb)
{
  // TODO: Do i need to call free here ? to clean up the ts_db
  // z_free(ts_cb ?? );
  std::cout << "    C - remove_js_callback!" << std::endl;
}


// ███████ ██    ██ ██████
// ██      ██    ██ ██   ██
// ███████ ██    ██ ██████
//      ██ ██    ██ ██   ██
// ███████  ██████  ██████

void neo_poll_read_func(int session_ptr)
{
  std::cout << "    neo_poll_read_func" << std::endl;

  //
  z_owned_session_t *session =
      reinterpret_cast<z_owned_session_t *>(session_ptr);
  //
  std::cout << "    neo_poll_read_func zp_read" << std::endl;
  zp_read(z_session_loan(session), NULL);
  //
  std::cout << "    neo_poll_read_func zp_send_keep_alive" << std::endl;
  zp_send_keep_alive(z_session_loan(session), NULL);
  //
  std::cout << "    neo_poll_read_func zp_send_join" << std::endl;
  zp_send_join(z_session_loan(session), NULL);
  std::cout << "    neo_poll_read_func FINISH" << std::endl;
}

// expects an Async Callback for now
// TODO: Sync
int neo_zw_sub(
    // exists inside WASM instance
    int session_ptr,
    // exists inside WASM instance
    int ke_ptr,
    // exists where ?
    emscripten::val ts_cb // This is a value
)
{

  std::cout << "    C - neo_zw_sub!" << std::endl;
  std::cout << "    session_ptr: " << session_ptr << std::endl;
  std::cout << "    ke_ptr: " << ke_ptr << std::endl;
  // Get pointer to ts_cb_ptr
  std::cout << "    ts_cb ptr: " << &ts_cb << std::endl;
  std::cout << "    ptr: " << std::this_thread::get_id() << std::endl;

  printf("    ::: neo_zw_sub \n");
  printf("    ::: %p \n", (void *)ke_ptr);
  printf("    ::: %d \n", ke_ptr);
  printf("    ::: neo_zw_sub \n");

  z_owned_session_t *session =
      reinterpret_cast<z_owned_session_t *>(session_ptr);

  z_owned_keyexpr_t *keyexpr = reinterpret_cast<z_owned_keyexpr_t *>(ke_ptr);

  std::cout << "    keyexpr: " << keyexpr->_value->_suffix << std::endl;

  // allocating locally a emscripten::val
  // So that ts_cb does not get dropped at end of function
  emscripten::val *ts_cb_local_ptr =
      (emscripten::val *)z_malloc(sizeof(emscripten::val));

  std::cout << "    Before Move: " << std::endl;
  // TODO
  // *ts_cb_local_ptr = ts_cb;
  // Move does not work
  // Just spins inside the browser And nothing happens
  // *ts_cb_local_ptr = std::move(ts_cb);

  std::cout << "    After Move: " << std::endl;

  // z_owned_closure_sample_t callback = z_closure(
  //     wrapping_sub_callback, remove_js_callback, (void *)ts_cb_local_ptr);
  z_owned_closure_sample_t callback =
      z_closure_sample(data_handler, NULL, NULL);

  z_owned_subscriber_t *sub =
      (z_owned_subscriber_t *)z_malloc(sizeof(z_owned_subscriber_t));

  *sub = z_declare_subscriber(z_session_loan(session), z_loan(*keyexpr),
                              z_closure_sample_move(&callback), NULL);

  printf("    (sub) : %p \n", (sub));
  printf("    (int)(sub) : %d \n", (int)(sub));

  return (int)(sub);
}

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
  emscripten::function("zw_put", &zw_put);
  emscripten::function("zw_open_session", &zw_open_session);
  emscripten::function("zw_start_tasks", &zw_start_tasks);
  emscripten::function("zw_make_ke", &zw_make_ke);
  emscripten::function("zw_close_session", &zw_close_session);
  emscripten::function("zw_version", &zw_version);
  emscripten::function("zw_declare_ke", &zw_declare_ke);
  emscripten::function("zw_declare_subscriber", &zw_declare_subscriber);

  //
  emscripten::function("neo_zw_sub", &neo_zw_sub);
  emscripten::function("neo_poll_read_func", &neo_poll_read_func);

  // DEV
  emscripten::function("callback_test", &callback_test);
  emscripten::function("callback_test_typed", &callback_test_typed);
  emscripten::function("callback_test_async", &callback_test_async);
  emscripten::function("pass_arr_cpp", &pass_arr_cpp);
  emscripten::function("run_on_event", &run_on_event);

  // emscripten::function("zw_default_config", &zw_default_config);
  //
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
