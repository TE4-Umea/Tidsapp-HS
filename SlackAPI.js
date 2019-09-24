const SUCCESS = "#2df763"
const FAIL = "#f72d4b"
const WARN = "#f7c52d"

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
                                res.render("dashboard", {
                                    token: sign_token
                                })
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
                    var response = await server.check_in(user.id, true, project, "slack")

                    res.json(SlackJSON.SlackResponse(response.text, [SlackJSON.SlackAttachments(response.project ? "Project: " + response.project : (response.success ? "Attendance" : "Checkout /hshelp for more info"), response.success ? SUCCESS : FAIL)]))
                } else {
                    this.user_not_found(res)
                }
            }
        })

        app.post("/api/slack/checkout", async (req, res) => {
            var success = server.verify_slack_request(req)
            if (success) {
                var user = await server.get_user_from_slack(req)
                if (user) {
                    var response = await server.check_in(user.id, false, null, "slack")
                    res.json(SlackJSON.SlackResponse(response.text, [(response.success ? "Success!" : "Checkout /hshelp for more info"), response.success ? SUCCESS : FAIL]))
                } else {
                    this.user_not_found(res)
                }
            }
        })

    }
    user_not_found(res) {
        res.json(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com/login", WARN)]))
    }

}
module.exports = SlackAPI