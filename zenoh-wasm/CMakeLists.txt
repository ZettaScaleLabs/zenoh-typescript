#
# Copyright (c) 2023 ZettaScale Technology
#
# This program and the accompanying materials are made available under the
# terms of the Eclipse Public License 2.0 which is available at
# http://www.eclipse.org/legal/epl-2.0, or the Apache License, Version 2.0
# which is available at https://www.apache.org/licenses/LICENSE-2.0.
#
# SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
#
# Contributors:
#   ZettaScale Zenoh Team, <zenoh@zettascale.tech>
#

cmake_minimum_required(VERSION 3.10)

project(zenohjs)
set(CMAKE_C_STANDARD 11)

set(CMAKE_VERBOSE_MAKEFILE on)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build.emscripten)

# PICO
set(BUILD_EXAMPLES OFF CACHE BOOL "Disables examples" FORCE)
set(BUILD_TESTING OFF CACHE BOOL "DIsables tests" FORCE)
set(BUILD_MULTICAST OFF CACHE BOOL "Disables multicast tests" FORCE)
set(BUILT_INTEGRATION OFF CACHE BOOL "Disables integration tests " FORCE)
set(BUILD_TOOLS OFF CACHE BOOL "Disables build tools" FORCE)

add_subdirectory(${CMAKE_SOURCE_DIR}/zenoh-pico)
include_directories(${CMAKE_SOURCE_DIR}/zenoh-pico/include)
target_compile_definitions(zenohpico PUBLIC Z_LINK_WS=1 Z_LINK_TCP=0 Z_LINK_UDP_MULTICAST=0 Z_LINK_UDP_UNICAST=0 Z_SCOUTING_UDP=0 Z_MULTI_THREAD=1)
# target_compile_options(zenohpico PUBLIC -fPIC)
target_compile_options(zenohpico PUBLIC -fPIC -pthread)
# -fPIC : When used as a Library, the code is not  linked to an address

set(CMAKE_EXECUTABLE_SUFFIX ".js")

set(WASM_BUILD_FLAGS " \
-fPIC \
-D ZENOH_EMSCRIPTEN=1 \
-D Z_LINK_WS=1 \
-D Z_LINK_TCP=0 \
-D Z_LINK_UDP_MULTICAST=0 \
-D Z_LINK_UDP_UNICAST=0 \
-D Z_SCOUTING_UDP=0 \
-D Z_PUBLICATION=1 \
-pthread \
-D Z_MULTI_THREAD=1 \
-D Z_QUERYABLE=1 \
-D Z_QUERY=1")

# -pthread \
# -D Z_MULTI_THREAD=1")

# func-wrapper Adds a JS-Callback to be passed to C to be used. 
# TODO more functions exposed via Exported_functions
set(WASM_LINK_FLAGS "--extern-pre-js=${CMAKE_SOURCE_DIR}/COPYWRITE.js \
-s TEXTDECODER=0 \
-s ENVIRONMENT=web,worker \
-s EXPORTED_RUNTIME_METHODS=['writeArrayToMemory','getValue','setValue','registerJSCallback','onRuntimeInitialized','cwrap','UTF8ToString','stringToUTF8OnStack'] \
-s EXPORTED_FUNCTIONS=['_malloc'] \
-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
-s ALLOW_TABLE_GROWTH \
-s RESERVED_FUNCTION_POINTERS=100 \
-s ASYNCIFY=1 \
-s EXPORT_ES6=1 \
-s MODULARIZE=1 \
-s USE_ES6_IMPORT_META=1 \
-s LINKABLE=1 \
-s EXPORT_ALL=1 \
-s EXPORT_NAME=zenohWasm \
-s ALLOW_TABLE_GROWTH \
-fPIC \
-pthread \
-s PTHREAD_POOL_SIZE=5 \
--bind")

# -s PTHREAD_POOL_SIZE=1 \
# -pthread \

# Cannot Export Types for C files
# Need to figure out how to emit types for C files
#  --embind-emit-tsd =${CMAKE_SOURCE_DIR}/zenoh-wasm.d.ts \
# can emit types for C++, add C++ interface file to make emitting types easier ?
# set(TYPE_GENERATION_FLAG "-lembind --embind-emit-tsd /src/zenoh-wasm/build.emscripten/zenoh-wasm.d.ts")

# set_source_files_properties(src/zenoh.c PROPERTIES COMPILE_FLAGS ${TYPE_GENERATION_FLAG})


add_executable(zenoh-wasm src/zenoh.cpp)
set_target_properties(zenoh-wasm PROPERTIES LINK_FLAGS ${WASM_LINK_FLAGS} )
set_target_properties (zenoh-wasm PROPERTIES COMPILE_FLAGS ${WASM_BUILD_FLAGS})
target_link_libraries(zenoh-wasm zenohpico)