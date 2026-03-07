/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@darkindex/sdk',
    'starknet',
    '@starknet-react/core',
    '@starknet-react/chains',
    'get-starknet-core',
  ],
};

export default nextConfig;
