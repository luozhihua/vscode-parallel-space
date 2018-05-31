import { MemberFiles } from './members-base';
import * as mm from 'micromatch';
import * as path from 'path';
import * as commondir from 'commondir';
import { config, DocType, SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import { IPath } from './utils';

export const store: any = {};

export interface MemberFiles {
  [key: string]: any;
  crossMode?: boolean;
  splitMode?: boolean;
  [SCRIPT]: string[];
  [STYLE]: string[];
  [TEMPLATE]: string[];
}

export interface MemberFilesX {
  [key: string]: any;
  mode: string;
  files: string[];
}

export default abstract class Members {
  public [SCRIPT]: DocType;
  public [STYLE]: DocType;
  public [TEMPLATE]: DocType;
  public readonly files: MemberFiles;
  protected readonly root: string;
  protected readonly path: string;
  protected abstract getCandidates(): MemberFiles;

  constructor(root: string, path: string) {
    let grouped = store[path];

    this.path = path;
    this.root = root;
    this.files = grouped || this.resolveFiles();

    if (!grouped) {
      TYPES.forEach(type => {
        store[path] = store[path] || {};
        store[path][type] = this.files[type][0] as DocType;

        this[type] = this.files[type][0] as DocType;
      });
    }
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
          // 打开的文件名为index.[*]时，其他文件如果 weight3.push(sibling.fullpath);
        }
      });

      return weight1.concat(weight2).concat(weight3);
    }
  }

  /**
   * 过滤掉与被点击文件不相关的文件
   */
  protected filter(files: string[]): string[] {
    let pathname = this.getReversePathname(this.path);

    return files.reduce((result: string[], file) => {
      let shortPath = this.getReversePathname(file);

      if (commondir([pathname, shortPath]) !== path.posix.sep) {
        result.push(file);
      }

      return result;
    }, []);
  }

  /**
   * 获取路径并反转路径，以便于比较是否具有相同的相对路径
   */
  private getReversePathname(filepath: string): string {
    return (
      path.posix.sep +
      filepath
        .replace(/\.(\w+)$/, '')
        .split(path.posix.sep)
        .reverse()
        .join(path.posix.sep)
    );
  }

  /**
   * @description 是否是脚本文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isScript(uri: string): boolean {
    let exts = config.scriptExts.join('|').replace(/\./g, '');

    return new RegExp(`\\\.(${exts})$`, 'i').test(uri);
  }

  /**
   * @description 是否是样式文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isStyle(uri: string): boolean {
    let exts = config.styleExts.join('|').replace(/\./g, '');

    return new RegExp(`\\\.(${exts})$`, 'i').test(uri);
  }

  /**
   * @description 是否是模板文件
   * @param {String} URI of a Document
   * @returns {Boolean}
   */
  static isTemplate(uri: string): Boolean {
    let exts = config.templateExts.join('|').replace(/\./g, '');

    return new RegExp(`\\\.(${exts})$`, 'i').test(uri);
  }

  // static getMembersByPath(dir: string): MemberFiles[] {
  //   let files = fs.readdirSync(dir);
  //   let groups: any = [];

  //   files.forEach((file: string) => {
  //     let members = store[file];

  //     if (members) {
  //       groups.push(members);
  //     }
  //   });

  //   return groups as MemberFiles[];
  // }

  public static getTypeByPath(uri: string): DocType {
    let type = Members.isScript(uri)
      ? (SCRIPT as DocType)
      : Members.isStyle(uri)
        ? (STYLE as DocType)
        : Members.isTemplate(uri)
          ? (TEMPLATE as DocType)
          : '';
    return type as DocType;
  }

  static isSplitedFile(path: string): boolean {
    return path.includes('/.vscodeparallel/components/');
  }

  static isSplitMode(path: string): boolean {
    let { isSplitSFC, sfcExts } = config;
    let exts = config
      .mergePatterns([], sfcExts)
      .join('|')
      .replace(/\./g, '');
    let isSFC = new RegExp(`\\\.(${exts})$`, 'i').test(path);
    let isSplited = Members.isSplitedFile(path);

    return isSFC && isSplitSFC && !isSplited;
  }
}
