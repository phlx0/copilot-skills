import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { version, name } = require('../../package.json');

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';
const UA = `${name}/${version}`;

function authHeaders() {
  const headers = {
    'User-Agent': UA,
    Accept: 'application/vnd.github.v3+json'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function rawHeaders() {
  const headers = { 'User-Agent': UA };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function handleRateLimit(res) {
  const reset = res.headers.get('X-RateLimit-Reset');
  const resetTime = reset
    ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString()
    : 'soon';
  const hint = process.env.GITHUB_TOKEN
    ? ''
    : ' Set GITHUB_TOKEN env var to increase limits.';
  throw new Error(
    `GitHub API rate limit exceeded. Resets at ${resetTime}.${hint}`
  );
}

export async function getContents(owner, repo, path, ref = 'main') {
  const encodedPath = (path || '').split('/').map(encodeURIComponent).join('/');
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, { headers: authHeaders() });

  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) handleRateLimit(res);
  if (!res.ok)
    throw new Error(`GitHub API error ${res.status}: ${owner}/${repo}/${path}`);

  return res.json();
}

export async function getRawFile(owner, repo, filePath, ref = 'main') {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const url = `${GITHUB_RAW}/${owner}/${repo}/${encodeURIComponent(ref)}/${encodedPath}`;
  const res = await fetch(url, { headers: rawHeaders() });

  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) handleRateLimit(res);
  if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status}`);

  return res.text();
}

export async function getRawJson(url) {
  const res = await fetch(url, { headers: rawHeaders() });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    process.stderr.write(
      `[copilot-skills] Warning: failed to parse JSON from ${url}\n`
    );
    return null;
  }
}
