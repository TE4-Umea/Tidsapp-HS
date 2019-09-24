        /*
        TEMPLATE
        app.post("/api/slack/PATH", async (req, res) => {
            var success = server.verify_slack_request(req)
            if (success) {
                var user = await server.get_user_from_slack(req)
                if (user) {
                    
                } else {
                    this.user_not_found(res)
                }
            }
        })
        
         */


        class SlackAPI {
            constructor(app, server) {
                var SlackJSON = require("./SlackJSON")
                SlackJSON = new SlackJSON()

                const SUCCESS = "#2df763"
                const FAIL = "#f72d4b"
                const WARN = "#f7c52d"

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
                            res.json(this.slack_response(response))
                        } else {
                            this.user_not_found(res)
                        }
                    }
                })

                app.post("/api/slack/remove", async (req, res) => {
                    var success = server.verify_slack_request(req)
                    if (success) {
                        var user = await server.get_user_from_slack(req)
                        if (user) {
                            var inputs = req.body.text.split(" ")
                            var user_to_remove = inputs[0]
                            user_to_remove = await server.get_user_from_username(user_to_remove)
                            var project_name = inputs[1]
                            var project = await server.get_project(project_name)
                            var response = await server.remove_user_from_project(user_to_remove, project.id, user)
                            res.json(this.slack_response(response))
                        } else {
                            this.user_not_found(res)
                        }
                    }
                })


                app.post("/api/slack/add", async (req, res) => {
                    var success = server.verify_slack_request(req)
                    if (success) {
                        var user = await server.get_user_from_slack(req)
                        if (user) {
                            var inputs = req.body.text.split(" ")
                            var user_to_add = inputs[0]
                            user_to_add = await server.get_user_from_username(user_to_add)
                            var project_name = inputs[1]
                            var project = await server.get_project(project_name)

                            var response = await server.add_user_to_project(user_to_add, project ? project.id : -1, user)
                            res.json(this.slack_response(response))

                        } else {
                            this.user_not_found(res)
                        }
                    }
                })


                app.post("/api/slack/new", async (req, res) => {
                    var success = server.verify_slack_request(req)
                    if (success) {
                        var user = await server.get_user_from_slack(req)
                        if (user) {
                            var project_name = req.body.text
                            var response = await server.create_project(project_name, user)
                            res.json(this.slack_response(response))
                        } else {
                            this.user_not_found(res)
                        }
                    }
                })

                app.post("/api/slack/help", async (req, res) => {
                    var response = SlackJSON.SlackResponse("Happy Surfers Time App Help Menu", [SlackJSON.SlackAttachments(server.fs.readFileSync("commands.md", "utf8"))])
                    res.json(response)
                })
            }

            slack_response(response) {
                return SlackJSON.SlackResponse(response.success ? "Success!" : "Something went wrong...", [SlackJSON.SlackAttachments(response.text, response.success ? SUCCESS : FAIL)])
            }

            user_not_found(res) {
                res.json(SlackJSON.SlackResponse("Please register an account and link it before using slash commands", [SlackJSON.SlackAttachments("https://hs.ygstr.com/login")]))
            }
        }

        module.exports = SlackAPI