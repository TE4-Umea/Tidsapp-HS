class SlackAPI{
    constructor(app, server){
        var SlackJSON = require("./SlackJSON")
            SlackJSON = new SlackJSON()

        app.post("/api/slack/checkin", async (req, res) => {
            var success = server.verify_slack_request(req)
            if (success) {
                var user = await server.get_user_from_slack(req)
                if (user) {

                } else {
                    console.log("SENT")
                    console.log(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com")]))
                    res.json(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com")]))
                    
                }
            }
        })
    }
}

module.exports = SlackAPI