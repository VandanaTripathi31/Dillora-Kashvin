/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow phone/other devices on your wifi to open the dev site via your PC's IP.
  // Add your network IP here (the one shown as "Network:" when you run npm run dev).
  allowedDevOrigins: ['192.168.31.4', '192.168.1.4', '192.168.0.4'],
  images: {
    // Allow images from these hosts (Unsplash placeholders now, Cloudinary later)
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
