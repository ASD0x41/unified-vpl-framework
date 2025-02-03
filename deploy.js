import dotenv from 'dotenv';
dotenv.config();

import { rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync as exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildDir = join(__dirname, 'build');
const tempDir = join(__dirname, 'temp_deploy');

const deployRepoUrl = process.env.DEPLOY_REPO_URL;
const repoUrl = 'https://github.com/' + deployRepoUrl;

console.log('Cloning deployment repository...');
exec(`git clone ${repoUrl} ${tempDir}`);

console.log('Copying build files to deployment repository...');
rmSync(join(tempDir, '*'), { recursive: true, force: true });
cpSync(buildDir, tempDir, { recursive: true });

process.chdir(tempDir);

console.log('Pushing build to gh-pages...');
exec('git add .');
exec('git commit -m "Deploy to GitHub Pages"');
exec('git push origin master');

console.log('Cleaning up...');
rmSync(tempDir, { recursive: true, force: true });

console.log('Deployment successful!');