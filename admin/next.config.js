/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(__dirname, '../') }),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
};

module.exports = nextConfig;
