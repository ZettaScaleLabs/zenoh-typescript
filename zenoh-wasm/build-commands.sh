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

# Check if emcmake is on path


rm -rf build
rm -rf build.emscripten
mkdir build
mkdir build.emscripten
ls
cd build
echo "building from $(pwd)"
CMAKE_EXPORT_COMPILE_COMMANDS=1 emcmake cmake ..
make -j10 all # gotta go fast
cd ..
chmod -R a+rw build.emscripten
chmod -R a+rw build