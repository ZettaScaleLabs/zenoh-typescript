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