/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-05-31 02:02:56
 */
import * as fs from 'fs';
import { SCRIPT, STYLE, TEMPLATE, TYPES, DocType } from '../config';
import { IPath } from './utils';
import { MemberFiles } from './members-base';
import MembersSiblingMode from './members-sibling';
import VueSpliter from './vue-spliter';

export interface LangID {
  [key: string]: string;
  [SCRIPT]: string;
  [STYLE]: string;
  [TEMPLATE]: string;
}

export interface Member {
  [key: string]: any;
  path: string;
  type: DocType;
  id: string;
  isClosed?: boolean;
}

export default class MembersSplitMode extends MembersSiblingMode {
  public spliter: VueSpliter | undefined;

  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    if (MembersSplitMode.isSplitMode(this.path)) {
      let files: any = {
        splitMode: true,
      };

      this.spliter = this.spliter || new VueSpliter(this.root, this.path);
      this.spliter.split();

      TYPES.forEach(type => {
        if (this.spliter) {
          files[type] = [this.spliter[type]];
        }
      });

      return files as MemberFiles;
    } else {
      return super.getCandidates();
    }
  }

  static getMainFileBySplitedFile(path: string): string {
    let subpath = IPath.parse(path).dir + '/.path';
    let mainFile;

    if (fs.existsSync(subpath)) {
      mainFile = fs.readFileSync(subpath, 'utf-8');
    }
    return mainFile ? mainFile.trim() : '';
  }
}
