class API {

    constructor(server) {
        this.server = server
    }

    async checkin(req, res){
        var token = req.body.token
        var check_in = req.body.check_in
        var project = req.body.project ? req.body.project : null
        console.log(project)
        var user = await this.server.get_user_from_token(token)
        console.log(user)
        if(user){
            var result = await this.server.check_in(user.id, check_in, project, "api")
            if(result.success){
                if(project === null){
                    res.json({success: true, text: "Checked in: " + user.name})
                }else if(project != null){
                    res.json({success: true, text: "Checked in " + user.name + " on Project: " + project})
                }
            }else{
                res.json({success: false, text: result.reason})
            }
        }else{
            res.end("Please register an account and link it before using slash commands https://hs.ygstr.com")
        }
    }

    async add(req, res) {
        res.end("This API call is not implemented yet.")
    }

    async remove(req, res) {
        res.end("This API call is not implemented yet.")
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
                reason: "Invalid token"
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
}

module.exports = API