var sign_token = document.getElementById("token").innerText
if(sign_token.length > 0){
    console.log(sign_token)
    
}

if(sign_token){
    console.log("EXISTS")
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