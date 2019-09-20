function check_usersname(el){
    el.value = el.value.replace(/[^a-z0-9_]+|\s+/gmi, "")
    if(el.value.length < 3) {
        update_login_page(true, true)
        return
    }
    socket.emit("username_taken", el.value)
}

socket.on("username_taken", taken => {
    update_login_page(taken)
})


function update_login_page(username_taken, disabled = false){
    document.getElementById("name").style.display = username_taken ? "none" : "block"
    var button = document.getElementById("login-button")
    button.disabled = disabled
    button.title = disabled ? "Username must be at least 3 characters long" : (username_taken ? "Log in" : "Create account")
    button.innerText = disabled ? "sign up / log in" : (username_taken ? "log in" : "Sign up")
}

socket.on("login_err", msg => {
    var error_box = document.getElementById("error-message")
    error_box.innerText = msg
    error_box.style.display = "block"
})

function login(){
    socket.emit("login", {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        name: document.getElementById("name").value
    })
}

document.addEventListener("keypress", e => {
    if(e.key == "Enter") login()
})