const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const aes = require("aes-js");
const argon2 = require("argon2");
const mime = require("mime");
const path = require("path");
const moment = require("moment");
const multer = require("multer");
const helmet = require("helmet");
const config = require("./config");
const {escape: escapeHTML} = require("html-escaper");

let apiKeys = [];
const updateKeys = () => {
  fs.readFile("keys.txt", (err, buf) => {
    if (err) return console.error(err);
    const keys = buf.toString().split("\n").map(keyWithComment => keyWithComment.split("#")[0].trim());
    apiKeys = keys;
    oauth.updateKeys(keys);
  });
};
updateKeys();
const keyWatcher = fs.watch("keys.txt");
keyWatcher.on("change", () => {
  updateKeys();
  console.log("Reloaded keys!");
});

let domains = [];
const updateDomains = () => {
  fs.readFile("domains.txt", (err, buf) => {
    if (err) return console.error(err);
    domains = buf.toString().split("\n").map(d => d.trim()).filter(d => d);
  });
};
const domainWatcher = fs.watch("domains.txt");
domainWatcher.on("change", () => {
  updateDomains();
  console.log("Updated domains!");
});
updateDomains();

const cooldowns = new Map();
const shortCooldowns = new Map();

const {encryptionHashes, deletionHashes, shortUrls, shortDeletionHashes,
  embedData, expiryData, domainAnalytics} = require("./databases");
const oauth = require("./oauth");
const {deleteFile} = require("./funcs");

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"; // This has to be 64 characters long.
const cryptoRandomStr = size => {
  let res = "";
  for (const byte of crypto.randomBytes(size)) {
    res += characters[Math.floor(byte / 4)];
  }
  return res;
};
const recursiveFindFile = (size = 14, extension, depth = 0) => {
  const possibleName = cryptoRandomStr(size);
  return new Promise((resolve, reject) => {
    if (depth >= 16) return resolve({
      success: false,
      error: "Tried too many names - try increasing your name length."
    });
    fs.access(`images/${possibleName}.${extension}`, err => {
      if (err) resolve({
        success: true,
        name: `${possibleName}.${extension}`
      }); else recursiveFindFile(size, extension, depth + 1).then(resolve).catch(reject);
    });
  });
};

const app = express();
app.use(helmet({
  noCache: false,
  hsts: false,
  contentSecurityPolicy: false
}));

app.use((req, res, next) => {
  if (path.extname(req.url)) res.set("X-Robots-Tag", "noindex");
  next();
});

oauth.handle(app);

app.use(express.static("web"));

