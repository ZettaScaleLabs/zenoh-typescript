SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

docker build $SCRIPT_DIR -f $SCRIPT_DIR/Dockerfile -t zenohwasm:build
docker run -v $SCRIPT_DIR:/src -it zenohwasm:build "bash build-commands.sh"
cp -r $SCRIPT_DIR/build.emscripten $SCRIPT_DIR/../src/build.emscripten