import * as path from 'path';
import * as fs from 'fs';

/**
 * Default directories to ignore when scanning.
 */
export const DEFAULT_IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  '_site',
  '_freeze',
  '.quarto',
  'out',
  '.vscode',
  '.idea',
]);

/**
 * Options for scanning files.
 */
export interface ScanOptions {
  /** Directories to ignore (defaults to DEFAULT_IGNORE_DIRS) */
  ignoreDirs?: Set<string>;
  /** Filter function for files (return true to include) */
  fileFilter?: (filePath: string, fileName: string) => boolean;
  /** Whether to scan recursively (default: true) */
  recursive?: boolean;
}

/**
 * Recursively scan a directory for files.
 * @param dir Directory to scan
 * @param options Scan options
 */
export function scanFiles(dir: string, options: ScanOptions = {}): string[] {
  const {
    ignoreDirs = DEFAULT_IGNORE_DIRS,
    fileFilter = () => true,
    recursive = true,
  } = options;

  const files: string[] = [];

  const scan = (currentDir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (recursive && !ignoreDirs.has(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        if (fileFilter(fullPath, entry.name)) {
          files.push(fullPath);
        }
      }
    }
  };

  scan(dir);
  return files;
}

/**
 * Find files with a specific name in a directory tree.
 * @param dir Directory to scan
 * @param fileName Name of file to find
 * @param ignoreDirs Directories to ignore
 */
export function findFilesByName(
  dir: string,
  fileName: string,
  ignoreDirs: Set<string> = DEFAULT_IGNORE_DIRS
): string[] {
  return scanFiles(dir, {
    ignoreDirs,
    fileFilter: (_, name) => name === fileName,
  });
}

/**
 * Find files with specific extensions in a directory tree.
 * @param dir Directory to scan
 * @param extensions Extensions to match (e.g., ['.qmd', '.md'])
 * @param ignoreDirs Directories to ignore
 */
export function findFilesByExtension(
  dir: string,
  extensions: string[],
  ignoreDirs: Set<string> = DEFAULT_IGNORE_DIRS
): string[] {
  const extSet = new Set(extensions.map(e => e.toLowerCase()));
  return scanFiles(dir, {
    ignoreDirs,
    fileFilter: (filePath) => extSet.has(path.extname(filePath).toLowerCase()),
  });
}

/**
 * Traverse directories upward from a start path to a root path.
 * @param startPath Starting directory or file path
 * @param rootPath Root directory to stop at
 * @yields Each directory path from start to root
 */
export function* traverseUpwards(startPath: string, rootPath: string): Generator<string> {
  let currentDir = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);

  while (currentDir.startsWith(rootPath) || currentDir === rootPath) {
    yield currentDir;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
}

/**
 * Safely read a file's contents.
 * @param filePath Path to the file
 * @returns File contents or null if read failed
 */
export function safeReadFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
