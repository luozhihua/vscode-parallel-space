import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import {
  EventEmitter,
  Uri,
  Disposable,
  FileSystemProvider,
  Event,
  FileChangeEvent,
  FileType,
  FileChangeType,
  FileStat as Stat,
} from 'vscode';

/**
 * @description FileStatue
 * @class FileStat
 * @implements {Stat}
 */
export class FileStat implements Stat {
  constructor(private fsStat: fs.Stats) {}

  get type(): FileType {
    return this.fsStat.isFile()
      ? FileType.File
      : this.fsStat.isDirectory()
        ? FileType.Directory
        : this.fsStat.isSymbolicLink()
          ? FileType.SymbolicLink
          : FileType.Unknown;
  }

  get isFile(): boolean | undefined {
    return this.fsStat.isFile();
  }

  get isDirectory(): boolean | undefined {
    return this.fsStat.isDirectory();
  }

  get isSymbolicLink(): boolean | undefined {
    return this.fsStat.isSymbolicLink();
  }

  get size(): number {
    return this.fsStat.size;
  }

  get ctime(): number {
    return this.fsStat.ctime.getTime();
  }

  get mtime(): number {
    return this.fsStat.mtime.getTime();
  }
}

export function normalizeNFC(items: string): string;
export function normalizeNFC(items: string[]): string[];
export function normalizeNFC(items: string | string[]): string | string[] {
  if (process.platform !== 'darwin') {
    return items;
  }

  if (Array.isArray(items)) {
    return items.map(item => item.normalize('NFC'));
  }

  return items.normalize('NFC');
}

type WatchOptions = {
  recursive: boolean;
  excludes: string[];
};

export class ParallelFS implements FileSystemProvider {
  readonly _onDidChangeFile: EventEmitter<FileChangeEvent[]> = new EventEmitter<FileChangeEvent[]>();

  constructor() {}

  get onDidChangeFile(): Event<FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  public watch(uri: Uri, options: WatchOptions): Disposable {
    const watcher = fs.watch(uri.fsPath, options, async (event: string, filename: string | Buffer) => {
      const filepath = path.join(uri.fsPath, normalizeNFC(filename.toString()));
      let emitter = this._onDidChangeFile;
      let type =
        event === 'change'
          ? FileChangeType.Changed
          : fs.existsSync(filepath)
            ? FileChangeType.Created
            : FileChangeType.Deleted;

      let events = {
        type: type,
        uri: uri.with({ path: filepath }),
      };

      emitter.fire([events as FileChangeEvent]);
    });

    return {
      dispose: () => watcher.close(),
    };
  }

  stat(uri: Uri) {
    return new FileStat(fs.statSync(uri.fsPath));
  }

  readDirectory(uri: Uri) {
    const result: [string, FileType][] = [];

    if (fs.existsSync(uri.path)) {
      const children = fs.readdirSync(uri.fsPath);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const stat = new FileStat(fs.statSync(path.join(uri.fsPath, child)));
        result.push([`${uri.fsPath}/${child}`, stat.type]);
      }
    }

    return Promise.resolve(result);
  }

  createDirectory(uri: Uri): void {
    mkdirp.sync(uri.path);
  }

  readFile(uri: Uri): Uint8Array {
    return fs.readFileSync(uri.path);
  }

  writeFile(uri: Uri, content: Uint8Array): void {
    fs.writeFileSync(uri.path, content);
  }

  delete(uri: Uri): void {
    fs.unlinkSync(uri.path);
  }

  rename(oldUri: Uri, newUri: Uri): void {
    fs.renameSync(oldUri.path, newUri.path);
  }

  copy(source: Uri, destination: Uri): void {
    fs.copyFileSync(source.path, destination.path);
  }
}
