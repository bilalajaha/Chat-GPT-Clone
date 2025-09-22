const config = require('./config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || config.GEMINI_API_KEY,
  },
  // Ensure environment variables are available at build time
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig
