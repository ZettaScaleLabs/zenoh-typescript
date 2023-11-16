import * as zenoh from "zenoh"
import * as express from "express"

async function main() {
	console.log(" TEST");
	const app = express()
	const session = await zenoh.Session.open(zenoh.Config.new("ws/0.0.0.0:7887"))
	console.log("Opened session")
	const sub = await session.declare_subscriber("hi", {
		async onEvent(sample) { console.log("hi") },
	});
	app.get("/declare", async (req, res) => {
		await session.put("hi", "there");
		res.send("Hello world")
	})
	app.listen(3000)
}
main().then(() => console.log("Done")).catch(e => { throw e })