const assert = require("assert")
const Server = require("../Server")
const server = new Server()


describe("Check config file", () => {
    it("Config file loaded or created", done => {
        assert(server.config, !undefined)
        done()
    })
})

describe("MYSQL conneciton and setup", () => {
    it("SELECTING from projects", async () => {
        var result = await server.db.query("SELECT * FROM projects")
        assert.equal(typeof result, "object") // Make sure response is of type object (array)
        assert.equal(isNaN(result.length), false) // Make sure the response is an array
    })
})