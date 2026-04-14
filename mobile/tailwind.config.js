/** @type {import('tailwindcss').Config} */
module.exports = {
    // This tells Tailwind where to look for your class names
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],

    // THIS IS THE MISSING PIECE!
    presets: [require("nativewind/preset")],

    theme: {
        extend: {},
    },
    plugins: [],
}