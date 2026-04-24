import chalk from 'chalk';
import ora from 'ora';
import { fetchGitHubSkill } from '../lib/fetch-skill.js';
import {
  readManifest,
  writeManifest,
  removeSkill,
  writeSkillFile,
  validateSkillMd
} from '../lib/skills.js';
import { resolveSkillsPath } from '../lib/paths.js';

export async function updateCommand(nameArg, options) {
  const skillsDir = resolveSkillsPath(options.path);
  const manifest = await readManifest(skillsDir);
  const skillNames = Object.keys(manifest.skills);

  if (skillNames.length === 0) {
    console.log(chalk.yellow('No skills installed.'));
    return;
  }

  const updateAll = options.all;

  if (!updateAll && !nameArg) {
    console.error(
      chalk.red('Specify a skill name or pass --all to update everything.')
    );
    console.log(chalk.dim('  copilot-skills update <name>'));
    console.log(chalk.dim('  copilot-skills update --all'));
    process.exit(1);
  }

  if (!updateAll) {
    if (!manifest.skills[nameArg]) {
      console.error(chalk.red(`Skill "${nameArg}" is not installed`));
      process.exit(1);
    }
    await updateOne(nameArg, skillsDir, manifest);
  } else {
    console.log(
      chalk.bold(
        `\nUpdating ${skillNames.length} skill${skillNames.length === 1 ? '' : 's'}…\n`
      )
    );
    let updated = 0,
      skipped = 0,
      failed = 0;

    for (const name of skillNames) {
      const ok = await updateOne(name, skillsDir, manifest);
      if (ok === true) updated++;
      else if (ok === false) failed++;
      else skipped++;
    }

    console.log('');
    console.log(
      `  ${chalk.green(updated)} updated, ${chalk.yellow(skipped)} skipped, ${failed > 0 ? chalk.red(failed) : '0'} failed`
    );
  }

  await writeManifest(skillsDir, manifest);
}

async function updateOne(name, skillsDir, manifest) {
  const spinner = ora(`  ${name}`).start();
  const entry = manifest.skills[name];
  const source = entry?.source;

  if (!source || source.type !== 'github') {
    spinner.warn(`${name}: skipped (local install — no remote source)`);
    return null;
  }

  try {
    const { files } = await fetchGitHubSkill(source);

    const skillMd = files.find((f) => f.path === 'SKILL.md');
    if (!skillMd) {
      spinner.fail(
        `  ${name}: upstream SKILL.md missing — skipping to avoid data loss`
      );
      return false;
    }
    const warnings = validateSkillMd(skillMd.content);
    if (warnings.some((w) => w.includes('Missing YAML frontmatter'))) {
      spinner.fail(
        `  ${name}: upstream SKILL.md is invalid — skipping to avoid data loss`
      );
      return false;
    }

    await removeSkill(skillsDir, name);
    try {
      for (const file of files) {
        await writeSkillFile(skillsDir, name, file.path, file.content);
      }
    } catch (writeErr) {
      try {
        await removeSkill(skillsDir, name);
      } catch {
        /* ignore */
      }
      throw writeErr;
    }

    manifest.skills[name].updatedAt = new Date().toISOString();
    manifest.skills[name].files = files.map((f) => f.path);

    spinner.succeed(`  ${chalk.green(name)}`);
    return true;
  } catch (err) {
    spinner.fail(`  ${name}: ${err.message}`);
    return false;
  }
}
