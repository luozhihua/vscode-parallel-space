import * as path from 'path';

export interface IPath {
  ext: string;
  name: string;
  base: string;
  dir: string;
  folder: string;
  path: string;
  fullpath: string;
}

export class IPath {
  static parse(filepath: string): IPath {
    let { ext, name, dir, base } = path.parse(filepath);
    let folder: string = dir.split(/[\\\/]/g).pop() || '';
    let uriParts: IPath = {
      ext,
      name,
      base,
      dir,
      folder,
      path: `${dir}/${base}`,
      fullpath: `${dir}/${base}`,
    };

    return uriParts;
  }
}
