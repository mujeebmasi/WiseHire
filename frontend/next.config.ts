import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // In development Next only serves its own assets to the hostname it started
  // on (localhost). Adding 127.0.0.1 lets you open the app under a second
  // hostname, which gives you a separate login - handy for viewing the site as
  // a candidate and an employer side by side. It also covers opening the dev
  // site from your phone on the same network.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
