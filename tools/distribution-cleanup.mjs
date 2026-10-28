import fs from 'node:fs';
import path from 'node:path';

// Sources and resources already use their portable runtime paths. The build
// preserves those bytes; resource loaders retain their own integrity checks.
export function distributionCleanupPlugin() {
  let root;
  return {
    name: 'portable-distribution-integrity',
    apply: 'build',
    configResolved(config) { root = config.root; },
    writeBundle: {
      order: 'post', sequential: true,
      handler(options) {
        const output = path.resolve(root, options.dir || 'dist');
        let files = 0;
        const visit = directory => {
          for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
            const absolute = path.join(directory, item.name);
            if (item.isSymbolicLink()) throw new Error('Portable output must not contain symlinks');
            if (item.isDirectory()) visit(absolute);
            else if (item.isFile()) files++;
          }
        };
        visit(output);
        this.info(`Portable distribution checked: ${files} files`);
      }
    }
  };
}
