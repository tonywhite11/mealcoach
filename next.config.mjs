/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.0.0.92'],
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  }
};
export default nextConfig;
