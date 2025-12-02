import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', 'http://172.20.21.33:3000'],
  outputFileTracingRoot: __dirname, // Or use path.join(__dirname)
};


export default nextConfig;
