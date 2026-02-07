import { vi } from 'vitest';

/**
 * Mock file system for testing
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  /**
   * Writes a file to the mock file system
   */
  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  /**
   * Reads a file from the mock file system
   */
  readFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  /**
   * Checks if a file exists
   */
  exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  /**
   * Creates a directory
   */
  mkdir(path: string): void {
    this.directories.add(path);
  }

  /**
   * Lists files in a directory
   */
  readdir(path: string): string[] {
    const files: string[] = [];
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(path + '/')) {
        const relativePath = filePath.substring(path.length + 1);
        if (!relativePath.includes('/')) {
          files.push(relativePath);
        }
      }
    }
    return files;
  }

  /**
   * Removes a file
   */
  unlink(path: string): void {
    this.files.delete(path);
  }

  /**
   * Removes a directory
   */
  rmdir(path: string): void {
    this.directories.delete(path);
  }

  /**
   * Clears all files and directories
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  /**
   * Gets all files
   */
  getAllFiles(): Map<string, string> {
    return new Map(this.files);
  }
}

/**
 * Creates mocked fs/promises module
 */
export function createMockFsPromises(mockFs: MockFileSystem) {
  return {
    readFile: vi.fn((path: string) => Promise.resolve(mockFs.readFile(path))),
    writeFile: vi.fn((path: string, content: string) => {
      mockFs.writeFile(path, content);
      return Promise.resolve();
    }),
    mkdir: vi.fn((path: string) => {
      mockFs.mkdir(path);
      return Promise.resolve();
    }),
    readdir: vi.fn((path: string) => Promise.resolve(mockFs.readdir(path))),
    stat: vi.fn((path: string) => {
      if (!mockFs.exists(path)) {
        return Promise.reject(new Error(`ENOENT: no such file or directory, stat '${path}'`));
      }
      return Promise.resolve({
        isFile: () => mockFs.getAllFiles().has(path),
        isDirectory: () => !mockFs.getAllFiles().has(path),
      });
    }),
    unlink: vi.fn((path: string) => {
      mockFs.unlink(path);
      return Promise.resolve();
    }),
    rm: vi.fn((path: string) => {
      mockFs.unlink(path);
      return Promise.resolve();
    }),
  };
}
