# npm run clean
# npm install

set -e
# Check Emscripten installation
if ! [[ $(which emcmake) ]]; then
    echo "emcmake not found on local environment !"
    echo "Please install emscripten: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
else
    echo "emcmake found on local environment !"
    echo $(which emcmake)
fi

# Begin build

echo "Start Build Locally"

cd ./zenoh-wasm 

bash build-commands.sh 

cd ../

rm -rf ./src/wasm

cp -r ./zenoh-wasm/build.emscripten ./src/wasm

npm run build:ts