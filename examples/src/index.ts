import * as zenoh from "zenoh"
import * as express from "express"

async function main() {
	const app = express()
	const session = await zenoh.Session.open(zenoh.Config.new("ws/0.0.0.0:7887"))
	console.log("Opened session")
	app.get("/declare", (req, res) => {
		res.send("Hello world")
	})
	app.listen(3000)
}
main().then(() => console.log("Done")).catch(e => { throw e })