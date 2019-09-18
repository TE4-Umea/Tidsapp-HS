/**
 * Main script
 * This script logs in the user and connects to socket.io
 */

var socket = io.connect()

socket.on("err", msg => {
    alert(msg)
})