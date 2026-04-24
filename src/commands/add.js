import chalk from 'chalk';
import ora from 'ora';
import {
  parseSource,
  resolveRegistrySkill,
  REGISTRIES
} from '../lib/registry.js';
import { fetchGitHubSkill, fetchLocalSkill } from '../lib/fetch-skill.js';
import {
  writeSkillFile,
  readManifest,
  writeManifest,
  removeSkill,
  validateSkillMd,
  parseSkillFrontmatter
} from '../lib/skills.js';
import {
  resolveSkillsPath,
  sanitizeSkillName,
  displayPath
} from '../lib/paths.js';

export async function addCommand(source, options) {
  const skillsDir = resolveSkillsPath(options.path);
  const spinner = ora();

  try {
    spinner.start(`Resolving ${chalk.cyan(source)}…`);

    const parsed = parseSource(source);
    let skillName, files, resolvedSource;

    if (parsed.type === 'local') {
      spinner.text = 'Reading local skill…';
      ({ skillName, files } = await fetchLocalSkill(parsed.path, options.name));
      resolvedSource = parsed;
    } else if (parsed.type === 'github') {
      spinner.text = `Fetching from github.com/${parsed.owner}/${parsed.repo}…`;
      ({ skillName, files } = await fetchGitHubSkill(parsed, options.name));
      resolvedSource = parsed;
    } else if (parsed.type === 'registry-search') {
      spinner.text = `Searching registry for "${chalk.cyan(parsed.name)}"…`;
      const found = await resolveRegistrySkill(parsed.name, parsed.registryKey);

      if (!found) {
        spinner.fail(
          `Skill "${parsed.name}" not found in the default registry`
        );
        const reg = REGISTRIES[parsed.registryKey || 'default'];
        console.log(chalk.dim(`  Tip: copilot-skills search ${parsed.name}`));
        console.log(
          chalk.dim(
            `  Or try: registry:skill-name (e.g. openai:gh-address-comments)`
          )
        );
        process.exit(1);
      }

      spinner.text = `Fetching "${found.skillName}" from ${found.owner}/${found.repo}…`;
      ({ skillName, files } = await fetchGitHubSkill(found, options.name));
      resolvedSource = found;
    }

    if (options.name) skillName = options.name;
    const safeSkillName = sanitizeSkillName(skillName);

    const skillMdFile = files.find((f) => f.path === 'SKILL.md');
    if (!skillMdFile) {
      spinner.fail('No SKILL.md found in source');
      process.exit(1);
    }
    const warnings = validateSkillMd(skillMdFile.content);

    const manifest = await readManifest(skillsDir);
    if (manifest.skills[safeSkillName]) {
      spinner.warn(
        `Skill "${safeSkillName}" is already installed. ` +
          `Run ${chalk.cyan(`copilot-skills update ${safeSkillName}`)} to refresh it.`
      );
      process.exit(0);
    }

    spinner.text = `Installing "${safeSkillName}"…`;
    try {
      for (const file of files) {
        await writeSkillFile(skillsDir, safeSkillName, file.path, file.content);
      }
    } catch (writeErr) {
      try {
        await removeSkill(skillsDir, safeSkillName);
      } catch {}
      throw writeErr;
    }

    const meta = parseSkillFrontmatter(skillMdFile.content);
    manifest.skills[safeSkillName] = {
      name: safeSkillName,
      description: meta.description || '',
      source: resolvedSource,
      installedAt: new Date().toISOString(),
      updatedAt: null,
      files: files.map((f) => f.path)
    };
    await writeManifest(skillsDir, manifest);

    spinner.succeed(
      `Installed ${chalk.green(safeSkillName)} → ${chalk.dim(displayPath(skillsDir + '/' + safeSkillName))}`
    );
    if (meta.description) {
      const preview = meta.description.replace(/\n/g, ' ').slice(0, 90);
      console.log(
        chalk.dim(`  ${preview}${meta.description.length > 90 ? '…' : ''}`)
      );
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow(`\n  Validation warnings:`));
      warnings.forEach((w) => console.log(chalk.yellow(`  ! ${w}`)));
    }

    console.log(
      chalk.dim(
        `\n  Files installed: ${files.length} (${files.map((f) => f.path).join(', ')})`
      )
    );
  } catch (err) {
    spinner.fail(err.message);
    process.exit(1);
  }
}
