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

    async project(req, res) {
        res.end("This API call is not implemented yet.")
    }

    async profile(req, res){
        var token = req.body.token
        var user = await this.server.get_user_from_token(token)
        if(user){
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
}

module.exports = API