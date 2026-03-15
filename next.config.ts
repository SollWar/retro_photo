import type { NextConfig } from "next";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserPage = repoName.endsWith(".github.io");
const customDomain = process.env.PAGES_CUSTOM_DOMAIN?.trim() ?? "";
const useRootPath = customDomain.length > 0;
const basePath = isGitHubActions && repoName && !isUserPage && !useRootPath ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
