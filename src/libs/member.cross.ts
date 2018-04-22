/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:36
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 05:41:06
 */
// import * as fs from 'fs';
import * as mm from 'micromatch';
import { workspace, Uri } from 'vscode';
import { config } from '../config';
import Member, { MemberFiles, CandidateFiles } from './member';
import { DocumentType as DocType } from './document';

export default class MemberCrossMode extends Member {
  constructor(uri: string) {
    super(uri);
  }

  protected async getCandidates(): Promise<CandidateFiles> {
    return new Promise<CandidateFiles>(async () => {
      let files = {
        commonPath: this.getCommonPath(),
        [DocType.SCRIPT]: [],
        [DocType.STYLE]: [],
        [DocType.TEMPLATE]: [],
        crossMode: true,
      };

      let pathname = this.getPathname(files.commonPath, this.uri);
      let availables: Uri[] = await MemberCrossMode.getAvailableFiles(
        this.uri,
        pathname,
      );

      availables.forEach((uri: Uri) => {
        if (Member.isScript(uri.path)) {
          files[DocType.SCRIPT].push(uri.path as never);
        }
        if (Member.isStyle(uri.path)) {
          files[DocType.STYLE].push(uri.path as never);
        }
        if (Member.isTemplate(uri.path)) {
          files[DocType.TEMPLATE].push(uri.path as never);
        }
      });

      return files as CandidateFiles;
    });
  }

  private getPathname(root: string, uri: string): string {
    let type = Member.getTypeByUri(uri);
    let dirs: string[] = Member.getDirPatternsByType(type);
    let exts: string[] = Member.getExtPatternsByType(type);

    return uri
      .replace(root, '')
      .replace(new RegExp(`\\\/?(${dirs.join('|')})s?\\\/`, 'gi'), '')
      .replace(new RegExp(`(${exts.join('|')})$`, 'i'), '');
  }

  private getCommonPath() {
    let path = this.uri.replace(/\/[^\/]+\.\w+$/, '');
    let type = Member.getTypeByUri(this.uri);
    let dirs: string[] = Member.getDirPatternsByType(type);

    let result: string = '';
    if (dirs.length > 0) {
      let paths = path.split('/');

      while (mm.isMatch(paths.pop() || '', `{${dirs.join(',')}}`)) {
        break;
      }
      result = paths.join('/');
    }

    return result;
  }

  static async getAvailableFiles(uri: string, path: string): Promise<Uri[]> {
    let root = workspace.getWorkspaceFolder(Uri.parse(uri));
    let {
      scriptDirs,
      styleDirs,
      templateDirs,
      scriptExts,
      styleExts,
      templateExts,
    } = config;
    let dirs = [...scriptDirs, ...styleDirs, ...templateDirs].join(',');
    let exts = [...scriptExts, ...styleExts, ...templateExts].join(',');

    return await workspace.findFiles(
      `${root}/**/{${dirs}}{s,}/${path}{${exts}}`,
    );
  }
}
