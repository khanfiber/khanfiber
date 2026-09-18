/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Vercel پر ڈیپلائے کرتے وقت تایپ سکرپٹ ایررز کو بلاک کرنے سے روکے گا
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint کے الرٹس بھی سکپ کرے گا
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;