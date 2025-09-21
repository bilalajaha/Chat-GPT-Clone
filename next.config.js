const config = require('./config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  env: {
    GEMINI_API_KEY: config.GEMINI_API_KEY,
  },
}

module.exports = nextConfig