const FILE_SIZE_LIMIT = config.uploading.sizeLimit;
const multipartMiddleware = multer({
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    fields: 0,
    files: 1
  },
  storage: multer.memoryStorage()
}).any();
app.post("/upload", (req, res, next) => {
  multipartMiddleware(req, res, err => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({success: false, error: "Invalid multipart body"});
    }
    if (req.files && req.files[0]) req.file = req.files[0];
    if (req.file) return next();
    let body = Buffer.from([]);
    req.isTooLarge = false;
    req.on("data", chunk => {
      if (!req.isTooLarge) body = Buffer.concat([body, chunk]);
      if (body.length > FILE_SIZE_LIMIT) {
        req.isTooLarge = true;
        body = Buffer.from([]);
      }
    });
    req.on("end", function() {
      req.file = {
        buffer: body,
        mimetype: req.get("Content-Type")
      };
      next();
    });
  });
}, async (req, res) => {
  if (req.isTooLarge) return res.status(413).send({success: false, error: "Upload file too large"});
  let extension;
  try {
    extension = mime.getExtension(req.file.mimetype);
  } catch (e) {
    return res.status(415).json({success: false, error: "Bad Content-Type"});
  }
  const doEncryption = req.query.encryption === "yes";
  if (!extension || ["exe", "com", "js", "vbs", "msi", "dmg", "css", "html", "py"].includes(extension)) return res.status(403).json({success: false, error: "Forbidden file extension"});
  const key = (req.get("Authorization") || "").trim();
  if (!key || !apiKeys.includes(key)) return res.status(401).json({success: false, error: "Invalid API key"});
  const cooldown = cooldowns.get(key) || 0;
  if (cooldown > Date.now()) return res.status(429).json({success: false, error: `Ratelimited - wait ${cooldown - Date.now()}ms`});
  cooldowns.set(key, Date.now() + config.uploading.uploadRatelimit);
  let nameLength = ~~req.query.nameLength || 14;
  if (nameLength < 6 || nameLength > 24) return res.status(400).json({success: false, error: "Invalid name length"});
  const nameData = await recursiveFindFile(nameLength, extension);
  if (!nameData.success) return res.status(500).json({success: false, error: `Error while finding name: ${nameData.error}`});
  const name = nameData.name;
  const randomChoices = (req.query.random || "").split(",");
  const randomChoice = randomChoices[~~(randomChoices.length * Math.random())];
  let embed;
  if (req.query.embed === "yes") {
    if (!req.get("Content-Type").startsWith("image/")) return res.status(400).json({success: false, error: "Cannot embed a non-image upload!"});
    embed = {
      color: 0xFFFFFF,
      text: config.uploading.name
    };
    if (req.query.embedText) {
      if (req.query.embedText.length > 512) return res.status(400).json({success: false, message: "Embed text too long!"});
      embed.text = req.query.embedText;
    }
    if (req.query.embedColor === "RANDOM") embed.color = ~~(Math.random() * 0x1000000);
    else if (/^\d+$/.test(req.query.embedColor)) {
      const num = ~~req.query.embedColor;
      if (num < 0 || num > 0xFFFFFF) return res.status(400).json({success: false, error: "Invalid color!"});
      embed.color = num;
    } else {
      const match = (req.query.embedColor || "").match(/^#([A-Fa-f0-9]{6})$/);
      if (match) {
        const num = parseInt(match[1], 16);
        if (num < 0 || num > 0xFFFFFF || Number.isNaN(num)) return res.status(400).json({success: false, error: "Not sure how you did this, but invalid hex code?"});
        embed.color = num;
      }
    }
    if (req.query.embedTimezone) {
      const offset = parseInt(req.query.embedTimezone);
      if (!Number.isInteger(offset) || offset < -23 || offset > 23) return res.status(400).json({success: false, error: "Invalid timezone offset!"});
      embed.uploadedAt = moment().add(offset, "hours").format("h:mm A D/M/y");
    } else embed.uploadedAt = moment().format("h:mm A D/M/y");
  }
  let expiry;
  if (req.query.expire === "yes") {
    expiry = {};
    if (req.query.expireUses) {
      const num = ~~req.query.expireUses;
      if (num > 10 || num < 1) return res.status(400).json({success: false, error: "Uses must be between 1-10"});
      expiry.usesLeft = num;
    }
    if (req.query.expireTime) {
      const num = +req.query.expireTime;
      if (num < 0 || num > (1000 * 60 * 60 * 24)) return res.status(400).json({success: false, error: "Time must be less than a day!"});
      expiry.time = Date.now() + num;
    }
    if (!req.query.expireUses && !req.query.expireTime) return res.status(400).json({success: false, error: "No expiry data provided!"});
  }
  if (doEncryption) {
    const keyLength = ~~req.query.keyLength || (req.query.encryptionKey || {}).length || 0;
    if (keyLength > config.uploading.keyLengthLimit) return res.status(400).json({success: false, error: "Encryption key too large"});
    const encryptionKey = Buffer.from(req.query.encryptionKey || cryptoRandomStr(~~req.query.keyLength || 16));
    const aesCtr = new aes.ModeOfOperation.ctr(crypto.createHash("sha256").update(encryptionKey).digest());
    fs.writeFile(`images/${name}`, Buffer.from(aesCtr.encrypt(req.file.buffer)), async err => {
      if (err) {
        console.error(err);
        res.status(500).json({success: false, error: "Could not save image!"});
      }
      else {
        try {
          const encKeyStr = encryptionKey.toString();
          const hash = await argon2.hash(encKeyStr);
          encryptionHashes.set(name, {hash, legacy: false});
          const deletionKey = crypto.randomBytes(64).toString("hex");
          deletionHashes.set(name, await argon2.hash(deletionKey));
          console.log(`API key ${key} uploaded file ${name}`);
          let json = {
            success: true,
            encryptionKey: encKeyStr,
            name,
            deletionKey
          };
          if (randomChoice) json.random = randomChoice;
          json.deducedURL = `https://${json.random || req.get("Host")}/${json.encryptionKey}/${json.name}`;
          if (embed) embedData.set(name, embed);
          if (expiry) expiryData.set(name, expiry);
          const uploads = domainAnalytics.get(req.get("Host")) || 0;
          domainAnalytics.set(req.get("Host"), uploads + 1);
          if (req.query.onlyURL === "yes") res.status(200).type("text/plain").send(json.deducedURL);
          else res.status(200).json(json);
        } catch (e) {
          console.error(e);
          res.status(500).json({success: false, error: "Error while saving keys!"});
        }
      }
    });
  } else {
    fs.writeFile(`images/${name}`, req.file.buffer, async err => {
      if (err) {
        console.error(err);
        res.status(500).json({success: false, error: "Could not save image!"});
      }
      else {
        try {
          const deletionKey = crypto.randomBytes(64).toString("hex");
          deletionHashes.set(name, await argon2.hash(deletionKey));
          console.log(`API key ${key} uploaded file ${name}`);
          let json = {success: true, name, deletionKey};
          if (randomChoice) json.random = randomChoice;
          json.deducedURL = `https://${json.random || req.get("Host")}/${json.name}`;
          if (embed) embedData.set(name, embed);
          if (expiry) expiryData.set(name, expiry);
          const uploads = domainAnalytics.get(req.get("Host")) || 0;
          domainAnalytics.set(req.get("Host"), uploads + 1);
          if (req.query.onlyURL === "yes") res.status(200).type("text/plain").send(json.deducedURL);
          else res.status(200).json(json);
        } catch (e) {
          console.error(e);
          res.status(500).json({success: false, error: "Error while saving keys!"});
        }
      }
    });
  }
});

