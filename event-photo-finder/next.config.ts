import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Changed to https for standard placeholder
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', // Changed to https for standard placeholder
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // Use http for your localhost backend
        hostname: 'localhost',
        port: '8000', // Specify the port
        pathname: '/files/**', // IMPORTANT: Adjust '/files/**' to match the actual path where your backend serves images
      },
      // Add any other remote image hosts here with their specific protocols, hostnames, ports, and pathnames.
    ],
  },
};

export default nextConfig;
