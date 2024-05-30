onmessage = function (event) {
    console.log('Worker: Message received from main script');
    console.log(event);
}