app.get("/shorten", async (req, res) => {
  const url = req.query.url;
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {}
  if (!urlObj) return res.status(400).json({success: false, error: "Invalid URL"});
  const key = (req.get("Authorization") || "").trim();
  if (!apiKeys.includes(key) || key.trim() === "") return res.status(401).json({success: false, error: "Invalid API key"});
  const cooldownAt = shortCooldowns.get(key) || 0;
  if (cooldownAt > Date.now()) return res.status(429).json({success: false, error: `Ratelimited - wait ${cooldownAt - Date.now()}ms`});
  shortCooldowns.set(key, Date.now() + 2500);
  const deletionKey = crypto.randomBytes(64).toString("hex");
  const doZW = req.query.mode === "zw";
  const name = doZW ? parseInt(crypto.randomBytes(6).toString("hex"), 16).toString(3)
      .split("0").join("\u200C")
      .split("1").join("\u200D")
      .split("2").join("\u200E") : await cryptoRandomStr(7);
  shortDeletionHashes.set(name, await argon2.hash(deletionKey));
  const randomChoices = (req.query.random || "").split(",");
  const randomChoice = randomChoices[~~(randomChoices.length * Math.random())];
  shortUrls.set(name, url);
  let json = {name, deletionKey};
  if (randomChoice) json.random = randomChoice;
  console.log(`API key ${key} shortened URL ${url}`);
  res.status(200).json(json);
});

