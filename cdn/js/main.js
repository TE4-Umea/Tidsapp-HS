
/**
 * Main script
 * This script logs in the user and connects to socket.io
 */

var me
var on_login = () => {}

var token = localStorage.getItem("token")
if(token){
    axios.post("/api/profile", {
        token
    }).then(res => {
        var data = res.data
        if(data.success){
            me = data.profile
            on_login()
        } else {
            localStorage.removeItem("token")
            location.href = "/"
        }
    })
}

/* socket.on("token", token => {
    localStorage.setItem("token", token)
    location.href = "/dashboard"
})
 */
/* socket.on("redir", url => {
    location.href = url
})  */

function logout(){
    localStorage.removeItem("token")
    location.href = "/login"
}