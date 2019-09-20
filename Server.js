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
        
        this.SlackAPI = require("./SlackAPI")

        this.API = require("./API")
        

        this.online_users = []
        this.slack_sign_users = []

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
            client_id: "00032323",
            client_secret: "********",
            // mySQL connection information
            mysql_host: "localhost",
            mysql_user: "admin",
            mysql_pass: "password",
            // Github branch
            branch: "master",
            // Database name
            database: "time",
        }

        try {
            this.config = JSON.parse(this.fs.readFileSync("config.json"))
            var updated = false
            for(var key in this.config_templete){
                if(this.config[key] === undefined){
                    this.config[key] = this.config_templete[key]
                    updated = true
                    this.log("Updated config.json with the missing option " + key)
                }
                if(updated) this.fs.writeFileSync("config.json", JSON.stringify(this.config))
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

        this.API = new this.API(this)

        /* SOCKET IO */
        this.io.on("connection", socket => {

            socket.on("disconnect", () => {
                // Remove this connection from online users
                this.online_users.splice(this.online_users.indexOf(socket.id), 1)
            })

            socket.on("sign_slack", async info => {
                for(var sign of this.slack_sign_users){
                    if(sign.token === info.sign_token){
                        var user = this.get_user_from_token(info.token)
                        if(user){
                            // Fill users slack information
                            await db.query("UPDATE users WHERE id = ? SET (email, slack_id, slack_domain, access_token, avatar, name) VALUES (?, ?, ?, ?, ?, ?)", [user.id, sign.email, sign.slack_id, sign.slakc_domain, sign.access_token, sign.avatar, sign.name])
                        }
                    }
                }
            })

            socket.on("login_with_token", async token => {
                var user = await this.get_user_from_token(token)
                if(user){
                    delete user.password
                    // Add the connection to the online users pool
                    this.online_users[socket.id] = user.id
                    socket.emit("login", user)
                } else {
                    socket.emit("invalid_token")
                }
            })

            socket.on("login", async info => {

                var user = await this.get_user_from_username(info.username)
                if(user){
                    // Sign in
                    user = await this.get_user_from_username_and_password(info.username, info.password)
                    if(user){
                        var token = await this.generate_token(user.username)
                        if(token){
                            socket.emit("token", token)
                        }
                    } else {
                        socket.emit("login_err", "Wrong password")
                        return
                    }
                } else {
                    // Sign up
                    if(info.username.replace(/[^a-z0-9_]+|\s+/gmi, "") !== info.username){
                        socket.emit("login_err", "Username contains illigal characters")
                        return
                    }
                    if(info.username.length < 3){
                        socket.emit("login_err" ,"Username has to be at least three characters long")
                        return
                    }
                    if(info.username.length > 20){
                        socket.emit("login_err", "Username cannot exceed 20 characters")
                        return
                    }
                    if(info.name.indexOf(" ") == -1){
                        socket.emit("login_err", "Please provide a full name, ex. Michael Stevens")
                        return
                    }
                    if(info.password == ""){
                        socket.emit("login_err", "Please enter a password")
                        return
                    }
                    var user = await this.create_user(info.username, info.password, info.name)
                    if(user){
                        var token = await this.generate_token(user.username)
                        socket.emit("token", token)
                    } else {
                        socket.emit("login_err", "Something went wrong when creating your account. Please notify administrators.")
                    }

                }
            })

            socket.on("get_documentation", () => {
                socket.emit("documentation", this.documentation)
            })

            socket.on("username_taken", async username => {
                var user = await this.get_user_from_username(username)
                if(user) socket.emit("username_taken", true)
                else socket.emit("username_taken", false)
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
            this.log("Restarting because of webhook")
            require("child_process").exec("git pull origin " + this.config.branch)
        })


        this.routes()
        this.on_loaded()
        this.SlackAPI = new this.SlackAPI(this.app, this)
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

        this.unsorted_documentation.sort((a, b) => {
            return a.type == "variable"
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
        var is_joined = await this.db.query_one("SELECT * FROM joints WHERE project = ? && user = ?", [project_id, user_id])
        if(is_joined) return true
        var project = await this.get_project_from_id(project_id)
        if(project.owner == user_id) return true
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
        // Check if user is already in project
        var is_joined = await this.is_joined_in_project(user_to_add.id, project_id)
        if (is_joined){
            this.log("User is already a part of project")
            return false
        }
        //Add the user to joints
        await this.db.query("INSERT INTO joints (project, user, date) VALUES (?, ?, ?)", [project_id, user_to_add.id, Date.now()])
        return true
    }

    async delete_project(project_name, user_id){
        var user = await this.get_user(user_id)
        var project = await this.db.query_one("SELECT * FROM projects WHERE name = ?", project_name)
        if(project.owner === user_id){
            await this.db.query("DELETE FROM projects WHERE id = ?", project.id)
            this.log("Project deleted by: " + user.username)        
            return true
        }else{
            this.log("Permission denied on delete project, " + user.username)
            return false
        }
    }

    async get_user_from_token(token){
        var db_token = await this.db.query_one("SELECT * FROM tokens WHERE token = ?", token)
        if(db_token){
            var user = await this.get_user(db_token.user)
            if(user){
                return user
            }
        } else {
            return false
        }
    }


    /**
     * Get user from slack request, if they are not registered an account will be created.
     * @param {*} req Slack request
     */
    async get_user_from_slack(req) {
        var success = this.verify_slack_request(req)
        if (success) {
            var body = req.body
            var slack_id = body.user_id
            var user = await this.get_user_from_slack_id(slack_id)
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
        var username_taken = await this.get_user_from_username(username)
        if(username_taken){
            this.log("Username taken")
            return false
        }
        // Insert into the database
        await this.db.query("INSERT INTO users (username, name, password) VALUES (?, ?, ?)", [username, full_name, this.md5(password)])
        var user = this.get_user_from_username(username)
        if (user) {
            this.log("Account created for " + full_name)
            return user
        }
    }

    async get_user_from_username_and_password(username, password){
        var user = await this.get_user_from_username(username)
        if(user){
            if(user.password === this.md5(password)) 
                return user
        }
        return false
    }

    async generate_token(username){
        var user = await this.get_user_from_username(username)
        if(user){
            var token = this.hash()
            await this.db.query("INSERT INTO tokens (token, user) VALUES (?, ?)", [token, user.id])
            return token
        }
        return false
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
        this.app.get("/dashboard", (req, res) => {
            res.render("dashboard")
        })

        this.app.get("/login", (req, res) => {
            res.render("login")
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
            var request_body = this.qs.stringify(req.body, {
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
            this.log("ERROR: Make sure your config.json:signing_secret is correct!")
        }
    }
}

module.exports = Server