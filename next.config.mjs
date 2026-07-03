import bundleAnalyzer from "@next/bundle-analyzer";

// Enabled only when ANALYZE=true (dev-only). Writes static HTML reports to
// .next/analyze/ without opening a browser. No effect on normal builds.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Strip console.* in production builds (keep error/warn for observability).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Tree-shake barrel imports from large libraries so each route only ships
  // the icons/components it actually uses.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@radix-ui/react-icons",
      "react-syntax-highlighter",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scav-datapipeline-upload.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scavenger-datapipeline-upload.s3.amazonaws.com",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "scavenger-organization-images.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scavenger-organization-images.s3.amazonaws.com",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
