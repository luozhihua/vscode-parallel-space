/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 03:50:06
 */

// import * as fs from 'fs';
// import * as mm from 'micromatch';
// import { config } from '../config';
import Member, { CandidateFiles } from './member';

export default class MemberSplitMode extends Member {
  constructor(uri: string) {
    super(uri);
  }

  protected async getCandidates(): Promise<CandidateFiles> {
    return new Promise<CandidateFiles>(() => {
      let files: CandidateFiles = {
        commonPath: 'sss',
      };

      return files;
    });
  }
}
