/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 00:29:26
 */

import { SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import Parallel from './parallel';
import { MemberFiles } from './member-base';
import MemberSiblingMode from './member-sibling';
import VueSpliter from './vue-spliter';

export interface LangID {
  [key: string]: string;
  [SCRIPT]: string;
  [STYLE]: string;
  [TEMPLATE]: string;
}

export default class MemberSplitMode extends MemberSiblingMode {
  public spliter: VueSpliter | undefined;

  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    if (Parallel.isSplitMode(this.path)) {
      let files: any = {
        splitMode: true,
      };

      this.spliter = this.spliter || new VueSpliter(this.root, this.path);

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
}
