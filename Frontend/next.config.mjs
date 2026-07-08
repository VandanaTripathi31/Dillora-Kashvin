/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow phone/other devices on your wifi to open the dev site via your PC's IP.
  // Add your network IP here (the one shown as "Network:" when you run npm run dev).
  allowedDevOrigins: ['192.168.31.4', '192.168.1.4', '192.168.0.4'],
  images: {
    // Serve modern formats (AVIF → WebP) automatically for every next/image.
    formats: ['image/avif', 'image/webp'],
    // Responsive breakpoints used to generate srcsets.
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 604800, // cache optimized images for a week
    // Allow images from these hosts (local /images are optimized automatically).
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
