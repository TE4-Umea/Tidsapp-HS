/**
 * Main script
 * This script logs in the user and connects to socket.io
 */

var me
var on_login = () => {}

var token = localStorage.getItem("token")
if(token){
    /* socket.emit("login_with_token", token) */
    /* axios */
}
/* 
socket.on("login", user => {
    me = user
    on_login()
}) */

/* socket.on("invalid_token", () => {
    console.warn("Invalid token")
    localStorage.removeItem("token")
}) */

/* socket.on("err", msg => {
    alert(msg)
})

socket.on("token", token => {
    localStorage.setItem("token", token)
    location.href = "/dashboard"
})

socket.on("redir", url => {
    location.href = url
}) */