import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'via.placeholder.com',
      'placehold.co',
      // add any other hostnames you use here
    ],
  },
};

export default nextConfig;
