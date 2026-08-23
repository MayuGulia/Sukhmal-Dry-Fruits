import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ['@google/genai', 'firebase-admin', 'google-auth-library'],
};

export default nextConfig;
