/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    domains: ["m.media-amazon.com", "shared.fastly.steamstatic.com"],
  },
};

module.exports = nextConfig;
