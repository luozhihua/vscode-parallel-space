/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:34
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 04:34:31
 */
import { workspace } from 'vscode';
// import * as mm from 'micromatch';
// import * as walker from 'klaw-sync';

type RA = ReadonlyArray<string>;
export interface Exts {
  [index: string]: RA;
  style: RA;
  script: RA;
  template: RA;
}

const DEF_SCRIPT_DIR: RA = [
  'script',
  'controller',
  'ctrl',
  'javascript',
  'typescript',
  'coffeescript',
];
const DEF_STYLE_DIR: RA = ['style'];
const DEF_TEMPLATE_DIR: RA = ['template', 'view', 'page'];
const DEF_COMPONENT_DIR: RA = ['component', 'view', 'page', 'src/app'];
const DEF_SFC_EXTS: RA = ['.vue', '.we', '.weex'];
const DEF_COL_ORDER: RA = ['script', 'template', 'style'];
const DEF_EXTS: Exts = {
  style: ['.css', '.scss', '.sass', '.less', '.styl', '.stylus'],
  script: [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.es',
    '.es6',
    '.coffee',
    '.dart',
  ],
  template: [
    '.jade',
    '.pug',
    '.tpl',
    '.html',
    '.mustache',
    '.ejs',
    '.def',
    '.dot',
    '.jst',
    '.handlebars',
    '.hbs',
    '.haml',
    '.dust',
    '.njk',
  ],
};

export default class Config {
  constructor() {}

  public readonly defaultColumnsOrder: RA = DEF_COL_ORDER;
  public readonly defaultExts: Exts = DEF_EXTS;
  public readonly defaultScriptDir: RA = DEF_SCRIPT_DIR;
  public readonly defaultStyleDir: RA = DEF_STYLE_DIR;
  public readonly defaultTemplateDir: RA = DEF_TEMPLATE_DIR;
  public readonly defaultComponentDir: RA = DEF_COMPONENT_DIR;
  public readonly defaultSFCExts: RA = DEF_SFC_EXTS;

  public get exts(): Exts {
    let extnames: Exts = {
      style: this.styleExts,
      script: this.scriptExts,
      template: this.templateExts,
    };

    return extnames;
  }

  public get scriptDirs() {
    let { scriptFoldersForCrossMode } = this.getWorkspaceConfig();
    let exts: string[] = this.scriptExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return this.mergePatterns(DEF_SCRIPT_DIR, [
      ...scriptFoldersForCrossMode,
      ...exts,
    ]);
  }

  public get styleDirs() {
    let { styleFoldersForCrossMode } = this.getWorkspaceConfig();
    let exts: string[] = this.styleExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return this.mergePatterns(DEF_STYLE_DIR, [
      ...styleFoldersForCrossMode,
      ...exts,
    ]);
  }

  public get templateDirs() {
    let { templateFoldersForCrossMode } = this.getWorkspaceConfig();
    let exts: string[] = this.templateExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return this.mergePatterns(DEF_TEMPLATE_DIR, [
      ...templateFoldersForCrossMode,
      ...exts,
    ]);
  }

  public get componentDirs() {
    let { componentFolders } = this.getWorkspaceConfig();

    return this.mergePatterns(DEF_COMPONENT_DIR, componentFolders);
  }

  public get styleExts(): string[] {
    let { styleExts } = this.getWorkspaceConfig();

    return this.mergePatterns(DEF_EXTS.style as string[], styleExts);
    // return this.getStyleExts();
  }

  public get scriptExts(): string[] {
    let { scriptExts } = this.getWorkspaceConfig();

    return this.mergePatterns(DEF_EXTS.script as string[], scriptExts);
  }

  public get templateExts(): string[] {
    let { templateExts } = this.getWorkspaceConfig();

    return this.mergePatterns(DEF_EXTS.template as string[], templateExts);
  }

  public get isSplitSFC(): boolean {
    let { splitSingleFileComponentOnEditing } = this.getWorkspaceConfig();

    return !!splitSingleFileComponentOnEditing;
  }

  public get sfcExts(): string[] {
    let { singleFileComponentExts } = this.getWorkspaceConfig();

    return this.mergePatterns(
      DEF_SFC_EXTS as string[],
      singleFileComponentExts,
    );
  }

  public get columnsOrder(): string[] {
    let { columnsOrder } = this.getWorkspaceConfig();
    let defaultOrder = config.defaultColumnsOrder;
    let order = [...columnsOrder];

    defaultOrder.forEach(item => {
      if (!columnsOrder.includes(item)) {
        order.push(item);
      }
    });

    return order;
  }

  public getWorkspaceConfig(): any {
    return workspace.getConfiguration('parallel');
  }

  /**
   * @description 对匹配规则去重和排除
   * @static
   * @param {string[]} defaults
   * @param {string[]} patterns
   * @returns {string[]}
   * @memberof Config
   */
  public mergePatterns(
    defaults: string[] | RA,
    patterns: string[] | RA,
  ): string[] {
    let allPatterns: string[];

    // 是否排除所有内置匹配规则
    if (patterns.includes('!built-ins')) {
      allPatterns = patterns as string[];
    } else {
      allPatterns = [...defaults, ...patterns];
    }

    return allPatterns
      .sort() // put ! ahead
      .reverse() // put ! at the last
      .reduce((cleared, pattern) => {
        if (pattern.startsWith('!')) {
          pattern = pattern.substr(1);
          return cleared.filter(item => item !== pattern);
        } else {
          return cleared
            .filter(item => item !== pattern)
            .concat(pattern as never);
        }
      }, []);
  }
}

export let config: Config = new Config();
