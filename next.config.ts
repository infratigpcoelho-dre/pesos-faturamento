/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Atenção: Isso permite o build mesmo com avisos de erro.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Também ignora erros de tipagem no build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;