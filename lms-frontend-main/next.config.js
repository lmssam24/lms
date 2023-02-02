/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: "/course",
        destination: "http://learn.educationnest.com/course-detail/",
      },
    ];
  },
  distDir: "build",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const withTM = require("next-transpile-modules")(["react-bootstrap"]);

module.exports = withTM(nextConfig);
