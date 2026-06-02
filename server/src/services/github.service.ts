import redis from "../config/redis";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// GitHub public-repo reader.
//
// Reads a user's PUBLIC repositories (no auth) to give the agent real context
// about the projects they've built — names, descriptions, languages, stars and
// a README excerpt. Results are cached in Redis to stay well within GitHub's
// unauthenticated rate limit (60 req/hr/IP).
// ─────────────────────────────────────────────

export interface GithubRepoSummary {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  topics: string[];
  url: string;
  homepage: string | null;
  updatedAt: string;
  readmeExcerpt: string | null;
}

const CACHE_TTL = 60 * 30; // 30 minutes
const GH_API = "https://api.github.com";
const MAX_REPOS = 8;
const README_CHARS = 1200;

const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ai-resume-agent",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

function sanitizeUsername(raw: string): string {
  // Accept a bare username or a full github.com/<user> URL.
  const trimmed = raw.trim().replace(/\/+$/, "");
  const fromUrl = trimmed.match(/github\.com\/([^/]+)/i);
  const candidate = fromUrl ? fromUrl[1] : trimmed;
  return candidate.replace(/[^a-zA-Z0-9-]/g, "");
}

async function fetchReadmeExcerpt(
  username: string,
  repo: string
): Promise<string | null> {
  try {
    const res = await fetch(`${GH_API}/repos/${username}/${repo}/readme`, {
      headers: { ...headers, Accept: "application/vnd.github.raw+json" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const cleaned = text
      .replace(/```[\s\S]*?```/g, " ") // drop code blocks
      .replace(/[#>*_`|-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, README_CHARS) || null;
  } catch {
    return null;
  }
}

interface RawRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  html_url: string;
  homepage: string | null;
  updated_at: string;
  fork: boolean;
  archived: boolean;
}

export async function getGithubRepos(
  rawUsername: string
): Promise<{ username: string; repos: GithubRepoSummary[] }> {
  const username = sanitizeUsername(rawUsername);
  if (!username) {
    throw new Error("A valid GitHub username is required");
  }

  const cacheKey = `github:repos:${username.toLowerCase()}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) {
    return JSON.parse(cached) as {
      username: string;
      repos: GithubRepoSummary[];
    };
  }

  const res = await fetch(
    `${GH_API}/users/${username}/repos?sort=updated&per_page=30&type=owner`,
    { headers }
  );

  if (res.status === 404) {
    throw new Error(`GitHub user "${username}" not found`);
  }
  if (!res.ok) {
    logger.warn("GitHub repos fetch failed", { username, status: res.status });
    throw new Error("Could not reach GitHub. Please try again shortly.");
  }

  const raw = (await res.json()) as RawRepo[];

  const ranked = raw
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, MAX_REPOS);

  const repos: GithubRepoSummary[] = await Promise.all(
    ranked.map(async (r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      topics: r.topics ?? [],
      url: r.html_url,
      homepage: r.homepage || null,
      updatedAt: r.updated_at,
      readmeExcerpt: await fetchReadmeExcerpt(username, r.name),
    }))
  );

  const payload = { username, repos };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(payload)).catch(() => {});
  return payload;
}
