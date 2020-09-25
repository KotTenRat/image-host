const passport = require("passport");
const config = require("./config");
const {refreshTokens} = require("./databases");
const DiscordStrategy = require("passport-discord").Strategy;
const Discord = require("discord.js");
const client = new Discord.Client();
const loginProm = client.login(config.oauth.botToken);
const guildProm = (async () => {
    await loginProm;
    return await client.guilds.fetch(config.oauth.guildID);
})();

passport.use(new DiscordStrategy({
  clientID: config.oauth.clientID,
  clientSecret: config.oauth.clientSecret,
  callbackURL: config.oauth.callback,
  scope: ["guilds.join", "identify"],
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, cb) {
  if (!keys.includes(req.query.state)) return cb("Invalid key!");
  if (refreshTokens.get(req.query.state)) return cb("You're already registered!");
  refreshTokens.set(req.query.state, refreshToken);
  cb(null, profile);
}));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

let keys = [];

module.exports.handle = app => {
  app.use(passport.initialize());
  app.get("/login/return", passport.authenticate("discord", {
    failureRedirect: "/"
  }), async (req, res) => {
    const guild = await guildProm;
    try {
      const member = await guild.members.fetch(req.user.id);
      if (!member) throw new Error("No member");
      await member.roles.add(config.oauth.roleID, "Has access to Dabber Image Host");
    } catch(e) {
      await guild.addMember(req.user.id, {
        accessToken: req.user.accessToken,
        roles: [
            config.oauth.roleID
        ]
      })
    }
    res.redirect("/added");
  });
  app.get("/login/:key", (req, res, next) => {
    if (!keys.includes(req.params.key)) return res.type("text/plain").send("Invalid key!");
    if (refreshTokens.get(req.query.key)) return res.type("text/plain").send("You're already registered!");
    passport.authenticate("discord", {state: req.params.key})(req, res, next);
  });
};

module.exports.updateKeys = newKeys => {
  keys = newKeys;
};