/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    DEFAULT: '#0d1117',
                    lighter: '#161b22',
                    darker: '#010409',
                },
                primary: {
                    DEFAULT: '#58a6ff',
                    hover: '#1f6feb',
                },
                secondary: '#21262d',
                border: '#30363d',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #58a6ff 0%, #a855f7 100%)',
            }
        },
    },
    plugins: [],
}
