import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google-cloud/vertexai', 'firebase-admin', 'google-auth-library'],
};

export default nextConfig;
