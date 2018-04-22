/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:44
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 06:42:35
 */
import * as crypto from 'crypto';
import * as path from 'path';
// import * as mm from 'micromatch';
// import { config } from '../config';

export interface ParsedUri {
  ext: string;
  name: string;
  base: string;
  dir: string;
  folder: string;
  fullpath: string;
}

export enum DocumentType {
  SCRIPT = 'script',
  STYLE = 'style',
  TEMPLATE = 'template',
}

export default class Document {
  constructor(type: DocumentType, uri: string) {
    this.type = type;
    this.uri = uri;
    this.id = Document.createId(uri);
  }

  public isClosed: boolean = true;
  public readonly type: DocumentType;
  public readonly uri: string;
  public readonly id: string;

  public static createId(str: string): string {
    let hash = crypto.createHash('md5');
    hash.update(str);

    return hash.digest('hex');
  }

  /**
   * @description 格式化URI为对象
   * @private
   * @param {string} uri
   * @returns {ParsedUri}
   * @memberof Component
   */
  static parseUri(uri: string): ParsedUri {
    let { ext, name, dir, base } = path.parse(uri);
    let folder: string = dir.split(/[\\\/]/g).pop() || '';
    let uriParts: ParsedUri = {
      ext,
      name,
      base,
      dir,
      folder,
      fullpath: `${dir}/${base}`,
    };

    return uriParts;
  }
}
