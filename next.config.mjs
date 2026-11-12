/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Uploaded photos get unique file names and never change, so keep the
    // optimised versions for a month instead of re-generating them hourly.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
