import { SimpleChannel } from "channel-ts";
 
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
 
// printer waits for the messages on the channel until it closes
async function printer(chan: SimpleChannel<string>) {
    for await(const data of chan) { // use async iterator to receive data
        let x = JSON.stringify(data);
        console.log(x);
        
        console.log(`Received: ${data}`);
    }
    console.log("Closed");
}
 
// sender sends some messages to the channel
async function sender(id: number, chan: SimpleChannel<string>) {
    await delay(id*2000);
    chan.send(`hello from ${id}`); // sends data, boundless channels don't block
    await delay(2000);
    chan.send(`bye from ${id}`); // sends some data again
}
 
export async function main_ch() {
    const chan = new SimpleChannel<string>(); // creates a new simple channel
    const p1 = printer(chan); // uses the channel to print the received data
    const p2 = [0, 1, 2, 3, 4].map(async i => sender(i, chan)); // creates and spawns senders
 
    await Promise.all(p2); // waits for the sender
    chan.close(); // closes the channel on the server end
    await p1; // waits for the channel to close on the receiver end too
}
///////////////////////////////////////////////////////////////// 

interface PersonLike {
    name: string;
    age: string;
}

class Person implements PersonLike {
    constructor(data: PersonLike) {
        this.name = data.name;
        this.age = data.age;
    }

    name: string;
    age: string;

    foo() {
        console.log("Hey!");
    }
}


fetch("/api/data")
    .then(response => {
        return response.json() as Promise<PersonLike>;
    }).then((data) => {
        const person = new Person(data);

        person.foo();
    });
