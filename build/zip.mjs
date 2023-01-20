import JSZip from "jszip";
import {readdir, readFile} from 'node:fs/promises';
import {createWriteStream, existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';

const version = process.argv[2];

if (!version) {
  process.stderr.write('Version arg not provided\n');
  process.exit(1);
}

const zip = new JSZip();

await Promise.all([
  readdir('src', 'utf8')
    .then(async files => {
      const promises$ = files
        .map(async file => {
          zip.file(file, await readFile(join('src', file)));
        });

      await Promise.all(promises$);
    }),
  readFile('LICENSE').then(v => zip.file('LICENSE', v)),
]);

const outPath = join('dist', `melvor-auto-township-cape-${version}.zip`);

if (existsSync('dist')) {
  if (existsSync(outPath)) {
    unlinkSync(outPath);
  }
} else {
  mkdirSync('dist');
}

if (!existsSync('dist')) {
  mkdirSync('dist');
}

zip
  .generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: {level: 9},
    type: 'nodebuffer',
  })
  .pipe(createWriteStream(outPath))
  .once('error', e => {
    process.stderr.write(e.stack);
    process.stderr.write('\n');
    process.exit(1);
  })
  .once('close', () => {
    for (const f of Object.keys(zip.files)) {
      console.log(f);
    }
  });
