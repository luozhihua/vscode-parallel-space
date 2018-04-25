/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 01:43:29
 */
import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as mkdirp from 'mkdirp';
import { SCRIPT, STYLE, TEMPLATE, TYPES, DocType, DocTypes } from '../config';
import { IPath, createId } from './utils';
import { LangID } from './member';
import event from '../event';

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

export default interface VueSpliter {
  [key: string]: any;
}

export default class VueSpliter {
  public [SCRIPT]: string;
  public [STYLE]: string;
  public [TEMPLATE]: string;
  private tempDir: string;
  private readonly root: string;
  private readonly path: string;
  private STYLESHEET: string = 'stylesheet';
  public parts: VueParts = {
    [STYLE]: [],
  };

  constructor(root: string, path: string) {
    this.root = root;
    this.path = path;
    this.tempDir = this.mkdir();

    this.split();
    this.createFile();
  }

  private mkdir() {
    let id = createId(this.path);
    let path = `${this.root}/.vscodeparallel/components/${id}`;

    mkdirp.sync(path);
    return path;
  }

  private createDOMFromPath(path: string): HTMLCollection {
    let componentContent = fs.readFileSync(path, 'utf8');
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

    [SCRIPT, STYLE, TEMPLATE].forEach((type): void => {
      let part = this.parts[type];
      let filepath: string | undefined;

      if (Array.isArray(part)) {
        let styles: string[] = [];

        filepath = `${dir}/${ipath.base}.css.vue`;
        part.forEach(slice => {
          let { startWrapper, content, endWrapper } = slice;

          styles.push(startWrapper, content, endWrapper);
          slice.path = filepath || '';
        });

        this.writeFileSync(filepath, styles.join('\n\n\r\r'));
      } else if (part) {
        filepath = `${dir}/${ipath.base}.${part.ext.replace(/^\./, '')}`;

        this.writeFileSync(filepath, part.content);
        part.path = filepath || '';
      }

      if (filepath) {
        this[type] = filepath;
      }
    });
  }

  private writeFileSync(filepath: string, content: string) {
    let id = createId(filepath);

    fs.writeFileSync(filepath, content);

    event.on(`save-${id}`, this.merge.bind(this));
  }

  /**
   * @description Merge sub files into Single-file Component
   */
  private merge(): void {
    let parts: string[] = [];

    [SCRIPT, STYLE, TEMPLATE].forEach((type: DocType) => {
      let part = this.parts[type];

      if (part && (<VueSlice>part).type === type) {
        parts.push(
          [
            (<VueSlice>part).startWrapper,
            fs.readFileSync((<VueSlice>part).path, 'utf-8'),
            (<VueSlice>part).endWrapper,
          ].join('\n'),
        );
      } else if (Array.isArray(part)) {
        part.forEach((slice: VueSlice) => {
          parts.push(fs.readFileSync(slice.path, 'utf-8'));
        });
      }
    });

    fs.writeFileSync(this.path, parts.join('\n\n'));
  }
}
