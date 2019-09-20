class API{

    constructor(server){
        this.server = server
    }

    async checkin(req, res){
        var success = true
        var project = undefined
        var user = await server.get_user_from_token()
        if(success){
            if(project){
                res.end("Checked in, Project: " + this.project.name)
            }else{
                res.end("Checked in")
            }
        }else{
            res.end("Check in failed")
        }
    }

    async checkout(req, res){
        res.end("This API call is not implemented yet.")
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

    async check(req, res){
        res.end("This API call is not implemented yet.")
    }

    async login(req, res){
        res.end("This API call is not implemented yet.")
    }
}

module.exports = API