import "./main.css";
import "regenerator-runtime/runtime";

const normalizedPath = location.pathname.endsWith("/") ? location.pathname.slice(0, -1) : location.pathname;

if (normalizedPath === "/domains") {
    let domains = fetch("/api/domains").then(r => r.json());

    window.onload = async function() {
        const domainContainer = document.getElementById("domain-container");
        for (const domain of await domains) {
            const a = document.createElement("a");
            a.href = `https://${domain}/`;
            a.innerText = domain;
            a.className = "link";
            a.title = `DIH domain ${domain}`;
            const p = document.createElement("p");
            p.appendChild(a);
            p.className = "text-3xl";
            domainContainer.appendChild(p);
        }
    };
}

if (normalizedPath === "/login") {
    document.getElementById("key-input").addEventListener("keydown", function(e) {
        if ((e.key || e.code) === "Enter" || (e.keyCode || e.which) === 13) {
            location.href = "/login/" + e.currentTarget.value.split("/").join("");
        }
    });
}

if (normalizedPath === "/subdomain/ui") {
    document.getElementById("subdomain-add-button").addEventListener("click", function() {
        location.href = "/subdomain/add?" + new URLSearchParams({
            subdomain: document.getElementById("subdomain-input").value,
            key: document.getElementById("subdomain-key-input").value
        });
    });
}

if (normalizedPath === "/subdomain/end") {
    const data = new URLSearchParams(location.search);
    const text = document.getElementById("text");
    const success = data.get("success") === "true";
    text.classList.add(success ? "success" : "failure");
    text.innerText = success ? "Subdomain addition successful. The changes might take a while to update." : data.get("error");
}

if (normalizedPath === "/config") {
    import("./config/main.js");
}