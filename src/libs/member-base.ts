// import * as fs from 'fs';
import * as mm from 'micromatch';
import { config, DocType, SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import { IPath } from './utils';
import Document from './document';

export interface MemberFiles {
  [key: string]: any;
  crossMode?: boolean;
  splitMode?: boolean;
  [SCRIPT]: string[];
  [STYLE]: string[];
  [TEMPLATE]: string[];
}

export interface DocumentMap {
  [key: string]: Document | undefined;
  [SCRIPT]: Document | undefined;
  [STYLE]: Document | undefined;
  [TEMPLATE]: Document | undefined;
}

export default abstract class Member {
  public [SCRIPT]: string | undefined;
  public [STYLE]: string | undefined;
  public [TEMPLATE]: string | undefined;
  public documents: DocumentMap | undefined;
  public readonly files: MemberFiles;
  protected readonly root: string;
  protected readonly path: string;
  protected abstract getCandidates(): MemberFiles;

  constructor(root: string, path: string) {
    this.path = path;
    this.root = root;
    this.files = this.resolveFiles();

    TYPES.forEach(type => {
      this[type] = this.files[type][0];
    });
  }

  protected resolveFiles(): MemberFiles {
    let files: MemberFiles = this.getCandidates();
    let { script = [], style = [], template = [] } = files;
    let resolved: MemberFiles = {
      [SCRIPT]: [],
      [STYLE]: [],
      [TEMPLATE]: [],
    };
    let doubtless = [script, style, template].reduce((pre, cur) => {
      return pre && cur.length <= 1;
    }, true);

    if (doubtless || files.splitMode) {
      return files as MemberFiles;
    } else {
      TYPES.forEach(type => {
        resolved[type] = this.matchFileOfWeight(type, files[type] || []);
      });
      return resolved;
    }
  }

  /**
   * @description 返回按匹配度排序的文件，匹配度越大排位越前, 如第0个的匹配度是最佳的: 0 > 1 > 2
   * @param {string} type
   * @param {string[]} siblings
   * @returns {string[]}
   */
  private matchFileOfWeight(type: string, siblings: string[]): string[] {
    let self: IPath = IPath.parse(this.path);

    // 仅有一个指定类型的文件，则直接取这一个文件
    if (siblings.length === 1) {
      return siblings;
    } else {
      // 含有多个指定类型的文件，则按匹配度查找
      let weight1: string[] = [];
      let weight2: string[] = [];
      let weight3: string[] = [];
      let files: IPath[] = [...siblings].map(file => {
        return IPath.parse(file);
      });

      files.forEach((sibling: IPath) => {
        // 与打开的文件同名
        if (self.name === sibling.name) {
          if (self.name === self.folder) {
            // 并且与上级目录同名
            weight1.push(sibling.fullpath);
          } else {
            weight2.push(sibling.fullpath);
          }
        } else if (
          self.name === 'index' &&
          mm.isMatch(sibling.base, `{${type},${sibling.folder}}{s,}.*`, {
            nocase: true,
            dot: true,
          })
        ) {
          // index.js + btn.html | dir.html | other.html | btn.css
          // 打开的文件名为index.[*]时，其他文件如果
          weight3.push(sibling.fullpath);
        }
      });

      return weight1.concat(weight2).concat(weight3);
    }
  }

  /**
   * @description 是否是脚本文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isScript(uri: string): boolean {
    let exts = config.scriptExts.join(',');
    return mm.any(uri, `**/*{${exts}}`, { dot: true });
  }

  /**
   * @description 是否是样式文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isStyle(uri: string): boolean {
    let exts = config.styleExts.join(',');

    return mm.any(uri, `**/*{${exts}}`, { dot: true });
  }

  /**
   * @description 是否是模板文件
   * @param {String} URI of a Document
   * @returns {Boolean}
   */
  static isTemplate(uri: string): Boolean {
    let exts = config.templateExts.join(',');

    return mm.isMatch(uri, `**/*{${exts}}`, { dot: true });
  }

  public static getTypeByPath(uri: string): string {
    return Member.isScript(uri)
      ? (SCRIPT as DocType)
      : Member.isStyle(uri)
        ? (STYLE as DocType)
        : Member.isTemplate(uri)
          ? (TEMPLATE as DocType)
          : '';
  }
}
