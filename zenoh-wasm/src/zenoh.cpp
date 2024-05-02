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

// TODO: Complete zw_session_close
// void *zw_session_close(z_owned_config_t *config)
// {
//   z_owned_session_t *session =
//       (z_owned_session_t *)z_malloc(sizeof(z_owned_session_t));

// *session = z_open(z_move(*config));
// if (!z_check(*session))
// {
//   printf("Unable to open session!\n");
//   z_free(session);
//   return NULL;
// }
// return session;
// }

// TODO: Complete zw_get
// int zw_get(z_owned_session_t *s,
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

/**
 * Exposes function to create a default session config to TypeScript
 *
 * Parameters:
 *   locator_str: String defining config connection information
 *
 * Returns:
 *   Returns a pointer in WASM memory of the default config
 */
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

/**
 * Exposes function to open session, using a config pointer to Typescript
 *
 * Parameters:
 *   config_ptr: pointer to config in WASM memory
 *
 * Returns:
 *   Returns a pointer in WASM memory to session 
 */
int zw_open_session(ts_ptr config_ptr)
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

/**
 * Exposes function to close session, using a config pointer to Typescript
 *
 * Parameters:
 *   config_ptr: pointer to session in WASM memory
 *
 * Returns:
 *   Returns 0 if session closed, negative value otherwise
 */
int zw_close_session(ts_ptr session_ptr)
{
  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  return z_close(z_move(*s));
}

/**
 * Exposes function to start Zenoh-pico Read and Write to Typescript
 *
 * Parameters:
 *   config_ptr: pointer to session in WASM memory
 *
 * Returns:
 *   Returns 0 if successful, negative value otherwise
 */
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

/**
 * Exposes function to put Value on Key Expression on Session
 *
 * Parameters:
 *  session_ptr  : pointer to session in WASM memory
 *  key_expr_ptr : pointer to Key Expression in WASM memory
 *  value_str    : Uint8 Array as String TODO: Represent rather as a emscripten::val and extract bytes ? 
 *
 * Returns:
 *   Returns 0 if successful, negative value otherwise
 */
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

  return (int)ke;
}

void zw_delete_ke(ts_ptr keyexpr_ptr)
{
  z_owned_keyexpr_t *key_expr = reinterpret_cast<z_owned_keyexpr_t *>(keyexpr_ptr);
  return z_drop(key_expr);
}

// TODO :
// Look into .resolve to get ts_str
// emscripten::val zw_get_keyexpr(ts_ptr keyexpr_ptr)
// {
//   z_owned_keyexpr_t *owned_key_expr = reinterpret_cast<z_owned_keyexpr_t *>(keyexpr_ptr);
//   // printf("z_owned_keyexpr_t *owned_key_expr value : %s \n", owned_key_expr->_value);
//   // This KeyExpr is Null, only get the ID
//   // z_keyexpr_t key_expr = z_loan(*owned_key_expr);
//   // TODO: Get resource properly from Resource Pool managed by Zenoh Pico
//   // _z_resource_t *r = _z_get_resource_by_key(s=>, owned_key_expr->_value);
//   //
//   const char *my_str = "PLACEHOLDER/KEY/EXPR";
//   emscripten::val ts_str = emscripten::val::u8string(my_str);
//   return ts_str;
// }

//  █████  ███████ ██    ██ ███    ██  ██████      ██████  █████  ██      ██      ██████   █████   ██████ ██   ██ ███████ 
// ██   ██ ██       ██  ██  ████   ██ ██          ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██  ██      
// ███████ ███████   ████   ██ ██  ██ ██          ██      ███████ ██      ██      ██████  ███████ ██      █████   ███████ 
// ██   ██      ██    ██    ██  ██ ██ ██          ██      ██   ██ ██      ██      ██   ██ ██   ██ ██      ██  ██       ██ 
// ██   ██ ███████    ██    ██   ████  ██████      ██████ ██   ██ ███████ ███████ ██████  ██   ██  ██████ ██   ██ ███████ 

struct closure_t
{
  void *cb;
  const z_sample_t *sample;
};

void run_callback(void *arg)
{
  closure_t *closure = (closure_t *)arg;

  emscripten::val *cb = (emscripten::val *)closure->cb;

  z_owned_str_t keystr = z_keyexpr_to_string(closure->sample->keyexpr);

  (*cb)(
      (int)z_str_loan(&keystr),
      (int)closure->sample->payload.start,
      (int)closure->sample->payload.len);

  z_str_drop(z_str_move(&keystr));
}

void data_handler(const z_sample_t *sample, void *arg)
{
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

int zw_declare_subscriber(ts_ptr session_ptr, ts_ptr key_expr_ptr, emscripten::val ts_cb)
{
  z_subscriber_options_t options = z_subscriber_options_t();

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

  z_owned_session_t *s = reinterpret_cast<z_owned_session_t *>(session_ptr);
  z_owned_keyexpr_t *ke = reinterpret_cast<z_owned_keyexpr_t *>(key_expr_ptr);

  z_owned_publisher_t *pub =
      (z_owned_publisher_t *)z_malloc(sizeof(z_owned_publisher_t));

  *pub = z_declare_publisher(
      z_loan(*s),
      z_loan(*ke),
      &options);

  // TODO: Note: There is a bug that the subscriber will
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

  return z_undeclare_publisher(z_move(*pub));
}

int zw_version() { return Z_PROTO_VERSION; }

// Macro to expose functions to typescript
EMSCRIPTEN_BINDINGS(my_module)
{
  // Config
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
  // emscripten::function("zw_get_keyexpr", &zw_get_keyexpr);
  // Sub
  emscripten::function("zw_declare_subscriber", &zw_declare_subscriber);
  // Pub
  emscripten::function("zw_declare_publisher", &zw_declare_publisher);
  emscripten::function("zw_publisher_put", &zw_publisher_put);
  emscripten::function("zw_undeclare_publisher", &zw_undeclare_publisher);
  // Misc
  emscripten::function("zw_version", &zw_version);
  //
}