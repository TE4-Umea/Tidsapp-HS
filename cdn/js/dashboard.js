var sign_token = document.getElementById("slack-sign-token").innerText
if(sign_token){
    axios.post("/api/sign", {token, sign_token}).then(res => {
        var data = res.data
        if(data.success){
            location.href = data.redir
        }
    })
}

var time_el = document.getElementById("time")
var sec_bar = document.getElementById("seconds-bar")
function update_clock(){
    var time = new Date()
    time_el.innerText = force_length(time.getHours() )+ ":" + force_length(time.getMinutes())
    sec_bar.style.width = ((time.getSeconds() / 60) * 100) + "px"
}

function force_length(val){
    return val.toString().length == 2 ? val.toString() : "0" + val.toString()
}

update_clock()
setInterval(() => {
    update_clock()
}, 1000)

on_login = () => {
    document.getElementById("logged-in-as").innerText = "Logged in as " + me.name + " (" + me.username + ")"
}