import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // بلڈ کے وقت ٹائپ سکرپٹ ایورز کو نظر انداز کرے گا
    ignoreBuildErrors: true,
  },
  eslint: {
    // بلڈ کے وقت ESLint ایورز کو نظر انداز کرے گا
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;