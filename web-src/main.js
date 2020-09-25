window.addEventListener("load", function() {
    document.getElementById("login-link").addEventListener("click", function() {
        document.getElementById("landing").style.display = "none";
        document.getElementById("key-input-page").style.display = "block";
    });
    document.getElementById("key-input").addEventListener("keydown", function(e) {
        if ((e.key || e.code) === "Enter" || (e.keyCode || e.which) === 13) {
            location.href = "/login/" + e.currentTarget.value.split("/").join("");
        }
    });
});