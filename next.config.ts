import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Render paths read the registry, snapshot cache, provenance log and
  // charter from disk with dynamic paths the output tracer cannot see —
  // without this, a serverless re-render (a cache miss after purge/eviction)
  // runs against an empty data dir and serves empty envelopes.
  outputFileTracingIncludes: {
    "/**": ["./data/**", "./CHARTER.md"],
  },
};

export default nextConfig;
