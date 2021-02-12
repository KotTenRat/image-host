module.exports = {
  name: "Dapper Image Host",
  enableExpire: false // this defines whether the "expiry" section shows.
                      // I'm pretty sure the feature is broken, and
                      // it doesn't work with a caching reverse proxy or CDN, so have fun.
};