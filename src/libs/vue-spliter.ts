/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-25 12:54:33
 */
import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as mkdirp from 'mkdirp';
import { SCRIPT, STYLE, TEMPLATE, DocType, DocTypes } from '../config';
import { IPath } from './utils';
import Document from './document';
import { EventEmitter } from 'events';
import { LangID } from './member';

export interface LangID {
  [key: string]: string;
  [SCRIPT]: string;
  [STYLE]: string;
  [TEMPLATE]: string;
}

export interface VueSlice {
  startWrapper: string;
  endWrapper: string;
  content: string;
  type: DocType;
  lang: string;
  scope: boolean;
  path: string;
  ext: string;
}

export interface VueParts {
  [key: string]: VueSlice[] | VueSlice | undefined;
  [SCRIPT]?: VueSlice;
  [STYLE]: VueSlice[];
  [TEMPLATE]?: VueSlice;
}

export const langs: LangID = {
  [SCRIPT]: 'js',
  [STYLE]: 'css',
  [TEMPLATE]: 'html',
  stylesheet: 'css',
};

export default class VueSpliter extends EventEmitter {
  public [SCRIPT]: string;
  public [STYLE]: string;
  public [TEMPLATE]: string;
  private tempDir: string;
  private readonly root: string;
  private readonly path: string;
  private STYLESHEET: string = 'stylesheet';
  public parts: VueParts = { [STYLE]: [] };

  constructor(root: string, path: string) {
    super();
    this.root = root;
    this.path = path;
    this.tempDir = this.mkdir();

    this.split();
    this.createFile();
  }

  private mkdir() {
    let id = Document.createId(this.path);
    let path = `${this.root}/.vscodeparallel/components/${id}`;

    mkdirp.sync(path);
    return path;
  }

  private mockStyleTag(content: string): string {
    content = content.replace(/\<style/g, '<stylesheet');
    content = content.replace(/\<\/style\>/g, '</stylesheet>');

    return content;
  }

  private createDOMFromPath(path: string): HTMLCollection {
    let componentContent = this.mockStyleTag(fs.readFileSync(path, 'utf8'));
    let dom = new jsdom.JSDOM(`<body>${componentContent}</body>`);
    let document: any = dom.window.document;
    let body: HTMLBodyElement = document.body;
    let children: HTMLCollection = body.children;

    return children;
  }

  private split() {
    let doms: HTMLCollection = this.createDOMFromPath(this.path);

    Array.from(doms).forEach((elem: Element): void => {
      let content: string = elem.innerHTML;
      let [startWrapper, endWrapper] = elem.outerHTML.split(elem.innerHTML);
      let tagName: string = elem.nodeName.toLowerCase();
      let lang = elem.getAttribute('lang') || langs[tagName];
      let slice: VueSlice = {
        startWrapper,
        endWrapper,
        content,
        lang: lang,
        ext: lang,
        scope: !!elem.getAttribute('scope'),
        type: (tagName === this.STYLESHEET ? STYLE : tagName) as DocType,
        path: '',
      };

      if ([SCRIPT as DocType, TEMPLATE as DocType].includes(slice.type)) {
        this.parts[slice.type] = slice;
      } else if (slice.type === STYLE) {
        this.parts[STYLE].push(slice);
      }
    });
  }

  private createFile() {
    let ipath: IPath = IPath.parse(this.path);
    let dir = this.tempDir;

    Object.keys(DocTypes).forEach((type): void => {
      let part = this.parts[type];

      if (Array.isArray(part)) {
        let filepath = `${dir}/${ipath.base}.css.vue`;
        let styles: string[] = [];

        part.forEach(slice => {
          let { startWrapper, content, endWrapper } = slice;

          styles.push(startWrapper, content, endWrapper);
        });
        this.writeFileSync(filepath, styles.join('\n\n\r\r'));
      } else if (part) {
        let filepath = `${dir}/${ipath.base}.${part.ext.replace(/^\./, '')}`;

        this.writeFileSync(filepath, part.content);
      } else if (!part) {
        this.writeFileSync(`${dir}/${ipath.base}.${langs[type]}`, '');
      }
    });
  }

  private writeFileSync(filepath: string, content: string) {
    fs.writeFileSync(filepath, content);
  }
}
