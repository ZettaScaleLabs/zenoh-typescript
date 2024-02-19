# npm run clean
# npm install
echo "Start Build Locally"
cd ./zenoh-wasm 
bash build-commands.sh 
cd ../
rm -rf ./src/wasm
cp -r ./zenoh-wasm/build.emscripten ./src/wasm
npm run build:ts