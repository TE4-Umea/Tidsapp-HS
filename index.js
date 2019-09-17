/**
 * Server side by Happy Surfers
 * Remember to comment your code!
 * Here we use underscore convention (variable_name, function_name())
 */

const bp = require("body-parser")
const express = require("express")
const http = require("http")
const https = require("https")
const fs = require("file-system")
const mysql = require("mysql")
const crypto = require("crypto")

var API = require("./API")
API = new API()

const Tests = require("./Tests")
const tests = new Tests()

/**
 * Log message with timestamp
 * Use this when a log should stay in the code
 * @param {*} message 
 */
function log(message){
    var date = new Date()
    console.log(`[${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}] ${message}`)
}

function on_loaded(){
    var args = process.argv.slice(2)
    if(args.includes("--test") || args.includes("-t")){
        tests.run()
    }

    log(`Happy Surfer's TimeTracker has started on port: ${port}`)
}

const hash = () => {
    return crypto.randomBytes(20).toString('hex').toUpperCase()
}

// Global variable for the config, used everytime you want to grab a user-inputed variable
var config

try {
    config = JSON.parse(fs.readFileSync("config.json"))
} catch (e) {
    console.log("Loading config.json failed, creating a default one.")
    config = {
        // Port of the webserver and REST API
        port: 80,
        // Token for the REST API
        token: hash(),
        // Slack app info
        client_id: "CLIENT ID",
        client_secret: "CLIENT SECRET",
        // mySQL connection information
        mysql_host: "localhost",
        mysql_user: "admin",
        mysql_pass: "password",
        // Database name
        database: "time",
        // Slack team name of the users who are allowed to sign in
        slack_team: "SLACK TEAM NAME"
    }
    fs.writeFileSync("config.json", JSON.stringify(config))
}

// Port of the website and REST API
const port = config.port

/* MySQL promise API */
class Database {

    /**
     * Create a new mysql connection
     * ! Make sure to destroy it after or it will cause a crash
     */
    create_connection() {
        return mysql.createConnection({
            host: config.mysql_host,
            user: config.mysql_user,
            password: config.mysql_pass,
            database: config.database
        })
    }

    /**
     * Normal SQL query but promise based
     * @param {*} sql query
     * @param {*} args possible arguments
     */
    query(sql, args) {
        // Connect to mysql
        var con = this.create_connection()

        return new Promise((resolve, reject) => {
            con.query(sql, args, (err, rows) => {
                con.destroy()
                if (err) return reject(err);
                resolve(rows);
            })
        })
    }
    /**
     * SELECT only one item
     * @param {*} sql query
     * @param {*} args possible arguments
     */
    query_one(sql, args) {
        return new Promise((resolve, reject) => {
            /* Connect to the database */
            var con = this.create_connection()

            con.query(sql, args, (err, rows) => {
                con.destroy()
                if (err) return reject(err);
                resolve(rows[0])
            })
        })
    }
}

/* Connect to the database */
var db = new Database()

// Setup the web server via express
var app = express()

// Use body-parser to read json/type in post / get requests
app.use(bp.json())
app.use(bp.urlencoded({
    extended: true
}))


// Create the server and start it on the port in config.json
var server = http.createServer(app).listen(port)


// Bind socket.io to the webserver, (socket.io, REST API and the website are all on the same port)
var io = require("socket.io")(server)

// Bind the cdn folder to the webserver, everything in it is accessable via the website
app.use(express.static(__dirname + '/cdn'))
// Enable PUG rendering in the express app
app.set('view engine', 'pug')

/* REST API */
app.post("/api/checkin", async (req, res) => {
    API.checkin(req, res)
})

app.post("/api/checkout", async (req, res) => {
    API.checkout(req, res)
})

app.post("/api/add", async (req, res) => {
    API.add(req, res)
})

app.post("/api/remove", async (req, res) => {
    API.remove(req, res)
})

app.post("/api/project", async (req, res) => {
    API.project(req, res)
})

app.post("/api/check", async (req, res) => {
    API.check(req, res)
})

app.post("/api/login", async (req, res) => {
    API.login(req, res)
})


/* Website pages */
app.get("/", (req, res) => {
    res.render("index")
})

on_loaded()