rm -rf build
rm -rf build.emscripten
mkdir build
mkdir build.emscripten
ls
cd build
echo "building from $(pwd)"
CMAKE_EXPORT_COMPILE_COMMANDS=1 emcmake cmake ..
make all
