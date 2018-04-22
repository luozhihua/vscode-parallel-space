/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:32
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 05:01:47
 */
import { workspace, Uri } from 'vscode';
import { config } from '../config';
import { CandidateFiles } from './member';
import MemberCrossMode from './member.cross';
import { DocumentType as DocType } from './document';

export default class MemberSiblingMode extends MemberCrossMode {
  constructor(uri: string) {
    super(uri);
  }

  protected async getCandidates(): Promise<CandidateFiles> {
    let root = this.uri.replace(/\/[^\.\/]+.(\w+)$/, '');
    let files = {
      commonPath: root,
      [DocType.SCRIPT]: [],
      [DocType.STYLE]: [],
      [DocType.TEMPLATE]: [],
    };
    let { scriptExts, styleExts, templateExts } = config;
    let exts = [...scriptExts, ...styleExts, ...templateExts];
    let paterns = `${root}/*{${exts.join(',')}}`;

    let availables: Uri[] = await workspace.findFiles(paterns);

    availables.forEach((uri: Uri) => {
      if (MemberCrossMode.isScript(uri.path)) {
        files[DocType.SCRIPT].push(uri.path as never);
      }
      if (MemberCrossMode.isStyle(uri.path)) {
        files[DocType.STYLE].push(uri.path as never);
      }
      if (MemberCrossMode.isTemplate(uri.path)) {
        files[DocType.TEMPLATE].push(uri.path as never);
      }
    });

    let count =
      files[DocType.SCRIPT].length +
      files[DocType.STYLE].length +
      files[DocType.TEMPLATE].length;

    if (count < 2) {
      return await super.getCandidates();
    } else {
      return files as CandidateFiles;
    }
  }
}
