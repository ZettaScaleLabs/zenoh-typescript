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

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

docker build $SCRIPT_DIR -f $SCRIPT_DIR/Dockerfile -t zenohwasm:build
docker run -v $SCRIPT_DIR:/src -it zenohwasm:build "bash build-commands.sh"

rm -rf $SCRIPT_DIR/../src/wasm
cp -r $SCRIPT_DIR/build.emscripten $SCRIPT_DIR/../src/wasm