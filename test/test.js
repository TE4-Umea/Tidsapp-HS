const assert = require("assert")
const Server = require("../Server")
const server = new Server()

var test_username = "TestUser"
var test_full_name = "Test User"

describe("Check config file", () => {
    it("Config file loaded or created", done => {
        assert(server.config, !undefined)
        done()
    })
})

describe("MYSQL connection and account managing", () => {

    describe("MYSQL Connection", () => {
        it("SELECTING from projects", async () => {
            var result = await server.db.query("SELECT * FROM projects")
            assert.equal(typeof result, "object") // Make sure response is of type object (array)
            assert.equal(isNaN(result.length), false) // Make sure the response is an array
        })
    })


    describe("Managing", () => {
        

        it("Delete if exists, then creating a test account", async () => {
            await server.delete_user(test_username)
            var user = await server.create_user(test_username, "test_password", test_full_name)
            assert.notEqual(user, undefined)
            assert.equal(user.username, test_username)
        })

    })
})

/* TODO: Test check in, check out*/


describe("Delete user", () => {
    it("Delete user", async () => {
        await server.delete_user(test_username)
        user = await server.get_user_from_username(test_username)
        assert.equal(user, undefined)
    })
})