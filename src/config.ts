/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:34
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-05-31 16:29:33
 */
import { workspace } from 'vscode';

export const TEMP_DIR = `${process.env.HOME}/.vscodeparallel`;
export type DocType = 'script' | 'style' | 'template';
export enum DocTypes {
  SCRIPT = 'script',
  STYLE = 'style',
  TEMPLATE = 'template',
}
export const { SCRIPT, STYLE, TEMPLATE } = DocTypes;
export const TYPES: DocType[] = [SCRIPT, STYLE, TEMPLATE];
type RA = ReadonlyArray<string>;
export interface Exts {
  [key: string]: RA | undefined;
  [STYLE]: RA;
  [SCRIPT]: RA;
  [TEMPLATE]: RA;
  sfc?: RA;
}

const DEF_SCRIPT_DIR: RA = ['script', 'controller', 'ctrl', 'javascript', 'typescript', 'coffeescript'];
const DEF_STYLE_DIR: RA = ['style'];
const DEF_TEMPLATE_DIR: RA = ['template', 'view', 'page'];
const DEF_COMPONENT_DIR: RA = ['component', 'view', 'page', 'src/app', '.vscodeparallel'];
const DEF_SFC_EXTS: RA = ['.vue', '.we', '.weex', '!.css.vue'];
const DEF_COL_ORDER: RA = ['script', 'template', 'style'];
const DEF_EXTS: Exts = {
  [STYLE]: ['.css', '.scss', '.sass', '.less', '.styl', '.style', '.stylus', '.css.vue'],
  [SCRIPT]: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.es', '.es6', '.coffee', '.dart'],
  [TEMPLATE]: [
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

  public get auto(): boolean {
    return this.getWorkspaceConfig().auto;
  }

  public get exts(): Exts {
    let exts = {
      style: this.styleExts,
      script: this.scriptExts,
      template: this.templateExts,
      sfc: this.sfcExts,
    };

    return exts as Exts;
  }

  public get scriptDirs() {
    let { scriptFolders } = this.getWorkspaceConfig();
    let exts: string[] = this.scriptExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return scriptFolders || this.mergePatterns(DEF_SCRIPT_DIR, exts);
  }

  public get styleDirs() {
    let { styleFolders } = this.getWorkspaceConfig();
    let exts: string[] = this.styleExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return styleFolders || this.mergePatterns(DEF_STYLE_DIR, exts);
  }

  public get templateDirs() {
    let { templateFolders } = this.getWorkspaceConfig();
    let exts: string[] = this.templateExts.reduce((res, cur) => {
      return res.concat(cur.substr(1) as never);
    }, []);

    return templateFolders || this.mergePatterns(DEF_TEMPLATE_DIR, exts);
  }

  public get componentDirs() {
    let { componentFolders } = this.getWorkspaceConfig();

    return componentFolders || DEF_COMPONENT_DIR;
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

    return this.mergePatterns(DEF_SFC_EXTS as string[], singleFileComponentExts);
  }

  public get columnOrders(): string[] {
    let { columnsOrder } = this.getWorkspaceConfig();
    let order = [...columnsOrder];

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
  public mergePatterns(defaults: string[] | RA, patterns: string[] | RA): string[] {
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
          cleared.push(pattern as never);
          pattern = pattern.substr(1);
          return cleared.filter(item => item !== pattern);
        } else {
          return cleared.filter(item => item !== pattern).concat(pattern as never);
        }
      }, []);
  }
}

export let config: Config = new Config();
