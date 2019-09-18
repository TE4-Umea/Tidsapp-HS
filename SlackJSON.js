class SlackJSON {
    /**
     * Create a slack response embed, use red.json() to send this back via the bot
     * @param {*} text Text you want to submit, optional
     * @param {*} attachments Array of attachements, optional
     */
    SlackResponse(text = "", attachments = []) {
        this.text = text
        this.attachments = attachments
    }


    SlackAttachement(text = "", color = "#0a6cff") {
        this.text = text
        this.color = color
        this.tilte = ""
        this.title_link = ""
    }
}

module.exports = SlackJSON