const assert = require("assert")
const Server = require("../Server")
const server = new Server()

var test_username = "TestUser"
var test_full_name = "Test User"
var test_project = "test project"

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


describe("Check in / out testing", () => {
    it("Check in user (toggle, no project)", async() => {
        var user = await server.get_user_from_username(test_username)
        assert.equal(await server.is_checked_in(user.id), false)
        var success = await server.check_in(user.id, undefined, undefined, "Test")

        assert.equal(await server.is_checked_in(user.id), true)
        assert.equal(success, true)
    })

    it("Check out (toggle, no project)", async() => {
        var user = await server.get_user_from_username(test_username)
        assert.equal(await server.is_checked_in(user.id), true)
        var success = await server.check_in(user.id, undefined, undefined, "Test")

        assert.equal(success, true)
        assert.equal(await server.is_checked_in(user.id), false)
    })

    it("Create project, " + test_project, async() => {
        var user = await server.get_user_from_username(test_username)
        var success = await server.create_project(test_project, user)
        assert.equal(success, true)
    })

    it("Test if the user is the owner or joined", async () => {
        var user = await server.get_user_from_username(test_username)
        var project = await server.get_project(test_project)
        var is_joined = await server.is_joined_in_project(user.id, project.id)
        assert(is_joined, true)
    })

    it("Check in (force, project name)", async() => {
        var user = await server.get_user_from_username(test_username)

        var success = await server.check_in(user.id, true, test_project, "Test")

        assert.equal(success, true)
        assert.equal(await server.is_checked_in(user.id), true)
    })

    it("Check in (force, no project)", async() => {
        var user = await server.get_user_from_username(test_username)
        var success = await server.check_in(user.id, true, "", "Test")
        assert.equal(success, true)
        var last_checkin = await server.get_last_check(user.id)
        assert.equal(last_checkin.check_in, true)
        assert.equal(last_checkin.project, "")
    })
})


describe("Delete user and cleanup", () => {
    it("Delete project", async () => {
        var user = await server.get_user_from_username(test_username)
        var success = await server.delete_project(test_project, user.id)
        assert.equal(success, true)
        project = await server.get_project(test_project)
        assert.equal(project, undefined)
    })

    it("Clean up", async() => {
        var user = await server.get_user_from_username(test_username)
        await server.db.query("DELETE FROM checks WHERE user = ?", user.id)
        await server.db.query("DELETE FROM projects WHERE owner = ?", user.id)
        
    })

    it("Delete user", async () => {
        await server.delete_user(test_username)
        user = await server.get_user_from_username(test_username)
        assert.equal(user, undefined)
    })

})