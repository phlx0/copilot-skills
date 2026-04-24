import chalk from 'chalk';
import ora from 'ora';
import { REGISTRIES } from '../lib/registry.js';
import { getContents, getRawJson } from '../lib/github.js';

export async function searchCommand(query, options) {
  const searchAll = options.all || false;
  const registryKey = options.registry || 'default';
  const limit = Math.min(parseInt(options.limit, 10) || 20, 50);

  const registriesToSearch = searchAll
    ? Object.entries(REGISTRIES)
    : (() => {
        const reg = REGISTRIES[registryKey];
        if (!reg) {
          console.error(chalk.red(`Unknown registry: "${registryKey}"`));
          console.log(`Available: ${Object.keys(REGISTRIES).join(', ')}`);
          process.exit(1);
        }
        return [[registryKey, reg]];
      })();

  const spinner = ora(`Searching…`).start();

  try {
    const allResults = [];

    for (const [key, registry] of registriesToSearch) {
      spinner.text = `Searching ${registry.label}…`;
      let results = [];

      if (registry.indexUrl) {
        results = await searchViaIndex(registry.indexUrl, query, limit);
      }

      if (results.length === 0) {
        results = await searchViaDirectory(registry, query, limit);
      }

      for (const r of results) {
        allResults.push({ ...r, registryKey: key });
      }
    }

    spinner.stop();

    if (allResults.length === 0) {
      const scope = searchAll ? 'any registry' : REGISTRIES[registryKey].label;
      console.log(
        chalk.yellow(`\nNo skills found matching "${query}" in ${scope}`)
      );
      if (!searchAll) {
        console.log(chalk.dim(`  Try: copilot-skills search "${query}" --all`));
      }
      return;
    }

    console.log(
      chalk.bold(
        `\n${allResults.length} result${allResults.length === 1 ? '' : 's'} for "${query}"\n`
      )
    );

    const colWidth = Math.min(
      Math.max(...allResults.map((r) => r.name.length)) + 2,
      34
    );
    for (const r of allResults) {
      const namePart = chalk.cyan(r.name.padEnd(colWidth));
      const desc = trunc(r.description || '', 52);
      const regTag =
        r.registryKey !== 'default' ? chalk.dim(` [${r.registryKey}]`) : '';
      console.log(`  ${namePart}${chalk.dim(desc)}${regTag}`);
    }

    console.log('');
    const hasMultipleRegistries = allResults.some(
      (r) => r.registryKey !== allResults[0].registryKey
    );
    if (hasMultipleRegistries || allResults[0].registryKey === 'default') {
      console.log(
        chalk.dim(
          `Install: copilot-skills add <skill-name>  (or registry:<skill-name> for non-default)`
        )
      );
      console.log(chalk.dim(`Preview: copilot-skills info <skill-name>`));
    } else {
      const prefix = allResults[0].registryKey;
      console.log(
        chalk.dim(`Install: copilot-skills add ${prefix}:<skill-name>`)
      );
      console.log(
        chalk.dim(`Preview: copilot-skills info ${prefix}:<skill-name>`)
      );
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exit(1);
  }
}

async function searchViaIndex(indexUrl, query, limit) {
  const data = await getRawJson(indexUrl);
  if (!data) return [];

  const skills = normalizeIndex(data);
  const q = query.toLowerCase();

  return skills
    .filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    .slice(0, limit)
    .map((s) => ({ name: s.name, description: s.description || '' }));
}

function normalizeIndex(data) {
  if (Array.isArray(data)) return data;
  if (data.skills && Array.isArray(data.skills)) return data.skills;
  if (typeof data === 'object')
    return Object.values(data).filter((v) => v && typeof v === 'object');
  return [];
}

async function searchViaDirectory(registry, query, limit) {
  const pathsToSearch = [];

  if (registry.skillsPath) {
    pathsToSearch.push(registry.skillsPath);
  }

  for (const sub of registry.searchSubPaths || []) {
    pathsToSearch.push(
      registry.skillsPath ? `${registry.skillsPath}/${sub}` : sub
    );
  }

  const q = query.toLowerCase();
  const seen = new Set();
  const results = [];

  for (const dirPath of pathsToSearch) {
    if (results.length >= limit) break;
    const contents = await getContents(registry.owner, registry.repo, dirPath);
    if (!Array.isArray(contents)) continue;

    for (const e of contents) {
      if (results.length >= limit) break;
      if (
        e.type === 'dir' &&
        !e.name.startsWith('.') &&
        e.name.toLowerCase().includes(q) &&
        !seen.has(e.name)
      ) {
        seen.add(e.name);
        results.push({ name: e.name, description: '' });
      }
    }
  }

  return results;
}

function trunc(str, len) {
  if (typeof str !== 'string') return '';
  const flat = str.replace(/\n/g, ' ');
  return flat.length <= len ? flat : flat.slice(0, len - 1) + '…';
}
