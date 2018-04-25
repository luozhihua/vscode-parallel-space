/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:36
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-25 03:43:57
 */
// import * as fs from 'fs';
import * as mm from 'micromatch';
import * as walker from 'klaw-sync';
import { config, SCRIPT, STYLE, TEMPLATE } from '../config';
import Member, { MemberFiles } from './member-base';
import {} from './document';

export default class MemberCrossMode extends Member {
  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    let availables: string[] = this.readFiles();
    let files: MemberFiles = {
      [SCRIPT]: [],
      [STYLE]: [],
      [TEMPLATE]: [],
      crossMode: true,
    };

    availables.forEach((path: string) => {
      let type: string = MemberCrossMode.getTypeByPath(path);

      files[type].push(path);
    });

    return files as MemberFiles;
  }

  private readFiles(): string[] {
    let {
      scriptDirs,
      styleDirs,
      templateDirs,
      scriptExts,
      styleExts,
      templateExts,
      componentDirs,
    } = config;
    let dirs = [
      ...scriptDirs,
      ...styleDirs,
      ...templateDirs,
      ...componentDirs,
    ].join(',');
    let exts = [...scriptExts, ...styleExts, ...templateExts].join(',');
    let excludes = ['node_modules', '.*'].join(',');
    let filter: walker.Filter = (item: walker.Item): boolean => {
      return (
        !mm.isMatch(item.path, `**/{${excludes}}{s,}/**`) &&
        mm.isMatch(item.path, `**/{${dirs}}{s,}/**/*{${exts}}`)
      );
    };

    return walker(this.root, { filter }).map(item => item.path);
  }
}
