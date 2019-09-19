function check_usersname(el){
    socket.emit("username_taken", el.value)
}

socket.on("username_taken", taken => {
    console.log(taken)
})