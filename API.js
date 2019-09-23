class API{

    constructor(server){
        this.server = server
    }

    async checkin(req, res){
        var project = undefined
        var token = req.body.token
        var check_in = req.body.check_in
        var project = req.body.project
        var user = await this.server.get_user_from_token(token)
        if(user){
            if(project){
                var success = this.server.check_in(user.id, check_in, project, "api")
                if(success){
                    res.end("Checked in, Project: " + project)
                }else{
                    res.end("Check in failed")
                }
            }else{
                var success = this.server.check_in(user.id, check_in, null, "api")
                if(success){
                    res.end("Checked in: " + user.name)
                }else{
                    res.end("Check in failed")
                }
            }
        }else{
                res.end("Please register an account and link it before using slash commands https://hs.ygstr.com")

            //res.end("Check in failed")
        }
    }

    async add(req, res){
        res.end("This API call is not implemented yet.")
    }

    async remove(req, res){
        res.end("This API call is not implemented yet.")
    }

    async project(req, res){
        res.end("This API call is not implemented yet.")
    }

    async login(req, res){
        var username = req.body.username
        var password = req.body.password
    }
}

module.exports = API