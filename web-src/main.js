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

    document.getElementById("subdomain-link").addEventListener("click", function() {
       document.getElementById("landing").style.display = "none";
       document.getElementById("subdomain-add-page").style.display = "block";
    });

    document.getElementById("subdomain-add-button").addEventListener("click", function() {
        location.href = "/subdomain/add?" + new URLSearchParams({
            subdomain: document.getElementById("subdomain-input").value,
            key: document.getElementById("subdomain-key-input").value
        });
    });
});