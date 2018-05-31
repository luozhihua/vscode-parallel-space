/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:32
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-05-12 09:20:38
 */
import * as path from 'path';
import * as mm from 'micromatch';
import * as walker from 'klaw-sync';
import { config, SCRIPT, STYLE, TEMPLATE } from '../config';
import { MemberFiles } from './members-base';
import MembersCrossMode from './members-cross';

export default class MembersSiblingMode extends MembersCrossMode {
  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    let root = this.path.replace(/\/[^\/]+\.(\w+)$/, '');
    let { scriptExts, styleExts, templateExts } = config;
    let exts = [...scriptExts, ...styleExts, ...templateExts];
    let paterns = `*{${exts.join(',')}}`;
    let filter: walker.Filter = (item: walker.Item) => {
      return mm.isMatch(item.path, paterns, { matchBase: true });
    };
    let availables: string[] = walker(root, { filter }).map(item => item.path);
    let files: MemberFiles = {
      commonPath: root,
      [SCRIPT]: [],
      [STYLE]: [],
      [TEMPLATE]: [],
    };

    this.getClearFiles(availables).forEach((path: string) => {
      let type: string = MembersSiblingMode.getTypeByPath(path);

      files[type].push(path);
    });

    // 统计匹配文件为0的member数量
    let emptyCount = [files[SCRIPT], files[STYLE], files[TEMPLATE]].reduce((res, cur) => {
      return res + (cur ? Math.max(0, 1 - cur.length) : 0);
    }, 0);

    if (emptyCount > 1) {
      return super.getCandidates();
    } else {
      return files as MemberFiles;
    }
  }

  groupByFilename(files: string[]): any {
    let groups: any = {};

    files.forEach(file => {
      let uri = path.parse(file);

      groups[uri.name] = groups[uri.name] || [];
      groups[uri.name].push(file);
    });

    return groups;
  }

  getClearFiles(files: string[]): string[] {
    let groups = this.groupByFilename(files);
    let mainPath = path.parse(this.path);
    let keys = Object.keys(groups);
    let spreads: any = [];
    let dist: string[] = [];

    if (keys.length === 0) {
      dist = groups[keys[0]];
    } else {
      keys.forEach(key => {
        if (key === mainPath.name) {
          dist = groups[key];
        }
        spreads.push(...groups[key]);
      });
    }

    if (dist.length < 2 && this.isSpecificName(mainPath.name)) {
      spreads.forEach((file: string) => {
        let uri = path.parse(file);

        if (this.isSpecificName(uri.name)) {
          dist.push(file);
        }
      });
    }

    return dist;
  }

  isSpecificName(filename: string): boolean {
    return /(index|style|css|template|script|controller|ctrl|page)s?$/.test(filename);
  }
}
