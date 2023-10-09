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
target_compile_options(zenohpico PUBLIC -fPIC -pthread)

set(WASM_LINK_FLAGS "--js-library=${CMAKE_SOURCE_DIR}/func-wrapper.js -sTEXTDECODER=0 -sEXPORTED_RUNTIME_METHODS=[\"UTF8ToString\"] -sPTHREAD_POOL_SIZE=16 -sERROR_ON_UNDEFINED_SYMBOLS=0 -sALLOW_TABLE_GROWTH -s RESERVED_FUNCTION_POINTERS=100 -s ASYNCIFY=1 -s MAIN_MODULE=1 -s LINKABLE=1 -s EXPORT_ALL=1 -pthread -fPIC")

set(WASM_BUILD_FLAGS "-sMAIN_MODULE=1 -pthread -fPIC -DZENOH_EMSCRIPTEN=1 -DZ_LINK_WS=1 -DZ_LINK_TCP=0 -DZ_LINK_UDP_MULTICAST=0 -DZ_LINK_UDP_UNICAST=0 -DZ_SCOUTING_UDP=0 -DZ_MULTI_THREAD=1")

add_executable(zenoh-wasm src/zenoh.c)
set_target_properties(zenoh-wasm PROPERTIES LINK_FLAGS ${WASM_LINK_FLAGS} )
set_target_properties (zenoh-wasm PROPERTIES COMPILE_FLAGS ${WASM_BUILD_FLAGS})
target_link_libraries(zenoh-wasm zenohpico)

