if(!token) location.href = "/login"
var sign_token = document.getElementById("slack-sign-token").innerText
if (sign_token) {
    axios.post("/api/sign", {
        token,
        sign_token
    }).then(res => {
        var data = res.data
        if (data.success) {
            location.href = data.redir
        }
    })
}

var time_el = document.getElementById("time")
var sec_bar = document.getElementById("seconds-bar")

function update_clock() {
    var time = new Date()
    time_el.innerText = force_length(time.getHours()) + ":" + force_length(time.getMinutes())
    sec_bar.style.width = (((time.getSeconds() + (time.getMilliseconds() / 1000)) / 60) * 100) + "px"
}

function force_length(val) {
    return val.toString().length == 2 ? val.toString() : "0" + val.toString()
}

update_clock()
setInterval(() => {
    update_clock()
}, 500)

on_login = () => {
    if (me.slack_id) document.getElementById("slack-button").remove()
    update_checked_in_status(me.checked_in)
    document.getElementById("avatar").src = me.avatar ? me.avatar : "img/avatar.png"
    document.getElementById("logged-in-as").innerText = "Logged in as " + me.name + " (" + me.username + ")"

    var projects = ""
    for(var project of me.projects){
        projects += `<div class="project" project-name="${project.name}"><span class="project-name">${project.name.toUpperCase()}</span><canvas class="project-timeline"></canvas><button class="project-button mdc-button mdc-button--outlined" onclick="check_in_project('${project.name}')">${me.checked_in_project == project.name ? "check out" : "check in"}</button><svg version="1.1" class="wipe" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;" xml:space="preserve"> <defs> <linearGradient id="gradient" x2="0.35" y2="1"><stop offset="0%" stop-color="#ff1f85"></stop> <stop offset="100%" stop-color="#ff224f"></stop> </linearGradient> </defs> <path class="st0" d="M-14.9-64.8c0,0-40.3,578.2,578.2,578.2s568.6,0,568.6,0l1.9,327l-1242.7,13.4l-47.9-993.4L-14.9-64.8z"></path> </svg></div>`
    }
    document.getElementById("projects").innerHTML = projects
}

function check_in() {
    axios.post("/api/checkin", {
        token: token
    }).then(res => {
        var data = res.data
        notice(data.text, data.success)
        update_checked_in_status(data.checked_in)
    })
}

function check_in_project(project_name){
    axios.post("/api/checkin", {
        token: token,
        check_in: true,
        project: project_name
    }).then(res => {
        var data = res.data
        if(data.success){
            me.check_in_project = project_name
            me.checked_in = true
            update_projects()
        }
        notice(data.text, data.success)
    })
}

function update_projects(){
    for(var el of document.getElementsByClassName("project")){
        if(el.getAttribute("project-name") == me.check_in_project){
            el.children[2].innerText = "check out"
        } else {
            el.children[2].innerText = "check in"
        }
    }
    update_checked_in_status(true)
}

function update_checked_in_status(checked_in) {
    var check_in_button = document.getElementById("check-in-button")
    if (checked_in) {
        check_in_button.classList.add("mdc-button--outlined")
        check_in_button.classList.remove("mdc-button--raised")
        check_in_button.innerText = "check out"
    } else {
        check_in_button.classList.remove("mdc-button--outlined")
        check_in_button.classList.add("mdc-button--raised")
        check_in_button.innerText = "check in"
    }
}

function new_project(){
    var project = prompt("Choose a name of the project: ")
    if(project){
        axios.post("/api/new", {
            project, token
        }).then(res => {
            var data = res.data
            notice(data.text, data.success)
        })
    }
}