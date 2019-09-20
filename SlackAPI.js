class SlackAPI {
    constructor(app, server) {
        var SlackJSON = require("./SlackJSON")
        SlackJSON = new SlackJSON()

        app.get("/auth", async (req, res) => {
            if (req.query.code) {
                /* Send a request to slack to get user information from the login */
                console.log(`https://slack.com/api/oauth.access?client_id=${server.config.client_id}&client_secret=${server.config.client_secret}&code=${req.query.code}`)
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
                                console.log("Valid user, ", data.user)
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

                } else {
                    res.json(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com")]))
                }
            }
        })
    }
}

module.exports = SlackAPI