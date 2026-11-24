/**
 * Source-text guards for the local-first slice: the dead sync layer stays gone and
 * the Privacy screen makes no claim the app can't back up.
 */
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}

describe('local-first start', () => {
  const files = [...sourceFiles(path.join(root, 'src')), path.join(root, 'App.tsx')];

  it.each(['services/cloudSync', 'services/sqlite', './sqlite', './cloudSync', 'Step2Auth', 'expo-sqlite'])(
    'nothing imports %s',
    (name) => {
      const bare = name.replace(/^\.\//, '');
      const offenders = files.filter((f) => {
        const src = fs.readFileSync(f, 'utf8');
        return src.includes(`'${name}'`) || src.includes(`/${bare}'`);
      });
      expect(offenders).toEqual([]);
    },
  );

  it('ships without expo-sqlite', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.dependencies['expo-sqlite']).toBeUndefined();
    expect(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).not.toContain('expo-sqlite');
  });

  it('Privacy screen makes no false claims', () => {
    const privacy = fs.readFileSync(
      path.join(root, 'src/components/PrivacyScreen/PrivacyScreen.tsx'),
      'utf8',
    );
    for (const claim of ['transparency report', 'secure enclave', 'SQLite', 'Cloud backup']) {
      expect(privacy).not.toContain(claim);
    }
  });
});
