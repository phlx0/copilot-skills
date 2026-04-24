import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getContents, getRawFile } from './github.js';

export async function fetchGitHubSkill(source, nameOverride) {
  const { owner, repo, ref = 'main', path = '' } = source;
  const files = [];

  await downloadDir(owner, repo, path, ref, files, path);

  if (!files.find((f) => f.path === 'SKILL.md')) {
    throw new Error(
      `No SKILL.md found in github.com/${owner}/${repo}${path ? `/${path}` : ''}`
    );
  }

  const skillName = nameOverride || (path ? path.split('/').pop() : repo);
  return { skillName, files };
}

async function downloadDir(
  owner,
  repo,
  dirPath,
  ref,
  files,
  basePath,
  depth = 0
) {
  if (depth > 2) return;

  const contents = await getContents(owner, repo, dirPath, ref);

  if (!contents) {
    throw new Error(
      `Path not found: github.com/${owner}/${repo}/${dirPath || '(root)'}`
    );
  }
  if (!Array.isArray(contents)) {
    throw new Error(
      `"${dirPath}" is a file, not a directory — point to the skill's folder`
    );
  }

  for (const entry of contents) {
    const relativePath =
      basePath && entry.path.startsWith(basePath + '/')
        ? entry.path.slice(basePath.length + 1)
        : entry.path;

    if (relativePath.split('/').some((part) => part.startsWith('.'))) continue;

    if (entry.type === 'file') {
      const content = await getRawFile(owner, repo, entry.path, ref);
      if (content !== null) {
        files.push({ path: relativePath, content });
      }
    } else if (entry.type === 'dir') {
      await downloadDir(
        owner,
        repo,
        entry.path,
        ref,
        files,
        basePath,
        depth + 1
      );
    }
  }
}

export async function fetchLocalSkill(localPath, nameOverride) {
  const expandedPath = localPath.startsWith('~/')
    ? join(homedir(), localPath.slice(2))
    : localPath;

  if (!existsSync(expandedPath)) {
    throw new Error(`Local path not found: ${localPath}`);
  }

  const files = [];
  await collectLocalFiles(expandedPath, expandedPath, files, 0);

  if (!files.find((f) => f.path === 'SKILL.md')) {
    throw new Error(`No SKILL.md found in ${localPath}`);
  }

  const skillName = nameOverride || expandedPath.split('/').pop();
  return { skillName, files };
}

async function collectLocalFiles(dir, basePath, files, depth) {
  if (depth > 2) return;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.slice(basePath.length + 1);

    if (entry.isFile()) {
      const content = await readFile(fullPath, 'utf8').catch(() => null);
      if (content !== null) {
        files.push({ path: relativePath, content });
      }
    } else if (entry.isDirectory()) {
      await collectLocalFiles(fullPath, basePath, files, depth + 1);
    }
  }
}
