/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-24 19:11:05
 */

import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as mkdirp from 'mkdirp';
import { SCRIPT, STYLE, TEMPLATE } from '../config';
import Parallel from './parallel';
import Document from './document';
import { IPath } from './utils';
import { MemberFiles, DocumentMap, TYPES } from './member-base';
import MemberSiblingMode from './member-sibling';
import VueSpliter from './vue-spliter';

export interface LangID {
  [key: string]: string;
  [SCRIPT]: string;
  [STYLE]: string;
  [TEMPLATE]: string;
}

export default class MemberSplitMode extends MemberSiblingMode {
  constructor(root: string, path: string) {
    super(root, path);
  }

  protected getCandidates(): MemberFiles {
    if (Parallel.isSplitMode(this.path)) {
      let docs: DocumentMap = this.split();
      let files: any = {
        splitMode: true,
        documents: docs,
      };

      TYPES.forEach(type => {
        let doc = docs[type];

        files[type] = doc ? [doc.path] : [];
      });
      return files as MemberFiles;
    } else {
      return super.getCandidates();
    }
  }

  private mkdir() {
    let id = Document.createId(this.path);
    let path = `${this.root}/.vscodeparallel/components/${id}`;

    mkdirp.sync(path);
    return path;
  }

  private createFile(props: any) {
    let uri: IPath = IPath.parse(this.path);
    let dir = this.mkdir();
    let filepath = `${dir}/${uri.base}.${props.ext.replace(/^\./, '')}`;

    fs.writeFileSync(filepath, props.content);

    return filepath;
  }

  private mockStyleTag(content: string): string {
    content = content.replace(/\<style/g, '<stylesheet');
    content = content.replace(/\<\/style\>/g, '</stylesheet>');

    return content;
  }

  private split(): DocumentMap {
    let componentContent = this.mockStyleTag(
      fs.readFileSync(this.path, 'utf8'),
    );
    let dom = new jsdom.JSDOM(`<body>${componentContent}</body>`);
    let document: any = dom.window.document;
    let body: HTMLBodyElement = document.body;
    let children: HTMLCollection = body.children;
    let styleLang = 'css';
    let styleContents: string[] = [];
    let docs: DocumentMap = {
      [SCRIPT]: undefined,
      [STYLE]: undefined,
      [TEMPLATE]: undefined,
    };

    Array.from(children).forEach((elem: Element): void => {
      let type = elem.nodeName.toLowerCase();
      let lang = elem.getAttribute('lang');
      let content = elem.innerHTML;
      let TYPES: LangID = {
        [SCRIPT]: 'js',
        [STYLE]: 'css',
        [TEMPLATE]: 'html',
      };

      type = type === 'stylesheet' ? STYLE : type;

      switch (type) {
        case SCRIPT:
        case TEMPLATE:
          let props: any = {
            ext: lang || TYPES[type],
            lang: lang,
            content: content,
          };
          let file = this.createFile(props);

          docs[type] = new Document(type, file);
          break;

        case STYLE:
        default:
          styleLang = lang || styleLang;
          styleContents.push(content);
          break;
      }
    });

    let styleProps: any = {
      ext: styleLang || 'css',
      lang: styleLang,
      content: styleContents,
    };
    let styleFile = this.createFile(styleProps);

    docs[STYLE] = new Document(STYLE, styleFile);

    return docs as DocumentMap;
  }
}
