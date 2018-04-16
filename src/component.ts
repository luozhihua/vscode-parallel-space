/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:39
 * @Last Modified by:   Colin Luo
 * @Last Modified time: 2018-04-17 06:30:39
 */
import { ComponentFiles } from './component';
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mm from 'micromatch';

export interface ComponentFiles {
  script?: string[];
  template?: string[];
  style?: string[];
  completed?: boolean;
}

interface ParsedUri {
  ext: string;
  name: string;
  base: string;
  dir: string;
  folder: string;
  fullpath: string;
}

export default abstract class Component {
  public static createId(str: string): string {
    let hash = crypto.createHash('md5');
    hash.update(str);

    return hash.digest('hex');
  }

  constructor(uri: string) {
    this.uri = uri.replace(/^file:\/\//, '');
    this.id = Component.createId(this.uri);
  }

  abstract open(): void;

  /**
   * @description 表示组件位置的URI
   * @private
   * @type {string}
   * @memberof Component
   */
  protected readonly uri: string;

  /**
   * @description 组件ID
   * @private
   * @type {string}
   * @memberof Component
   */
  public readonly id: string;

  /**
   * @description 是否是脚本文件
   * @private
   * @returns {boolean}
   * @memberof Component
   */
  private isScript(): boolean {
    return mm.any(this.uri, `**/*{${config.scriptExtnames.join(',')}}`);
    // let parsed: ParsedUri = this.parseUri(this.uri);

    // return mm.any(parsed.base, config.scriptExtnames);
  }

  /**
   * @description 是否是样式文件
   * @private
   * @returns {boolean}
   * @memberof Component
   */
  private isStyle(): boolean {
    return mm.any(this.uri, `**/*{${config.styleExtnames.join(',')}}`);
    // let parsed: ParsedUri = this.parseUri(this.uri);

    // return mm.any(parsed.base, config.styleExtnames);
  }

  /**
   * @description 是否是模板文件
   * @private
   * @returns {Boolean}
   * @memberof Component
   */
  private isTemplate(): Boolean {
    return mm.any(this.uri, `**/*{${config.templateExtnames.join(',')}}`);
    // let parsed: ParsedUri = this.parseUri(this.uri);

    // return mm.any(parsed.base, config.templateExtnames);
  }

  /**
   * @description 读取正在编辑的文件的指定类型的同级文件列表
   * @private
   * @param {string[]} types
   * @returns {string[]}
   * @memberof Component
   */
  private readSiblingFiles(types: string[] = []): string[] {
    let dir = this.uri.replace(/[\\\/][^\.\/\\]+\.\w+$/, '');
    let files: string[] = fs.readdirSync(dir);
    let pattern: string[] = [];

    // 根据types过滤文件
    if (types.length > 0) {
      types.forEach(type => {
        pattern = pattern.concat(config.extnames[type]);
      });

      files = files.filter(file => {
        return mm.any(file, `**/*{${pattern}}`);
      });
    }

    files = files.map(file => {
      return `${dir}/${file}`;
    });

    return files;
  }

  /**
   * @description 格式化URI为对象
   * @private
   * @param {string} uri
   * @returns {ParsedUri}
   * @memberof Component
   */
  private parseUri(uri: string): ParsedUri {
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

  /**
   * @description 返回按匹配度排序的文件，匹配度越大排位越前, 如第0个的匹配度是最佳的: 0 > 1 > 2
   * @private
   * @param {string} type
   * @param {string[]} siblings
   * @returns {string[]}
   * @memberof Component
   */
  private getMatchFileOfWeight(type: string, siblings: string[]): string[] {
    let self: ParsedUri = this.parseUri(this.uri);

    // 仅有一个指定类型的文件，则直接取这一个文件
    if (siblings.length === 1) {
      return siblings;
    } else {
      // 含有多个指定类型的文件，则按匹配度查找
      let weight1: string[] = [];
      let weight2: string[] = [];
      let weight3: string[] = [];
      let files: ParsedUri[] = [...siblings].map(file => {
        return this.parseUri(file);
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
   * @memberof Component
   */
  private getScript(): string[] {
    const TYPE = 'script';
    let siblings: string[] = this.readSiblingFiles([TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  /**
   * @description 获取组件相关的样式文件
   * @private
   * @returns {string[]}
   * @memberof Component
   */
  private getStyle(): string[] {
    const TYPE = 'style';
    let siblings: string[] = this.readSiblingFiles([TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  /**
   * @description 获取组件相关的模板文件
   * @private
   * @returns {string[]}
   * @memberof Component
   */
  private getTemplate(): string[] {
    const TYPE = 'template';
    let siblings: string[] = this.readSiblingFiles([TYPE]);

    return this.getMatchFileOfWeight(TYPE, siblings);
  }

  public componentFiles: ComponentFiles = {};
  /**
   * @description 返回构成组件的各类型文件（包含脚本、样式、模板文件）
   * @returns {ComponentFiles}
   * @memberof Component
   */
  public getComponentFiles(): ComponentFiles {
    let files: ComponentFiles = this.componentFiles;

    if (!files.completed) {
      if (this.isScript()) {
        files.script = [this.uri];
        files.style = this.getStyle();
        files.template = this.getTemplate();
      }

      if (this.isTemplate()) {
        files.template = [this.uri];
        files.style = this.getStyle();
        files.script = this.getScript();
      }

      if (this.isStyle()) {
        files.template = [this.uri];
        files.template = this.getTemplate();
        files.script = this.getScript();
      }

      files.completed = true;
    }

    return files;
  }
}
