var documentation
var md = window.markdownit({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) {}
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

socket.emit("get_documentation")
socket.on("documentation", doc => {
    documentation = doc
    var list = ""
    var classes = ""
    for(var i = 0;i  < documentation.length; i++){
        var page = documentation[i]
        list+="<option value='" + i + "'>" + page.title + "</option>"
        if(page.type == "class") classes += "<option value='" + page.title + "'>" + page.title + "</option>"
    }
    document.getElementById("class").innerHTML += classes
    document.getElementById("load-page").innerHTML += list
})

function load(el){
    var page = documentation[el.value]
    el.value = ""
    document.getElementById("text-area").value = page.text
    document.getElementById("title-input").value = page.title
    document.getElementById("type").value = page.type
    document.getElementById("pinned").checked = page.pinned
    document.getElementById("class").value = page.class ? page.class : ""
    preview({value: page.text})
}

function preview(el){
    document.getElementById("preview").innerHTML = md.render(el.value)
}

function upload(){
    socket.emit("upload_documentation", {
        token: document.getElementById("token").value,
        text: document.getElementById("text-area").value,
        type: document.getElementById("type").value,
        pinned: document.getElementById("pinned").checked,
        title: document.getElementById("title-input").value,
        class: document.getElementById("class").value ? document.getElementById("class").value : null

    })
}