import * as fs from 'fs';
import { EventEmitter as Events } from 'events';
import * as mm from 'micromatch';
import { config } from '../config';
import {
  default as Document,
  DocumentType as DocType,
  ParsedUri,
} from './document';

export interface MemberFiles {
  [key: string]: any;
  [DocType.SCRIPT]?: string[];
  [DocType.STYLE]?: string[];
  [DocType.TEMPLATE]?: string[];
}

export interface CandidateFiles extends MemberFiles {
  commonPath: string;
  crossMode?: boolean;
  splitMode?: boolean;
}

export default abstract class Member extends Events {
  constructor(uri: string) {
    super();
    this.uri = uri;
    this.resolve().then((files: MemberFiles) => {
      let { script = [], style = [], template = [] } = files;

      this.script = script[0];
      this.style = style[0];
      this.template = template[0];

      this.emit('resolved', files);
    });
  }

  public script: string | undefined;
  public style: string | undefined;
  public template: string | undefined;
  protected readonly uri: string;
  protected abstract async getCandidates(): Promise<CandidateFiles>;

  protected async resolve(): Promise<MemberFiles> {
    let files: CandidateFiles = await this.getCandidates();
    let { script = [], style = [], template = [] } = files;
    let resolved: MemberFiles = {};

    if (files.crossMode || files.splitMode) {
      return files as MemberFiles;
    } else if (
      script.length === 1 &&
      style.length === 1 &&
      template.length === 1
    ) {
      return files as MemberFiles;
    } else {
      resolved[DocType.SCRIPT] = this.getMatchFileOfWeight(
        DocType.SCRIPT,
        files[DocType.SCRIPT] || [],
      );
      resolved[DocType.STYLE] = this.getMatchFileOfWeight(
        DocType.STYLE,
        files[DocType.STYLE] || [],
      );
      resolved[DocType.TEMPLATE] = this.getMatchFileOfWeight(
        DocType.TEMPLATE,
        files[DocType.TEMPLATE] || [],
      );
      return resolved;
    }
  }

  /**
   * @description 读取正在编辑的文件的指定类型的同级文件列表
   * @private
   * @param {string[]} types
   * @returns {string[]}
   */
  private readSiblingFiles(dir: string, types: string[] = []): string[] {
    let root = dir.replace(/\/[^\/]+.\w+$/, '');
    let files: string[] = fs.readdirSync(root);
    let pattern: string[] = [];

    // 根据types过滤文件
    if (types.length > 0) {
      types.forEach(type => {
        pattern = pattern.concat(config.exts[type]);
      });

      files = files.filter(file => {
        return mm.any(file, `**/*{${pattern}}`);
      });
    }

    files = files.map(file => {
      return `${root}/${file}`;
    });

    return files;
  }

  /**
   * @description 返回按匹配度排序的文件，匹配度越大排位越前, 如第0个的匹配度是最佳的: 0 > 1 > 2
   * @param {string} type
   * @param {string[]} siblings
   * @returns {string[]}
   */
  private getMatchFileOfWeight(type: string, siblings: string[]): string[] {
    let self: ParsedUri = Document.parseUri(this.uri);

    // 仅有一个指定类型的文件，则直接取这一个文件
    if (siblings.length === 1) {
      return siblings;
    } else {
      // 含有多个指定类型的文件，则按匹配度查找
      let weight1: string[] = [];
      let weight2: string[] = [];
      let weight3: string[] = [];
      let files: ParsedUri[] = [...siblings].map(file => {
        return Document.parseUri(file);
      });

      files.forEach((sibling: ParsedUri) => {
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
          mm.isMatch(sibling.base, `*{${type},${sibling.folder}}*.*`, {
            nocase: true,
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
   * @description 获取组件相关的脚本文件
   * @private
   * @returns {string[]}
   */
  public getMemberFiles(): MemberFiles {
    let files: MemberFiles = {};

    files.script = this.getScript();
    files.style = this.getStyle();
    files.template = this.getTemplate();

    return files;
  }

  /**
   * @description 获取组件相关的脚本文件
   * @private
   * @returns {string[]}
   */
  public getScript(): string[] {
    const TYPE = 'script';
    let siblings: string[] = this.readSiblingFiles(this.uri, [TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  /**
   * @description 获取组件相关的样式文件
   * @public
   * @returns {string[]}
   */
  public getStyle(): string[] {
    const TYPE = 'style';
    let siblings: string[] = this.readSiblingFiles(this.uri, [TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  /**
   * @description 获取组件相关的模板文件
   * @public
   * @returns {string[]}
   */
  public getTemplate(): string[] {
    const TYPE = 'template';
    let siblings: string[] = this.readSiblingFiles(this.uri, [TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  /**
   * @description 是否是脚本文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isScript(uri: string): boolean {
    return mm.any(uri, `**/*{${config.scriptExts.join(',')}}`);
  }

  /**
   * @description 是否是样式文件
   * @param {String} URI of a Document
   * @returns {boolean}
   */
  static isStyle(uri: string): boolean {
    return mm.any(uri, `**/*{${config.styleExts.join(',')}}`);
  }

  /**
   * @description 是否是模板文件
   * @param {String} URI of a Document
   * @returns {Boolean}
   */
  static isTemplate(uri: string): Boolean {
    return mm.any(uri, `**/*{${config.templateExts.join(',')}}`);
  }

  public static getTypeByUri(uri: string): string {
    return Member.isScript(uri)
      ? DocType.SCRIPT
      : Member.isStyle(uri)
        ? DocType.STYLE
        : Member.isTemplate(uri)
          ? DocType.TEMPLATE
          : '';
  }

  public static getExtPatternsByType(type: string): string[] {
    let exts: string[];

    switch (type) {
      case DocType.SCRIPT:
        exts = config.scriptExts;
        break;
      case DocType.STYLE:
        exts = config.styleExts;
        break;
      case DocType.TEMPLATE:
        exts = config.templateExts;
        break;
      default:
        exts = [];
    }

    return exts;
  }

  public static getDirPatternsByType(type: string): string[] {
    let dirs: string[];

    switch (type) {
      case DocType.SCRIPT:
        dirs = config.scriptDirs;
        break;
      case DocType.STYLE:
        dirs = config.styleDirs;
        break;
      case DocType.TEMPLATE:
        dirs = config.templateDirs;
        break;
      default:
        dirs = [];
    }

    return dirs;
  }
}
