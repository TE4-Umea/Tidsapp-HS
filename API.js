class API{

    constructor(server){
        this.server = server
    }

    async checkin(req, res){
        var project = undefined
        var token = req.body.token
        console.log(token)
        var check_in = req.body.check_in
        console.log(check_in)
        var project = req.body.project ? req.body.project : null
        console.log(project)
        var user = await this.server.get_user_from_token(token)
        console.log(user)
        if(user){
            console.log(user.id, check_in, project, "api")
            var result = await this.server.check_in(user.id, check_in, project, "api")
            console.log(result)
            if(result.success){
                if(project != null){
                    res.json({success: true, text: "Checked in " + user.name + " on Project: " + project})
                }else if(project === null){
                    res.json({success: true, text: "Checked in: " + user.name})
                }
            }else{
                res.json({success: false, text: "Check in failed"})
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