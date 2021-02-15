const config = require("./config");
const request = require("superagent");

let cached = null;
let domains = [];
let keys = [];
let ratelimits = new Map();

async function setSubdomain(subdomain, key) {
    const match = subdomain.toLowerCase().match(/^((?!-)[a-z0-9\-]*[a-z0-9])\.([a-z0-9\-]+\.[a-z0-9\-]{2,})$/);
    if (!match) {
        throw new Error("Subdomain must be in format a.b.c");
    }

    const [ , recordName, zoneName] = match;

    if (!domains.includes(zoneName)) {
        throw new Error(`Domain ${zoneName} not found`);
    }

    if (!keys.includes(key)) {
        throw new Error("Invalid API key");
    }

    if (ratelimits.has(key) && ratelimits.get(key) > Date.now()) {
        throw new Error("You are ratelimited!");
    }
    ratelimits.set(key, Date.now() + config.cloudflare.ratelimit);

    if (cached === null) {
        const res = await request("https://api.cloudflare.com/client/v4/zones")
            .set("X-Auth-Key", config.cloudflare.key)
            .set("X-Auth-Email", config.cloudflare.email);
        cached = res.body.result;
    }

    const zone = cached.find(z => z.name === zoneName);
    if (!zone) {
        throw new Error(`Domain ${zoneName} not found`);
    }

    await request.post(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`)
        .set("X-Auth-Key", config.cloudflare.key)
        .set("X-Auth-Email", config.cloudflare.email)
        .send({
            type: "A",
            name: subdomain,
            content: config.cloudflare.ip,
            ttl: 1,
            proxied: true
        });
}

function redirect(res, obj) {
    res.redirect(`/subdomain/end?` + new URLSearchParams(obj));
}

function handle(app) {
    app.get("/subdomain/add", async (req, res) => {
        if (!req.query.subdomain) return redirect(res, {success: false, error: "No subdomain given"});
        if (!req.query.key) return redirect(res, {success: false, error: "No key given"});
        try {
            await setSubdomain(req.query.subdomain, req.query.key);
            redirect(res, {success: true});
        } catch (e) {
            redirect(res, {success: false, error: e.message});
        }
    });
}

function updateDomains(newDomains) {
    cached = null;
    domains = newDomains;
}

function updateKeys(newKeys) {
    keys = newKeys;
}

module.exports.handle = handle;
module.exports.updateDomains = updateDomains;
module.exports.updateKeys = updateKeys;