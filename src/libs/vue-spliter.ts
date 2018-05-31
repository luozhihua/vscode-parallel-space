/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:06
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-05-31 16:30:27
 */
import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as mkdirp from 'mkdirp';
import { SCRIPT, STYLE, TEMPLATE, TYPES, DocType, TEMP_DIR } from '../config';
import { IPath, createId } from './utils';
import { LangID } from './members';
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

const DEF_CONTETN = {
  [SCRIPT]: 'export default {\n  data(){\n    return {}\n  }\n}',
  [STYLE]: '  .example{}',
  [TEMPLATE]: '<div class="example">\n  <!--contents-->\n</div>',
};

export default class VueSpliter {
  static tempRoot: string = TEMP_DIR;
  public [SCRIPT]: string;
  public [STYLE]: string;
  public [TEMPLATE]: string;
  private tempDir: string;
  // private readonly root : string;
  private readonly path: string;
  private STYLESHEET: string = 'stylesheet';
  public parts: VueParts = {
    [STYLE]: [],
  };

  constructor(root: string, path: string) {
    this.root = root;
    this.path = path;
    this.tempDir = this.mkdir();
  }

  public split() {
    let doms: HTMLCollection = this.createDOMFromPath(this.path);

    Array.from(doms).forEach((elem: Element): void => {
      let content: string = elem.innerHTML.trim();
      let [startWrapper, endWrapper] = this.getWrapper(elem);
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

    let fillDefaultPart = this.fillDefaultPart();
    this.createFile();

    if (fillDefaultPart) {
      this.merge();
    }
  }

  private fillDefaultPart(): boolean {
    let hasEmptyBlock = false;

    TYPES.forEach((type: DocType) => {
      let part = this.parts[type];
      if (Array.isArray(part) && part.length === 0) {
        part.push({
          startWrapper: '<style lang="css">',
          endWrapper: '</style>',
          content: DEF_CONTETN[type],
          lang: 'css',
          ext: 'css',
          scope: false,
          type: STYLE,
          path: '',
        });
        hasEmptyBlock = true;
      } else if (!part) {
        this.parts[type] = {
          startWrapper: `<${type} lang="${langs[type]}">`,
          endWrapper: `</${type}>`,
          content: DEF_CONTETN[type],
          lang: langs[type],
          ext: langs[type],
          scope: false,
          type: STYLE,
          path: '',
        };
        hasEmptyBlock = true;
      }
    });

    return hasEmptyBlock;
  }

  /**
   * @description Merge sub files into Single-file Component
   */
  public merge(): void {
    let parts: string[] = [];

    [SCRIPT, STYLE, TEMPLATE].forEach((type: DocType) => {
      let part = this.parts[type];

      if (Array.isArray(part)) {
        part.forEach((slice: VueSlice) => {
          parts.push(fs.readFileSync(slice.path, 'utf-8'));
        });
      } else if (part) {
        parts.push([part.startWrapper, fs.readFileSync(part.path, 'utf-8'), part.endWrapper].join('\n'));
      }
    });

    fs.writeFileSync(this.path, parts.join('\n\n'));
  }

  private mkdir() {
    let id = createId(this.path);
    let path = `${VueSpliter.tempRoot}/components/${id}`;

    mkdirp.sync(path);

    // Save main component's path into splited components directory.
    fs.writeFileSync(`${path}/.path`, this.path);
    return path;
  }

  private fakeStyleTag(content: string): string {
    return content
      .replace(/\<style\s+/, '<stylesheet ')
      .replace(/\<\/style\>/, '</stylesheet>')
      .trim();
  }

  private getWrapper(elem: any): string[] {
    return elem.outerHTML.split(elem.innerHTML).map((wrapper: string) => {
      return wrapper
        .replace(/\<stylesheet\s+/, '<style ')
        .replace(/\<\/stylesheet\>/, '</style>')
        .trim();
    });
  }

  private createDOMFromPath(path: string): HTMLCollection {
    let componentContent = this.fakeStyleTag(fs.readFileSync(path, 'utf8'));
    let dom = new jsdom.JSDOM(`<body>${componentContent}</body>`);
    let document: any = dom.window.document;
    let body: HTMLBodyElement = document.body;
    let children: HTMLCollection = body.children;

    return children;
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

          styles.push(startWrapper, '\n', content, '\n', endWrapper);
          slice.path = filepath || '';
        });

        this.writeFileSync(filepath, styles.join(''));
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
}
