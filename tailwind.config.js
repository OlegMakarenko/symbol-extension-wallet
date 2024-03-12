const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './screens/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                body: ['Protipo', 'Tahoma', 'sans-serif'],
                accent: ['SofiaSansCondensed', 'Tahoma', 'sans-serif'],
                mono: ['JetBrainsMono', 'Consolas', '"Courier New"', 'monospace']
            }
        },
    },
    darkMode: "class",
    plugins: [
        nextui({
            layout: {
                radius: {
                    small: "2px", // rounded-small
                    medium: "4px", // rounded-medium
                    large: "6px", // rounded-large
                },
                borderWidth: {
                    small: "1px", // border-small
                    medium: "1px", // border-medium
                    large: "2px", // border-large
                },
            },
            themes: {
                light: {
                    colors: {
                        primary: {
                            foreground: '#ffffff',
                            DEFAULT: '#7413A4',
                            100: '#F7CEFA',
                            200: '#E99EF5',
                            300: '#CB6AE3',
                            400: '#A443C8',
                            500: '#7413A4',
                            600: '#5A0D8D',
                            700: '#440976',
                            800: '#30065F',
                            900: '#22034E',
                        }
                    }
                },
                dark: {
                    colors: {
                        primary: {
                            foreground: '#000000',
                            DEFAULT: '#26c3f2',
                            100: '#D3FEFB',
                            200: '#A8FCFD',
                            300: '#7CF0FB',
                            400: '#5ADEF7',
                            500: '#26C3F2',
                            600: '#1B99D0',
                            700: '#1374AE',
                            800: '#0C538C',
                            900: '#073B74',
                        },
                        secondary: {
                            foreground: '#ffffff',
                            DEFAULT: '#b429fa',
                            100: '#FBD4FE',
                            200: '#F2A9FE',
                            300: '#E37EFD',
                            400: '#D15DFB',
                            500: '#B429FA',
                            600: '#8D1DD7',
                            700: '#6A14B3',
                            800: '#4B0D90',
                            900: '#350777',
                            1000: '#2f0b40'
                        },
                        background: "#1b0a29",
                        main: "#1b0a29",
                        screen: "#221c31",
                        foreground: "#ffffff",
                        navbar: '#1A1A1A',
                        toast: '#000000',
                        card: '#413c4f',

                        // danger: {
                        //     DEFAULT: '#ff9999',
                        //     100: '#FFF1EA',
                        //     200: '#FFE0D6',
                        //     300: '#FFCCC1',
                        //     400: '#FFB9B2',
                        //     500: '#ff9999',
                        //     600: '#DB6F79',
                        //     700: '#B74D5F',
                        //     800: '#93304A',
                        //     900: '#7A1D3D',
                        // },
                        // success: {
                        //     DEFAULT: '#b3e6b3',
                        //     100: '#F6FDF2',
                        //     200: '#EBFCE6',
                        //     300: '#DCF7D6',
                        //     400: '#CBF0C8',
                        //     500: '#b3e6b3',
                        //     600: '#82C588',
                        //     700: '#5AA567',
                        //     800: '#39854C',
                        //     900: '#226E3C',
                        // },
                        // warning: {
                        //     DEFAULT: '#f7c06e',
                        //     100: '#FEF7E2',
                        //     200: '#FEEEC5',
                        //     300: '#FCE1A8',
                        //     400: '#FAD492',
                        //     500: '#f7c06e',
                        //     600: '#D49A50',
                        //     700: '#B17637',
                        //     800: '#8F5623',
                        //     900: '#763F15',
                        // }
                    }
                },
            },
        }),
    ],
}
