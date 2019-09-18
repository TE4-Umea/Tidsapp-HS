class Server {
    /**
     * Server side by Happy Surfers
     * Remember to comment your code!
     * Here we use underscore convention (variable_name, function_name())
     * 
     */
    constructor() {

        this.isInTest = typeof global.it === 'function'

        this.md5 = require("md5")
        this.bp = require("body-parser")
        this.express = require("express")
        this.http = require("http")
        this.https = require("https")
        this.fs = require("file-system")
        this.crypto = require("crypto")
        this.qs = require("qs")
        this.colors = require("colors")
        this.SlackJSON = require("./SlackJSON")

        this.API = require("./API")
        this.API = new this.API()

        var Database = require("./Database")


        this.config = undefined
        this.config_templete = {
            // Port of the webserver and REST API
            port: 80,
            // Token for the REST API
            token: this.hash(),
            // Admin token
            admin_token: this.hash(),
            // Slack app info
            signing_secret: "*******",
            // mySQL connection information
            mysql_host: "localhost",
            mysql_user: "admin",
            mysql_pass: "password",
            // Github branch
            branch: "master",
            // Database name
            database: "time",
            // Slack team name of the users who are allowed to sign in
            slack_team: "SLACK TEAM NAME"
        }

        try {
            this.config = JSON.parse(this.fs.readFileSync("config.json"))
            for(var key in this.config_templete){
                if(this.config[key] === undefined){
                    this.config[key] = this.config_templete[key]
                    this.log("Updated config.json with the missing option " + key)
                }
                this.fs.writeFileSync("config.json", JSON.stringify(this.config))
            }
        } catch (e) {
            this.log("Loading config.json failed, creating a default one.")
            this.fs.writeFileSync("config.json", JSON.stringify(this.config_templete))
            this.config = this.config_templete
        }

        this.load_documentation()
        this.port = this.config.port

        this.db = new Database(this.config)

        // Setup the web server via express
        this.app = this.express()

        // Use body-parser to read json/type in post / get requests
        this.app.use(this.bp.json())
        this.app.use(this.bp.urlencoded({
            extended: true
        }))


        // Create the server and start it on the port in config.json
        this.server = this.http.createServer(this.app).listen(this.port)


        // Bind socket.io to the webserver, (socket.io, REST API and the website are all on the same port)
        this.io = require("socket.io")(this.server)


        // Bind the cdn folder to the webserver, everything in it is accessable via the website
        this.app.use(this.express.static(__dirname + '/cdn'))
        // Enable PUG rendering in the express app
        this.app.set('view engine', 'pug')

        /* REST API */
        this.app.post("/api/checkin", async (req, res) => {
            this.API.checkin(req, res)
        })

        this.app.post("/api/checkout", async (req, res) => {
            this.API.checkout(req, res)
        })

        this.app.post("/api/add", async (req, res) => {
            this.API.add(req, res)
        })

        this.app.post("/api/remove", async (req, res) => {
            this.API.remove(req, res)
        })

        this.app.post("/api/project", async (req, res) => {
            this.API.project(req, res)
        })

        this.app.post("/api/check", async (req, res) => {
            this.API.check(req, res)
        })

        this.app.post("/api/login", async (req, res) => {
            this.API.login(req, res)
        })

        /* SOCKET IO */
        this.io.on("connection", socket => {
            socket.on("get_documentation", () => {
                socket.emit("documentation", this.documentation)
            })

            socket.on("upload_documentation", pack => {
                if(pack.token === this.config.admin_token){
                    delete pack.token
                    if(pack.title.length == 0){
                        socket.emit("err", "Don't forget the title")
                        return
                    }
                    try{
                        this.fs.writeFileSync("documentation/"+pack.title.split(" ").join("_")+".json", JSON.stringify(pack))
                        socket.emit("err", "Success!")
                        this.load_documentation()
                    } catch(e){
                        this.log(e)
                        socket.emit("err", "Error writing fail, check the title. Make sure there are no weird characters in it.")
                    }
                } else {
                    socket.emit("err", "Wrong token")
                }
            })
        })

        /* WEBHOOK */
        this.app.post("/webhook", async (req, res) => {
            log("Restarting because of webhook")
            require("child_process").exec("git pull origin " + this.config.branch)
        })

        /* SLACK API */

        this.app.post("/api/slack/checkin", async (req, res) => {
            var success = this.verify_slack_request(req)
            if (success) {
                var user = await this.get_user_from_slack(req)
                if (user) {

                } else {
                    res.json(new this.SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [new this.SlackJSON.SlackAttachement("https://hs.ygstr.com")]))
                }
            }
        })

        this.routes()
        this.on_loaded()
    }

    /**
     * Log message with timestamp
     * Use this when a log should stay in the code
     * @param {*} message 
     */
    log(message) {
        if (this.isInTest) return
        var date = new Date()
        console.log(`[${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}] ${message}`)
    }

    on_loaded() {
        this.log(`Happy Surfer's TimeTracker has started on port: ${this.port}`)
    }

    hash() {
        return this.crypto.randomBytes(20).toString('hex').toUpperCase()
    }

    load_documentation() {
        this.documentation = []
        this.unsorted_documentation = []
        var pages = this.fs.readdirSync("documentation")

        

        for (var page of pages) {
            this.unsorted_documentation.push(JSON.parse(this.fs.readFileSync("documentation/" + page)))
        }

        this.unsorted_documentation.sort((a, b) => {
            return b.pinned
        })

        for(page of this.unsorted_documentation){
            if(page.type == "text"){
                this.documentation.push(page)
            }
        }

        for(page of this.unsorted_documentation){
            if(page.type == "class"){
                this.documentation.push(page)
                for(var p of this.unsorted_documentation){
                    if(p.class == page.title){
                        this.documentation.push(p)
                    }
                }
            }
        }


    }


    /**
     * 
     * @param {*} user_id 
     * @param {*} check_in 
     * @param {*} project_name 
     * @param {*} type 
     * @returns Success, if the check in/out was successfull
     */
    async check_in(user_id, check_in = null, project_name = null, type = "Slack") {
        var user = await this.get_user(user_id)
        if (user) {
            if (project_name) {
                var project = await this.get_project(project_name)
                if (project) {
                    var owns_project = await this.is_joined_in_project(user.id, project.id)
                    if (!owns_project) {
                        this.log("User isn't apart of the project")
                        return false
                    }
                } else {
                    return false
                }

            }
            var last_check = await this.get_last_check(user.id)
            if (check_in === null) {
                // Toggle checkin
                await this.insert_check(user.id, !last_check.check_in, project_name, type)
                return true
            }
            if (check_in != last_check.check_in) {
                // A change, commit the check
                await this.insert_check(user.id, check_in, project_name, type)
                return true
            } else {
                if (check_in && project_name != last_check.project) {
                    await this.insert_check(user.id, check_in, project_name, type)
                    return true
                }
            }
        } else {
            this.log("User ID not found".red)
            return false
        }
    }

    async is_joined_in_project(user_id, project_id) {
        if (await this.db.query_one("SELECT * FROM joints WHERE project = ? && user = ?", [project_id, user_id])) return true
        if (await this.get_project_from_id(project_id)) return true
        return false
    }

    /**
     * 
     * @param {*} user_id 
     * @param {*} check_in 
     * @param {*} project 
     * @param {*} type 
     */
    async insert_check(user_id, check_in, project, type) {
        var user = await this.get_user(user_id)
        if (!check_in) project = ""
        await this.db.query("INSERT INTO checks (user, check_in, project, date, type) VALUES (?, ?, ?, ?, ?)", [user_id, check_in, project, Date.now(), type])
        this.log(user.name + " checked " + (check_in ? "in" : "out") + " via " + type)
    }
    /**
     * Check if a user is checked in
     * @param {*} user_id ID of the user
     */
    async is_checked_in(user_id) {
        var checked_in = await this.get_last_check(user_id)
        return checked_in.check_in
    }

    /**
     * 
     * @param {*} user_id 
     */
    async get_last_check(user_id) {
        var last_check_in = await this.db.query_one("SELECT * FROM checks WHERE user = ? ORDER BY date DESC LIMIT 1", user_id)
        if (!last_check_in) return {
            check_in: false,
            project: ""
        }
        return last_check_in
    }

    /**
     * 
     * @param {*} project_name 
     */
    async get_project(project_name) {
        var project = await this.db.query_one("SELECT * FROM projects WHERE upper(name) = ?", project_name.toUpperCase())
        return project
    }

    async get_project_from_id(project_id) {
        var project = await this.db.query_one("SELECT * FROM projects WHERE id = ?", project_id)
        return project
    }

    async create_project(project_name, user) {
        if (project_name.length > 20 || project_name < 3) {
            this.log("Project name is too short")
            return false
        }
        await this.db.query("INSERT INTO projects (name, owner) VALUES (?, ?)", [project_name, user.id])
        return true
    }

    async add_user_to_project(user_to_add, project_id, user) {

    }

    /**
     * Get user from slack request, if they are not registered an account will be created.
     * @param {*} req Slack request
     */
    async get_user_from_slack(req) {
        var success = verify_slack_request(req)
        if (success) {
            var body = req.body
            var slack_id = body.user_id
            var user = await get_user_from_slack_id(slack_id)
            if (user) {
                return user
            } else {
                return false
            }
        }
    }

    /**
     * Create a new account in the database
     * @param {*} username Username of the account
     * @param {*} password Password of the account
     * @param {*} full_name Full name of the user
     */
    async create_user(username, password, full_name) {
        // Insert into the database
        await this.db.query("INSERT INTO users (username, name, password) VALUES (?, ?, ?)", [username, full_name, this.md5(password)])
        var user = this.get_user_from_username(username)
        if (user) {
            this.log("Account created for " + full_name)
            return user
        }
    }

    async delete_user(username) {
        var user = await this.get_user_from_username(username)
        if (user) {
            await this.db.query("DELETE FROM users WHERE id = ?", user.id)
            return true
        }
        return false
    }

    /**
     * Get user via their slack user id
     * @param {*} slack_id
     */
    async get_user_from_slack_id(slack_id) {
        return false
    }

    /**
     * Get a user from the database
     * @param {Int} user_id ID of the user
     * @returns {User} User
     */
    async get_user(user_id) {
        var user = await this.db.query_one("SELECT * FROM users WHERE id = ?", user_id)
        return user ? user : false
    }

    async get_user_from_username(username) {
        var user = await this.db.query_one("SELECT * FROM users WHERE username = ?", username)
        return user
    }


    routes() {
        /* Website pages */
        this.app.get("/", (req, res) => {
            res.render("dashboard")
        })

        this.app.get("/signup", (req, res) => {
            res.render("signup")
        })

        this.app.get("/api", (req, res) => {
            res.render("api")
        })

        this.app.get("/edit", (req, res) => {
            res.render("edit")
        })
    }

    verify_slack_request(req) {
        try {
            var slack_signature = req.headers['x-slack-signature']
            var request_body = qs.stringify(req.body, {
                format: 'RFC1738'
            })
            var timestamp = req.headers['x-slack-request-timestamp']
            var time = Math.floor(new Date().getTime() / 1000)
            if (Math.abs(time - timestamp) > 300) {
                return false
            }

            var sig_basestring = 'v0:' + timestamp + ':' + request_body
            var my_signature = 'v0=' +
                this.crypto.createHmac('sha256', this.config.signing_secret)
                .update(sig_basestring, 'utf8')
                .digest('hex')
            if (this.crypto.timingSafeEqual(
                    Buffer.from(my_signature, 'utf8'),
                    Buffer.from(slack_signature, 'utf8'))) {
                return true
            } else {
                return false
            }
        } catch (e) {
            console.log(e) // KEEP
            log("ERROR: Make sure your config.json:signing_secret is correct!")
        }
    }
}

module.exports = Server