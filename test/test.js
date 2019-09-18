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


describe("Check in / out testing", () => {
    it("Check in user (toggle, no project)", async() => {
        var user = await server.get_user_from_username(test_username)
        assert.equal(await server.is_checked_in(user.id), false)
        var success = await server.check_in(user.id, undefined, undefined, "Test")

        assert.equal(await server.is_checked_in(user.id), true)
        assert.equal(success, true)

    })

    it("Check in out (toggle, no project)", async() => {
        var user = await server.get_user_from_username(test_username)
        assert.equal(await server.is_checked_in(user.id), true)
        var success = await server.check_in(user.id, undefined, undefined, "Test")
        assert.equal(success, true)
        assert.equal(await server.is_checked_in(user.id), false)
    })
})


describe("Delete user", () => {
    it("Delete user", async () => {
        await server.delete_user(test_username)
        user = await server.get_user_from_username(test_username)
        assert.equal(user, undefined)
    })
})