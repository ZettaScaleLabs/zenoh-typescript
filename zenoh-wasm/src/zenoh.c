#include "zenoh-pico.h"
#include "zenoh-pico/api/types.h"
#include "zenoh-pico/system/platform.h"
#include <emscripten/emscripten.h>

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

extern void call_js_callback(int, uint8_t *, int);
extern void remove_js_callback(void*);
extern void test_call_js_callback();


EMSCRIPTEN_KEEPALIVE
void test_sleep(int ms) { sleep(ms); }

EMSCRIPTEN_KEEPALIVE
int zw_version() { return Z_PROTO_VERSION; }

EMSCRIPTEN_KEEPALIVE
void *zw_default_config(const char *locator)
{
  if (locator == NULL)
  {
    return NULL;
  }

  z_owned_config_t *config =
      (z_owned_config_t *)z_malloc(sizeof(z_owned_config_t));
  *config = z_config_default();
  zp_config_insert(z_loan(*config), Z_CONFIG_CONNECT_KEY,
                   z_string_make(locator));
  return (void *)config;
}

EMSCRIPTEN_KEEPALIVE
void *zw_open_session(z_owned_config_t *config)
{
  z_owned_session_t *session =
      (z_owned_session_t *)z_malloc(sizeof(z_owned_session_t));
  *session = z_open(z_move(*config));
  if (!z_check(*session))
  {
    printf("Unable to open session!\n");
    z_free(session);
    return NULL;
  }
  return session;
}

EMSCRIPTEN_KEEPALIVE
int zw_start_tasks(z_owned_session_t *s)
{
  if (zp_start_read_task(z_loan(*s), NULL) < 0 ||
      zp_start_lease_task(z_loan(*s), NULL) < 0)
  {
    printf("Unable to start read and lease tasks");
    return -1;
  }
  return 0;
}

EMSCRIPTEN_KEEPALIVE
z_owned_keyexpr_t *zw_make_ke(const char *keyexpr)
{
  z_owned_keyexpr_t *ke = NULL;
  z_owned_keyexpr_t oke = z_keyexpr_new(keyexpr);
  if (z_check(oke))
  {
    ke = (z_owned_keyexpr_t *)z_malloc(sizeof(z_owned_keyexpr_t));
    _z_keyexpr_set_owns_suffix(oke._value, true);
    *ke = oke;
  }
  return ke;
}

EMSCRIPTEN_KEEPALIVE
void *zw_declare_ke(z_owned_session_t *s, const char *keyexpr)
{

  z_owned_keyexpr_t *ke =
      (z_owned_keyexpr_t *)z_malloc(sizeof(z_owned_keyexpr_t));
  z_keyexpr_t key = z_keyexpr(keyexpr);
  *ke = z_declare_keyexpr(z_loan(*s), key);
  if (!z_check(*ke))
  {
    printf("Unable to declare key expression!\n");
    exit(-1);
  }
  return ke;
}

EMSCRIPTEN_KEEPALIVE
int zw_put(z_owned_session_t *s, z_owned_keyexpr_t *ke, char *value, int len)
{
  z_put_options_t options = z_put_options_default();
  options.encoding = z_encoding(Z_ENCODING_PREFIX_TEXT_PLAIN, NULL);
  return z_put(z_loan(*s), z_loan(*ke), (const uint8_t *)value, len, &options);
}

EMSCRIPTEN_KEEPALIVE
void spin(z_owned_session_t *s)
{
  zp_read(z_loan(*s), NULL);
  zp_send_keep_alive(z_loan(*s), NULL);
  // zp_send_join(z_loan(*s), NULL);
}

EMSCRIPTEN_KEEPALIVE
void close_session(z_owned_session_t *s) { z_close(z_move(*s)); }

void wrapping_sub_callback(const z_sample_t *sample, void *ctx)
{

  int id = (int)ctx;
  char *data = NULL;
  data = (char *)z_malloc((sample->payload.len + 1) * sizeof(char));
  memcpy(data, sample->payload.start, sample->payload.len);
  data[sample->payload.len] = '\0';
  printf("[wrapping_sub_callback] [%p] Data: %s\n", data, data);
  call_js_callback(id, data, sample->payload.len);
  // If call_js_callback proxy to JS becomes async then the free has to be done
  // in call_js_callback
  z_free(data);
}

EMSCRIPTEN_KEEPALIVE
void *zw_sub(z_owned_session_t *s, z_owned_keyexpr_t *ke, int js_callback)
{
  z_owned_subscriber_t *sub =
      (z_owned_subscriber_t *)z_malloc(sizeof(z_owned_subscriber_t));
  z_owned_closure_sample_t callback =
      z_closure(wrapping_sub_callback, remove_js_callback, (void *)js_callback);
  // printf("JS callback is at: %p\n",js_callback);
  *sub = z_declare_subscriber(z_loan(*s), z_loan(*ke), z_move(callback), NULL);
  if (!z_check(*sub))
  {
    printf("Unable to declare subscriber.\n");
    exit(-1);
  }
  return sub;
}

EMSCRIPTEN_KEEPALIVE
void z_wasm_free(void *ptr) { z_free(ptr); }

void *call_js_function(void *js_callback_id)
{
  int js_callback = (int)js_callback_id;
  z_sleep_ms(2500);
  printf("JS callback ID is: %d\n", js_callback);
  call_js_callback(js_callback, "Hello from C", 12);
}

EMSCRIPTEN_KEEPALIVE void
call_js_function_on_another_thread(int js_callback_id)
{

  pthread_t cb_thr;
  pthread_create(&cb_thr, 0, &call_js_function, (void *)js_callback_id);
}

EMSCRIPTEN_KEEPALIVE void *test_callback_js(int js_callback_id)
{
  test_call_js_callback();
}
