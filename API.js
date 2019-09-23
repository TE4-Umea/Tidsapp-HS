class API {

    constructor(server) {
        this.server = server
    }

    async checkin(req, res) {
        var token = req.body.token
        var check_in = req.body.check_in
        var project = req.body.project ? req.body.project : null
        var user = await this.server.get_user_from_token(token)
        if(user){
            var result = await this.server.check_in(user.id, check_in, project, "api")
            if (result.success) {
                if (project === null) {
                    res.json({
                        success: true,
                        checked_in: result.checked_in,
                        text: "Checked in: " + user.name
                    })
                } else if (project != null) {
                    res.json({
                        success: true,
                        checked_in: result.checked_in,
                        text: "Checked in " + user.name + " on Project: " + project
                    })
                }
            } else {
                res.json({
                    success: false,
                    text: result.text
                })
            }
        } else {
            res.json({success: false, text: "Please register an account and link it before using slash commands https://hs.ygstr.com"})
        }
    }

    async add(req, res) {
        res.end("This API call is not implemented yet.")
    }

    async remove(req, res) {
        var user_to_remove = req.body.username ? req.body.username : null
        var token = req.body.token
        var project_name = req.body.project

        if(user_to_remove !== null && project_name !== null && token !== null){
            var result = await this.server.remove_user_from_project(user_to_remove, project_name, token)

        }else if(user_to_remove === null){
            res.json({
                success: false, 
                text: "You need to instert a user to remove"
            })
        }else if(project === null){
            res.json({
                success: false, 
                text: "You need to insert project to remove user from"
            })
        }else if(token === null){
            res.json({
                success: false, 
                text: "Token was not found"
            })
        }else{
            res.json({
                success: false, 
                text: "Removal failed"
            })
        }
    }

    

    /**
     * POST /api/project
     * Get information of a project and all the members
     * @param {*} req 
     * @param {*} res 
     */
    async project(req, res) {
        var project_name = req.body.project
        var token = req.body.token
        var user = await this.server.get_user_from_token(token)
        var project = await this.server.get_project(project_name)
        var project_data = await this.server.get_project_data(project.id)

        if (user) {
            if (project) {
                var has_access = await this.server.is_joined_in_project(user.id, project.id)
                if (project_data) {
                    if (has_access) {
                        res.json({
                            success: true,
                            project: project_data
                        })
                    } else {
                        res.json({
                            success: false,
                            text: "You don't have access to this project"
                        })
                    }
                } else {
                    res.json({
                        success: false,
                        text: "Project data corrupt"
                    })
                }
            } else {
                res.json({
                    success: false,
                    text: "Project not found"
                })
            }
        } else {
            res.json({
                success: false,
                text: "Invalid token"
            })
        }
    }

    /**
     * POST api/profile
     * Get client profile from token
     * @param {*} req 
     * @param {*} res 
     */
    async profile(req, res) {
        var token = req.body.token
        var user = await this.server.get_user_from_token(token)
        if (user) {
            var data = await this.server.get_user_data(user.id)
            res.json({
                success: true,
                profile: data
            })
        } else {
            res.json({
                success: false,
                text: "Invalid token"
            })
        }
    }

    /**
     * POST api/login
     * Get client token from username and password
     * @param {*} req 
     * @param {*} res 
     */
    async login(req, res) {
        var username = req.body.username
        var password = req.body.password

        var user = await this.server.get_user_from_username(username)

        // Sign in
        user = await this.server.get_user_from_username_and_password(username, password)
        if (user) {
            var token = await this.server.generate_token(user.username)
            if (token) {
                res.json({
                    success: true,
                    token: token
                })
            }
        } else {
            res.json({
                success: false,
                text: "Wrong username or password"
            })
        }
    }

    async signup(req, res) {
        var username = req.body.username
        var password = req.body.password
        var name = req.body.name

        // Sign up
        if (username.replace(/[^a-z0-9_]+|\s+/gmi, "") !== username) {
            res.json({
                success: false,
                text: "Username contains illigal characters"
            })
            return
        }
        if (username.length < 3) {
            res.json({
                success: false,
                text: "Username has to be at least three characters long"
            })
            return
        }
        if (username.length > 20) {
            res.json({
                success: false,
                text: "Username cannot exceed 20 characters"
            })
            return
        }
        if (name.indexOf(" ") == -1) {
            res.json({
                success: false,
                text: "Please provide a full name, ex. Michael Stevens"
            })
            return
        }
        if (password == "") {
            res.json({
                success: false,
                text: "Please enter a password"
            })
            return
        }
        var user = await this.server.create_user(username, password, name)
        if (user) {
            var token = await this.server.generate_token(user.username)
            res.json({
                success: true,
                token: token
            })
        } else {
            res.json({
                success: false,
                text: "Something went wrong when creating your account. Please notify administrators."
            })
        }
    }

    /**
     * POST /api/user
     * Check if a username is taken
     * @param {*} req
     * @param {*} res
     */
    async username_taken(req, res) {
        var username = req.body.username
        if (!username) {
            res.json({
                success: false,
                text: "Missing username attribute"
            })
            return
        }
        var user = await this.server.get_user_from_username(username)
        if (user) {
            res.json({
                success: true,
                taken: true
            })
        } else {
            res.json({
                success: true,
                taken: false
            })
        }
    }

    /**
     * Sign a client to thier slack account (link)
     * @param {*} req 
     * @param {*} res 
     */
    async sign(req, res) {
        var token = req.body.token
        var sign_token = req.body.sign_token

        for (var sign of this.server.slack_sign_users) {
            if (sign.token === sign_token) {
                var user = await this.server.get_user_from_token(token)
                if (user) {
                    // Fill users slack information
                    await this.server.db.query("UPDATE users SET email = ?, slack_id = ?, slack_domain = ?, access_token = ?, avatar = ?, name = ? WHERE id = ?", [sign.email, sign.slack_id, sign.slack_domain, sign.access_token, sign.avatar, sign.name, user.id])
                    res.json({
                        success: true,
                        redir: "/dashboard"
                    })
                }
            }
        }
    }

    async documentation(req, res){
        res.json(this.server.documentation)
    }
}

module.exports = API