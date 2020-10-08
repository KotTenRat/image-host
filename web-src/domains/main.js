let domains = fetch("/api/domains").then(r => r.json());

window.onload = async function() {
    const domainContainer = document.getElementById("domain-container");
    for (const domain of await domains) {
        const a = document.createElement("a");
        a.href = `https://${a}/`;
        a.innerText = domain;
        const p = document.createElement("p");
        p.appendChild(a);
        domainContainer.appendChild(p);
    }
};