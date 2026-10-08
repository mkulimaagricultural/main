import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const directory of ['assets', 'admin']) {
  await cp(join(root, directory), join(dist, directory), { recursive: true });
}
await mkdir(join(dist, 'assets', 'vendor', 'tabler'), { recursive: true });
await cp(join(root, 'node_modules', '@tabler', 'core', 'dist', 'css', 'tabler.min.css'), join(dist, 'assets', 'vendor', 'tabler', 'tabler.min.css'));
for (const filename of ['index.html', '_routes.json']) {
  await writeFile(join(dist, filename), await readFile(join(root, filename)));
}

console.log('Built public site in dist/');
