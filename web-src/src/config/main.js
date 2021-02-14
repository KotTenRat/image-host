const Vue = require("vue").default;
const App = require("./App.vue").default;

import VueHighlightJS from "vue-highlight.js";
import json from "highlight.js/lib/languages/json";

Vue.use(VueHighlightJS, {
    languages: {
        json
    }
});
window.onload = function() {
    new Vue({
        el: "#vue-root",
        render: h => h(App)
    });
};