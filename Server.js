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
        this.API = new this.API(this)

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
            for (var key in this.config_templete) {
                if (this.config[key] === undefined) {
                    this.config[key] = this.config_templete[key]
                    updated = true
                    this.log("Updated config.json with the missing option " + key)
                }
                if (updated) this.fs.writeFileSync("config.json", JSON.stringify(this.config))
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

        this.app.post("/api/add", async (req, res) => {
            this.API.add(req, res)
        })

        this.app.post("/api/new", async (req, res) => {
            this.API.new_project(req, res)
        })

        this.app.post("/api/remove", async (req, res) => {
            this.API.remove(req, res)
        })

        this.app.post("/api/project", async (req, res) => {
            this.API.project(req, res)
        })

        this.app.post("/api/login", async (req, res) => {
            this.API.login(req, res)
        })

        this.app.post("/api/signup", async (req, res) => {
            this.API.signup(req, res)
        })

        this.app.post("/api/profile", async (req, res) => {
            this.API.profile(req, res)
        })

        this.app.post("/api/user", async (req, res) => {
            this.API.username_taken(req, res)
        })

        this.app.post("/api/sign", async (req, res) => {
            this.API.sign(req, res)
        })

        this.app.get("/api/documentation", async (req, res) => {
            this.API.documentation(req, res)
        })

        this.app.post("/api/document", async (req, res) => {
            this.API.document(req, res)
        })



        /* SOCKET IO */
        /* this.io.on("connection", socket => { */

        /* socket.on("disconnect", () => {
            // Remove this connection from online users
            this.online_users.splice(this.online_users.indexOf(socket.id), 1)
        }) */

        /* socket.on("sign_slack", async info => { */
        /* for (var sign of this.slack_sign_users) {
            if (sign.token === info.sign_token) {
                var user = await this.get_user_from_token(info.token)
                if (user) {
                    // Fill users slack information
                    await this.db.query("UPDATE users SET email = ?, slack_id = ?, slack_domain = ?, access_token = ?, avatar = ?, name = ? WHERE id = ?", [sign.email, sign.slack_id, sign.slack_domain, sign.access_token, sign.avatar, sign.name, user.id])
                    socket.emit("redir", "dashboard")
                }
            }
        } */
        /*  }) */

        /* socket.on("login_with_token", async token => {
            var user = await this.get_user_from_token(token)
            if (user) {
                this.online_users[socket.id] = user.id
                var user_data = await this.get_user_data(user.id)
                socket.emit("login", user_data)
            } else {
                socket.emit("invalid_token")
            }
        }) */

        /* socket.on("login", async info => {

            var user = await this.get_user_from_username(info.username)
            if (user) {
                // Sign in
                user = await this.get_user_from_username_and_password(info.username, info.password)
                if (user) {
                    var token = await this.generate_token(user.username)
                    if (token) {
                        socket.emit("token", token)
                    }
                } else {
                    socket.emit("login_err", "Wrong password")
                    return
                }
            } else {
                // Sign up
                if (info.username.replace(/[^a-z0-9_]+|\s+/gmi, "") !== info.username) {
                    socket.emit("login_err", "Username contains illigal characters")
                    return
                }
                if (info.username.length < 3) {
                    socket.emit("login_err", "Username has to be at least three characters long")
                    return
                }
                if (info.username.length > 20) {
                    socket.emit("login_err", "Username cannot exceed 20 characters")
                    return
                }
                if (info.name.indexOf(" ") == -1) {
                    socket.emit("login_err", "Please provide a full name, ex. Michael Stevens")
                    return
                }
                if (info.password == "") {
                    socket.emit("login_err", "Please enter a password")
                    return
                }
                var user = await this.create_user(info.username, info.password, info.name)
                if (user) {
                    var token = await this.generate_token(user.username)
                    socket.emit("token", token)
                } else {
                    socket.emit("login_err", "Something went wrong when creating your account. Please notify administrators.")
                }

            }
        }) */

        /* socket.on("get_documentation", () => {
            socket.emit("documentation", this.documentation)
        }) */

        /* socket.on("username_taken", async username => {
            var user = await this.get_user_from_username(username)
            if (user) socket.emit("username_taken", true)
            else socket.emit("username_taken", false)
        }) */

        /* socket.on("upload_documentation", pack => {
            if (pack.token === this.config.admin_token) {
                delete pack.token
                if (pack.title.length == 0) {
                    socket.emit("err", "Don't forget the title")
                    return
                }
                try {
                    this.fs.writeFileSync("documentation/" + pack.title.split(" ").join("_") + ".json", JSON.stringify(pack))
                    socket.emit("err", "Success!")
                    this.load_documentation()
                } catch (e) {
                    this.log(e)
                    console.log(e)
                    socket.emit("err", "Error writing fail, check the title. Make sure there are no weird characters in it.")
                }
            } else {
                socket.emit("err", "Wrong token")
            }
        }) */
        /*      }) */

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

        for (page of this.unsorted_documentation) {
            if (page.type == "text") {
                this.documentation.push(page)
            }
        }

        for (page of this.unsorted_documentation) {
            if (page.type == "class") {
                this.documentation.push(page)
                for (var p of this.unsorted_documentation) {
                    if (p.class == page.title) {
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
    async check_in(user_id, check_in = null, project_name = null, type = "unknown") {
        var user = await this.get_user(user_id)
        if (user) {
            var last_check = await this.get_last_check(user.id)

            if (project_name != null && project_name != "" && project_name != undefined) {
                var project = await this.get_project(project_name)
                if (project) {
                    var owns_project = await this.is_joined_in_project(user.id, project.id)
                    if (!owns_project) {
                        return {
                            success: false,
                            text: "User is not apart of this project."
                        }
                    }
                    project_name = project.name
                } else {
                    return {
                        success: false,
                        text: "Project not found."
                    }
                }
            } else {
                project = ""
            }

            if (check_in === true) {
                if (last_check.check_in && last_check.project === project_name) {
                    return {
                        success: true,
                        text: "You are already checked in." + (project_name ? " Project: " + project_name : "")
                    }
                }
                await this.insert_check(user.id, true, project_name, type)
                return {
                    success: true,
                    checked_in: true,
                    text: "You are now checked in." + (project_name ? " Project: " + project_name : "")
                }
            }

            if (check_in === false) {
                if (!last_check.check_in) {
                    return {
                        success: true,
                        text: "You are already checked out."
                    }
                }
                await this.insert_check(user.id, false, project_name, type)
                return {
                    success: true,
                    checked_in: false,
                    text: "You are now checked out.",
                    project: project_name
                }
            }

            if (check_in === null) {
                // Toggle checkin
                await this.insert_check(user.id, !last_check.check_in, project_name, type)
                return {
                    success: true,
                    checked_in: !last_check.check_in,
                    text: "You are now checked " + (!last_check.check_in ? "in." : "out.") + (project_name ? " Project: " + project_name : ""),
                    project: project_name
                }
            }

        } else {
            return {
                success: false,
                text: "User not found."
            }
        }
    }

    async login_user_with_token(token) {
        var user = await this.get_user_from_token(token)
        if (user) {
            var data = await this.get_user_data(user.id)
            return data
        }
        return false
    }

    async get_user_data(user_id) {
        var user = await this.get_user(user_id)
        if (user) {
            delete user.access_token
            delete user.password
            user.checked_in = await this.is_checked_in(user.id)
            var last_check = await this.get_last_check(user.id)
            user.checked_in_project = last_check.project

            user.projects = []
            var joints = await this.db.query("SELECT * FROM joints WHERE user = ?", user.id)

            for (var joint of joints) {
                // User is not owner of the project, download project form database
                let project = await this.get_project_from_id(joint.project)
                project.work = joint.work
                project.activity = [5, 3, 7, 9, 3]
                user.projects.push(project)
            }
            return user
        }
    }

    format_time(ms) {
        var hours = Math.floor(ms / 1000 / 60 / 60)
        var minutes = Math.floor((ms / 1000 / 60) - (hours * 60))
        return (hours ? hours + "h " : "") +  minutes + "m"
    }

    async is_joined_in_project(user_id, project_id) {
        if (user_id && project_id) {
            var is_joined = await this.db.query_one("SELECT * FROM joints WHERE project = ? && user = ?", [project_id, user_id])
            var project = await this.get_project_from_id(project_id)
            if (project) {
                if (project.owner == user_id || is_joined) return true
            }
        }
        return false
    }

    /**
     * 
     * @param {*} user_id 
     * @param {*} check_in 
     * @param {*} project 
     * @param {*} type 
     */
    async insert_check(user_id, check_in, project = null, type) {
        var user = await this.get_user(user_id)
        var last_check = await this.get_last_check(user_id)
        if (user) {
            var time_of_checkout = Date.now() - last_check.date
            if (!check_in && last_check.project != "") {
                var project = await this.get_project(last_check.project)
                if (project) {
                    var joint = await this.db.query_one("SELECT * FROM joints WHERE user = ? AND project = ?", [user.id, project.id])
                    if (joint) {
                        await this.db.query("UPDATE joints SET work = ? WHERE id = ?", [time_of_checkout, joint.id])
                        console.log("Updated time")
                    }
                }
            }
            if (!check_in) project = ""
            if (!project) project = ""
            await this.db.query("INSERT INTO checks (user, check_in, project, date, type) VALUES (?, ?, ?, ?, ?)", [user_id, check_in, project, Date.now(), type])
            this.log(user.name + " checked " + (check_in ? "in" : "out") + " via " + type)
            return check_in
        }
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
        if (project_name) {
            var project = await this.db.query_one("SELECT * FROM projects WHERE upper(name) = ?", project_name.toUpperCase())
            return project
        }
        return false
    }

    async get_project_list() {
        var projects = await this.db.query("SELECT name FROM projects")
        var project_list = "Project name, owner \n"
        var list_string = JSON.stringify(projects)
        var list = list_string.split(",")
        var list_lenght = list.length
        var to_add = ""
        var current_project = null
        var project_owner = ""
        for (var i = 0; i < list_lenght; i++) {
            to_add = list[i]
            to_add = to_add.split(":")[1]
            if(i == list.length-1) {
                to_add = to_add.slice(to_add.indexOf('"')+1, -3)
            } else {
                to_add = to_add.slice(to_add.indexOf('"')+1, -2)
            }
            current_project = await this.get_project(to_add)
            project_owner = await this.get_user(current_project.owner)
            project_list += to_add + ", " + project_owner.name +  "\n"
        }
        this.log("Getting projects list " + project_list)
        return {
            success: true,
            text: "Returning project list\n" + project_list
        }
    }

    async get_project_data(project_id, user = false) {
        var project = await this.get_project_from_id(project_id)
        if (project) {
            var owner = await this.get_user(project.owner)
            project.owner = {
                id: owner.id,
                username: owner.username,
                name: owner.name
            }

            project.members = []
            var joints = await this.db.query("SELECT * FROM joints WHERE project = ?", project_id)
            
            for (var joint of joints) {
                var user = await this.get_user(joint.user)
                
                project.members.push({
                    username: user.username,
                    name: user.name,
                    work: joint.work,
                    owner: user.id == project.owner
                })
            }
            var members = project.members

            return {
                success: true,
                text: "Project return",
                project: project
            }
        }
        return {
            success: false,
            text: "Project not found"
        }
    }

    async get_project_from_id(project_id) {
        if (project_id) {
            var project = await this.db.query_one("SELECT * FROM projects WHERE id = ?", project_id)
            return project
        }
        return false
    }

    async create_project(project_name, user) {
        if (!project_name || !user) return {
            success: false,
            text: "Missing project_name or user"
        }

        var existing_project = await this.get_project(project_name)
        if (existing_project) return {
            success: false,
            text: "Project name taken"
        }

        if (project_name.length > 30 || project_name < 3) {
            return {
                success: false,
                text: "Project name has to be between 3 > 30"
            }
        }

        if (project_name.replace(/[^a-z0-9_]+|\s+/gmi, "") !== project_name) {
            return {
                success: false,
                text: "Project name forbidden"
            }
        }

        var user_joints = await this.db.query("SELECT * FROM joints WHERE user = ?", user.id)
        var gradients = JSON.parse(this.fs.readFileSync("gradients.json", "utf8"))
        for(var joint of user_joints){
            var project = await this.get_project_from_id(joint.project)
            for(var i = 0; i < gradients.length; i++){
                if(gradients[i][0] == project.color_top){
                    gradients.splice(i, 1)
                }
            }
        }

        if(gradients.length == 0) gradients = JSON.parse(this.fs.readFileSync("gradients.json", "utf8"))
        var gradiant = gradients[Math.floor(Math.random() * gradients.length)]

        await this.db.query("INSERT INTO projects (name, owner, color_top, color_bot) VALUES (?, ?, ?, ?)", [project_name, user.id, gradiant[0], gradiant[1]])
        var project = await this.get_project(project_name)
        await this.db.query("INSERT INTO joints (project, user, date, work) VALUES (?, ?, ?, ?)", [project.id, user.id, Date.now(), 0])

        return {
            success: true,
            text: "Created project " + project_name
        }
    }

    /**
     * 
     * @param {*} user_to_add 
     * @param {*} project_id 
     * @param {*} user 
     */
    async add_user_to_project(user_to_add, project_id, user) {
        if (!user_to_add) {
            return {
                success: false,
                text: "User not found"
            }
        }

        if (!user) {
            return {
                success: false,
                text: "Invalid token"
            }
        }

        if (!project_id) {
            return {
                success: false,
                text: "Project not found"
            }
        }

        var project = await this.get_project_from_id(project_id)
        if (project) {
            // Check if user is already in project
            var is_joined = await this.is_joined_in_project(user_to_add.id, project_id)
            if (is_joined) {
                return {
                    success: false,
                    text: "User is already apart of project"
                }
            }

            if (user) {
                var has_authority = await this.is_joined_in_project(user.id, project_id)
                if (!has_authority) {
                    return {
                        success: false,
                        text: "You dont have the authority to do this action"
                    }
                }
            }
            //Add the user to joints
            await this.db.query("INSERT INTO joints (project, user, date, work) VALUES (?, ?, ?, ?)", [project_id, user_to_add.id, Date.now(), 0])
            return {
                success: true,
                text: "Added " + user_to_add.name + " to " + project.name + "!"
            }
        }
        return {
            success: false,
            text: "Project doesnt exist"
        }
    }

    async get_slack_id_from_text(user) {
        var slack_id = user.substring(2, 11)
        user = await this.get_user_from_slack_id(slack_id)
        return user

    }

    /**
     * Remove user from project
     * @param {User} user_to_remove User to remove from project (can't be owner, but won't crash)
     * @param {String} project_name Project name of the project
     * @param {User} user User that requests the action
     */
    async remove_user_from_project(user_to_remove, project_id, user) {
        if (!user_to_remove || !project_id || !user) {
            return {
                success: false,
                text: "Missing attirbutes"
            }
        }
        var project = await this.get_project_from_id(project_id)
        if (project) {
            if (project.owner == user_to_remove.id) {
                return {
                    success: false,
                    text: "User is the owner of the project (delete project to leave)"
                }
            }

            var is_joined = await this.is_joined_in_project(user_to_remove.id, project.id)
            var has_authority = await this.is_joined_in_project(user.id, project.id)

            if (is_joined) {
                if (has_authority) {
                    await this.db.query("DELETE FROM joints WHERE user = ? AND project = ?", [user_to_remove.id, project_id])
                    return {
                        success: true,
                        text: "User removed"
                    }
                } else {
                    return {
                        success: false,
                        text: "You are not allowed to modify this project"
                    }
                }
            } else {
                return {
                    success: false,
                    text: "User not found in project"
                }
            }
        } else {
            return {
                success: false,
                text: "Project not found"
            }
        }
    }

    async delete_project(project_name, user_id) {
        var user = await this.get_user(user_id)
        var project = await this.db.query_one("SELECT * FROM projects WHERE name = ?", project_name)
        if ((project.owner === user_id) || user.admin) {
            await this.db.query("DELETE FROM projects WHERE id = ?", project.id)
            await this.db.query("DELETE FROM joints WHERE project = ?", project.id)
            this.log("Project " + project_name + " deleted by: " + user.username)
            return {
                success: true,
                text: "Project deleted by: " + user.username
            }
        } else {
            var owner = await this.get_user(project.owner)
            return {
                success: false,
                text: "Permission denied, project is owned by " + owner.name
            }
        }
    }

    async get_user_from_token(token) {
        if (token) {
            var db_token = await this.db.query_one("SELECT * FROM tokens WHERE token = ?", token)
            if (db_token) {
                var user = await this.get_user(db_token.user)
                if (user) {
                    return user
                }
            }
        }
        return false
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
        if (username_taken) {
            return {
                success: false,
                text: "Username taken"
            }
        }
        // Insert into the database
        await this.db.query("INSERT INTO users (username, name, password, created) VALUES (?, ?, ?, ?)", [username, full_name, this.md5(password), Date.now()])
        var user = await this.get_user_from_username(username)
        if (user) {
            this.log("Account created for " + full_name)
            return {
                success: true,
                user: user
            }
        }
    }

    async get_user_from_username_and_password(username, password) {
        var user = await this.get_user_from_username(username)
        if (user) {
            if (user.password === this.md5(password))
                return user
        }
        return false
    }

    async generate_token(username) {
        var user = await this.get_user_from_username(username)
        if (user) {
            var token = this.hash()
            await this.db.query("INSERT INTO tokens (token, user) VALUES (?, ?)", [token, user.id])
            return token
        }
        return false
    }

    async delete_user(username) {
        var user = await this.get_user_from_username(username)
        if (user) {
            /* Delete user from the database */
            await this.db.query("DELETE FROM users WHERE id = ?", user.id)
            /* Delete all tokens belonging to the user */
            await this.db.query("DELETE FROM tokens WHERE user = ?", user.id)
            return true
        }
        return false
    }

    /**
     * Get user via their slack user id
     * @param {*} slack_id
     */
    async get_user_from_slack_id(slack_id) {
        if (!slack_id) return false
        var user = await this.db.query_one("SELECT * FROM users WHERE slack_id = ?", slack_id)
        return user
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

    /**
     * Get user from username
     * @param {*} username 
     */
    async get_user_from_username(username) {
        if (username) {
            var user = await this.db.query_one("SELECT * FROM users WHERE upper(username) = ?", username.toUpperCase())
            return user
        }
        return false
    }


    routes() {
        /* Website pages */
        this.app.get("/dashboard", (req, res) => {
            res.render("dashboard", {
                client_id: this.config.client_id
            })
        })

        this.app.get("/login", (req, res) => {
            res.render("login")
        })

        this.app.get("/docs", (req, res) => {
            res.render("docs")
        })

        this.app.get("/edit", (req, res) => {
            res.render("edit")
        })

        this.app.get("/", (req, res) => {
            res.render("index")
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