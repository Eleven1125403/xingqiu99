import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/xingqiu99";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  basePath: isGithubPages ? githubPagesBasePath : "",
  assetPrefix: isGithubPages ? `${githubPagesBasePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: isGithubPages,
  devIndicators: false,
};

export default nextConfig;
