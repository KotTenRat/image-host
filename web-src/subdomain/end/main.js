var data = new URLSearchParams(location.search);
var text = document.getElementById("text");
var success = data.get("success") === "true";
text.style.color = success ? "#0F0" : "#F00";
text.innerText = success ? "Subdomain addition successful. The changes might take a while to update." : data.get("error");