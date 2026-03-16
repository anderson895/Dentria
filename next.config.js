/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  transpilePackages: ['three'],
}

module.exports = nextConfig