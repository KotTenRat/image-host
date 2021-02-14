const colors = require("tailwindcss/colors");

module.exports = {
    theme: {
        colors: {
            midnight: "#1F1F3F",
            twilight: "#3F3F7F",
            noon: "#C7C7FF",
            ...colors
        },
        fontFamily: {
            sans: ["Poppins", "sans-serif"],
            serif: ["Palatino Linotype", "serif"]
        }
    },
    darkMode: "media"
};