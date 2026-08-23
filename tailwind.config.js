/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins_400Regular"],
        poppins: ["Poppins_400Regular"],
        'poppins-light': ['Poppins_300Light'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
        'poppins-extrabold': ['Poppins_800ExtraBold'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF5200',
          dark: '#E64A00',
          light: '#FFF3EE',
          warm: '#FF9A3C',
        },
        navyDark: '#1C1C1C',
        pageBg: '#F8F9FA',
        success: '#10b981',
        amber: '#f59e0b',
      },
      borderRadius: {
        'xl': 16,
        '2xl': 20,
        '3xl': 24,
        '4xl': 32,
        'full': 9999,
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        floating: '0 -4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
