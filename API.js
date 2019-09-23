class API{

    constructor(server){
        this.server = server
    }

    async checkin(req, res){
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

    async login(req, res){
        var username = req.body.username
        var password = req.body.password
    }
}

module.exports = API