app.get("/delete/:key/:name", async (req, res) => {
  try {
    const hash = deletionHashes.get(req.params.name);
    if (!hash) return res.status(404).json({success: false, message: "File does not exist"});
    if (!await argon2.verify(hash, req.params.key)) return res.status(401).json({success: false, message: "Invalid deletion key!"});
    try {
      await deleteFile(req.params.name);
      res.redirect("/deleted");
    } catch(e) {
      console.error(e);
      res.status(500).json({success: false, error: "An error occurred while deleting the file!"});
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({success: false, error: "An error occurred."});
  }
});

app.get("/delete-short/:key/:name", async (req, res) => {
  const hash = shortDeletionHashes.get(req.params.name);
  if (!hash) return res.status(404).json({success: false, message: "Shortened URL does not exist"});
  if (!await argon2.verify(hash, req.params.key)) return res.status(401).json({success: false, message: "Invalid deletion key!"});
  shortDeletionHashes.delete(req.params.name);
  shortUrls.delete(req.params.name);
  res.redirect("/deleted-short");
});

app.get(["/:encKey/:name", "/raw/:encKey/:name"], async (req, res, next) => {
  try {
    const encryptionHash = encryptionHashes.get(req.params.name);
    if (!encryptionHash) return next();
    if (!await argon2.verify(encryptionHash.hash, req.params.encKey)) return res.status(401).json({success: false, error: "Invalid decryption key!"});
    const embed = embedData.get(req.params.name);
    if (!req.url.startsWith("/raw/") && embed) {
      return res.type("text/html").send(`<!DOCTYPE html>
<html prefix="og: http://ogp.me/ns#">
<head>
<meta property="og:title" content="${escapeHTML(embed.text || config.name)}">
<meta property="theme-color" content="#${("000000" + embed.color.toString(16).toUpperCase()).slice(-6)}">
<meta property="og:image" content="https://${escapeHTML(req.get("Host"))}/raw/${req.params.encKey}/${req.params.name}">
<meta property="twitter:card" content="summary_large_image">
<meta property="og:description" content="Uploaded at ${embed.uploadedAt}">
</head>
<body>
<script>location.pathname = "/raw" + location.pathname;</script>
</body>
</html>`);
    }
    let expiry = expiryData.get(req.params.name);
    if (expiry) {
      if (expiry.time < Date.now()) {
        try {
          await deleteFile(req.params.name);
          next();
        } catch(e) {
          console.error(e);
          res.status(500).json({success: false, error: "An error occurred while deleting the file!"});
        }
        return;
      }
      if (expiry.usesLeft) {
        expiry.usesLeft--;
        if (!expiry.usesLeft) {
          try {
            await deleteFile(req.params.name);
            next();
          } catch(e) {
            console.error(e);
            res.status(500).json({success: false, error: "An error occurred while deleting the file!"});
          }
          return;
        }
        expiryData.set(req.params.name, expiry);
      }
    }
    fs.readFile(`images/${req.params.name}`, (err, buf) => {
      if (err) return res.status(500).json({success: false, error: "An error occurred while reading the file."});
      try {
        const aesCtr = new aes.ModeOfOperation.ctr(encryptionHash.legacy ? Buffer.from(req.params.encKey) : crypto.createHash("sha256").update(req.params.encKey).digest());
        const decrypted = aesCtr.decrypt(buf);
        res.type(mime.getType(path.extname(req.params.name))).send(Buffer.from(decrypted));
      } catch (e) {
        console.error(e);
        return res.status(500).json({success: false, error: "An error occurred."});
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({success: false, error: "An error occurred."});
  }
});

app.get(["/:name", "/raw/:name"], async (req, res, next) => {
  try {
    const deletionKey = deletionHashes.get(req.params.name);
    if (!deletionKey) return next();
    const encryptionHash = encryptionHashes.get(req.params.name);
    if (encryptionHash) return res.status(401).json({success: false, error: "This image is encrypted!"});
    const embed = embedData.get(req.params.name);
    if (!req.url.startsWith("/raw/") && embed) {
      return res.type("text/html").send(`<!DOCTYPE html>
<html prefix="og: http://ogp.me/ns#">
<head>
<meta property="og:title" content="${escapeHTML(embed.text || config.name)}">
<meta property="theme-color" content="#${("000000" + embed.color.toString(16).toUpperCase()).slice(-6)}">
<meta property="og:image" content="https://${escapeHTML(req.get("Host"))}/raw/${req.params.name}">
<meta property="twitter:card" content="summary_large_image">
<meta property="og:description" content="Uploaded at ${embed.uploadedAt}">
</head>
<body>
<script>location.pathname = "/raw" + location.pathname;</script>
</body>
</html>`);
    }
    let expiry = expiryData.get(req.params.name);
    if (expiry) {
      if (expiry.time < Date.now()) {
        try {
          await deleteFile(req.params.name);
          next();
        } catch(e) {
          console.error(e);
          res.status(500).json({success: false, error: "An error occurred while deleting the file!"});
        }
        return;
      }
      if (expiry.usesLeft) {
        expiry.usesLeft--;
        if (!expiry.usesLeft) {
          try {
            await deleteFile(req.params.name);
            next();
          } catch(e) {
            console.error(e);
            res.status(500).json({success: false, error: "An error occurred while deleting the file!"});
          }
          return;
        }
        expiryData.set(req.params.name, expiry);
      }
    }
    fs.readFile(`images/${req.params.name}`, (err, buf) => {
      if (err) return res.status(500).json({success: false, error: "An error occurred while reading the file."});
      try {
        res.type(mime.getType(path.extname(req.params.name))).send(buf);
      } catch (e) {
        console.error(e);
        return res.status(500).json({success: false, error: "An error occurred."});
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({success: false, error: "An error occurred."});
  }
});

app.get("/:name", (req, res, next) => {
  const url = shortUrls.get(req.params.name);
  if (!url) return next();
  res.redirect(url);
});

app.get("/api/domains", (req, res) => {
  res.json(domains);
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("this is a 404");
});

app.listen(config.port, function() {
  console.log(`Server is listening on port ${config.port}!`);
});
