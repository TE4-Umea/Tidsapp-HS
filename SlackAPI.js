class SlackAPI {
    constructor(app, server) {
        var SlackJSON = require("./SlackJSON")
        SlackJSON = new SlackJSON()

        app.get("/auth", async (req, res) => {
            if (req.query.code) {
                /* Send a request to slack to get user information from the login */
                server.https.get(`https://slack.com/api/oauth.access?client_id=${server.config.client_id}&client_secret=${server.config.client_secret}&code=${req.query.code}`, resp => {
                    var data = ''
                    resp.on('data', (chunk) => {
                        data += chunk
                    })
                    resp.on('end', () => {
                        /* Once the data has been downloaded, parse it into a JSON */
                        data = JSON.parse(data)
                        /* If the request and code was successfull */
                        if (data.ok) {
                            (async () => {
                                /* Check if the user is already signed up */
                                var sign_token = server.hash()
                                server.slack_sign_users.push({
                                    access_token: data.access_token,
                                    slack_domain: data.team.domain,
                                    slack_id: data.user.id,
                                    name: data.user.name,
                                    avatar: data.user.image_512,
                                    email: data.user.email,
                                    token: sign_token
                                })
                                res.render("dashboard", {token: sign_token})
                            })()

                        } else {
                            res.end(data.error)
                        }
                    })
                })
            } else {
                res.end("Error..?")
            }
        })

        app.post("/api/slack/checkin", async (req, res) => {
            var success = server.verify_slack_request(req)
            if (success) {
                var user = await server.get_user_from_slack(req)
                if (user) {
                    var project = req.body.text ? req.body.text : ""
                    var success = await server.check_in(user.id, true, project, "slack")
              
                    if(success){
                        res.json(SlackJSON.SlackResponse("You are now checked in!", [SlackJSON.SlackAttachments("Project: " + (project ? project : " none"))]))
                    } else {
                        res.json(SlackJSON.SlackResponse("Invalid project, please create one (something went wrong)", [SlackJSON.SlackAttachments("`/new`")]))
                    }
                } else {
                    this.user_not_found(red)
                }
            }
        })

        app.post("/api/slack/checkout", async (req, res) => {
            var success = server.verify_slack_request(req)
            if (success) {
                var user = await server.get_user_from_slack(req)
                if (user) {
                    var success = await server.check_in(user.id, false, null, "slack")
                    if(success){
                        res.json(SlackJSON.SlackResponse("You are now checked out!", [SlackJSON.SlackAttachments("2h 3m")]))
                    } else {
                        res.json(SlackJSON.SlackResponse("Ops, something went wrong!"))
                    }
                } else {
                    this.user_not_found(red)
                }
            }
        })


        app.post("/api/slack/help", async (req, res) => {
            var response = this.server.SlackJSON.SlackResponse(this.server.fs.readFileSync("commands.md", "utf8"))
            response.mrkdwn = true
            res.json(response)
        })


    }
 
    user_not_found(res){
        res.json(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com/login")]))
    }
}

module.exports = SlackAPI