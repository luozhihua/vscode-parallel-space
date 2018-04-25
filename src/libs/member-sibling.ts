/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:32
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-25 03:48:30
 */
import * as mm from 'micromatch';
import * as walker from 'klaw-sync';
import { config, SCRIPT, STYLE, TEMPLATE } from '../config';
import { MemberFiles } from './member-base';
import MemberCrossMode from './member-cross';

export default class MemberSiblingMode extends MemberCrossMode {
  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    let root = this.path.replace(/\/[^\/]+.(\w+)$/, '');
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

    availables.forEach((path: string) => {
      let type: string = MemberSiblingMode.getTypeByPath(path);

      files[type].push(path);
    });

    // 统计匹配文件为0的member数量
    let emptyCount = [files[SCRIPT], files[STYLE], files[TEMPLATE]].reduce(
      (res, cur) => {
        return res + (cur ? Math.max(0, 1 - cur.length) : 0);
      },
      0,
    );

    if (emptyCount > 1) {
      return super.getCandidates();
    } else {
      return files as MemberFiles;
    }
  }
}
