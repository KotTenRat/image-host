const Vue = require("vue").default;
const App = require("./App.vue").default;
const VueHighlightJS = require("vue-highlightjs");
Vue.use(VueHighlightJS);
window.onload = function() {
  new Vue({
    el: "#vue-root",
    render: h => h(App)
  });
};