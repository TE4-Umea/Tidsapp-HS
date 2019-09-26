if (!token) location.href = "/login"
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
    for (var project of me.projects) {
        projects += `<div class="project" project-name="${project.name}"><span class="project-name">${project.name.toUpperCase()}</span><canvas class="project-timeline"></canvas><button class="project-button mdc-button mdc-button--outlined" onclick="check_in_project('${project.name}')">${me.checked_in_project == project.name ? "check out" : "check in"}</button><svg version="1.1" class="wipe" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;" xml:space="preserve"> <defs> <linearGradient id="gradient" x2="0.35" y2="1"><stop offset="0%" id="${project.name}-stop-0" stop-color="#b5b5b5"></stop> <stop offset="100%" id="${project.name}-stop-1" stop-color="#4a4a4a"></stop> </linearGradient> </defs> <path class="st0" d="M-14.9-64.8c0,0-40.3,578.2,578.2,578.2s568.6,0,568.6,0l1.9,327l-1242.7,13.4l-47.9-993.4L-14.9-64.8z"></path> </svg></div>`
    }
    document.getElementById("projects").innerHTML = projects
    update_projects(me.checked_in, me.checked_in_project)
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

function light_up_project(el, light_up = true) {
    var project_name = el.getAttribute("project-name")
    var project = get_project(project_name)
    var gradient = [light_up ? project.color_top : "#b5b5b5", light_up ? project.color_bot : "#4a4a4a"]
    document.getElementById(project.name + "-stop-0").setAttribute("stop-color", gradient[0])
    document.getElementById(project.name + "-stop-1").setAttribute("stop-color", gradient[1])
    var text = el.children[0]
    text.style.background = '-webkit-linear-gradient(0deg, ' + gradient[0] +', ' + gradient[1] + ')'
    text.style['-webkit-background-clip'] = 'text'
    text.style['-webkit-text-fill-color'] = 'transparent'
}

var hover = false
document.addEventListener("mousemove", e => {
    if(hover){
        for (var pro of document.getElementsByClassName("project")) {
            if (me.checked_in_project != pro.getAttribute("project-name")) {
                light_up_project(pro, false)
            }
        }
        hover = false
    }

    for (var el of e.composedPath()) {
        if (el.getAttribute) {
            if (el.getAttribute("project-name")) {
                light_up_project(el)
                hover = true
            }
        }
    }
})

function get_project(project_name) {
    for (var project of me.projects) {
        if (project.name == project_name) return project
    }
    return false
}

function check_in_project(project_name) {
    var check_in = me.checked_in_project == project_name ? false : true

    axios.post("/api/checkin", {
        token: token,
        check_in: check_in,
        project: project_name
    }).then(res => {
        var data = res.data
        if (data.success) {
            me.checked_in_project = check_in ? project_name : ""
            me.checked_in = check_in
            update_projects(check_in, project_name)
        }
        notice(data.text, data.success)
    })
}

function update_projects(checked_in, project_name) {
    for (var el of document.getElementsByClassName("project")) {
        if (el.getAttribute("project-name") == me.checked_in_project) {
            light_up_project(el)
        }
        if (el.getAttribute("project-name") == project_name) {
            el.children[2].innerText = checked_in ? "check out" : "check in"
        } else {
            el.children[2].innerText = "check in"
        }
    }
    update_checked_in_status(checked_in)
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

function new_project() {
    var project = prompt("Choose a name of the project: ")
    if (project) {
        axios.post("/api/new", {
            project,
            token
        }).then(res => {
            var data = res.data
            notice(data.text, data.success)
        })
    }
}