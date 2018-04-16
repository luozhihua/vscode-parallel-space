/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:34
 * @Last Modified by:   Colin Luo
 * @Last Modified time: 2018-04-17 06:30:34
 */
import { workspace } from 'vscode';

export interface Extnames {
  [index: string]: ReadonlyArray<string>;
  style: ReadonlyArray<string>;
  script: ReadonlyArray<string>;
  template: ReadonlyArray<string>;
}

const DEF_DIRS: ReadonlyArray<string> = [
  '/components',
  '/views',
  '/pages',
  '/packages',
];
const DEF_SFC_EXTS: ReadonlyArray<string> = ['.vue', '.we', '.weex'];
const DEF_COL_ORDER: ReadonlyArray<string> = ['script', 'template', 'style'];
const DEF_EXTS: Extnames = {
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

  public readonly defaultColumnsOrder: ReadonlyArray<string> = DEF_COL_ORDER;
  public readonly defaultExtnames: Extnames = DEF_EXTS;
  public readonly defaultDirectories: ReadonlyArray<string> = DEF_DIRS;
  public readonly defaultSFCExtnames: ReadonlyArray<string> = DEF_SFC_EXTS;

  public get cacheDirectory(): string {
    let { cacheDirectory } = this.getWorkspaceConfig();

    return cacheDirectory || '.parallel';
  }

  public get extnames(): Extnames {
    let extnames: Extnames = {
      style: this.getStyleExtnames(),
      script: this.getScriptExtnames(),
      template: this.getTemplateExtnames(),
    };

    return extnames;
  }

  public get styleExtnames(): string[] {
    return this.getStyleExtnames();
  }

  public get scriptExtnames(): string[] {
    return this.getScriptExtnames();
  }

  public get templateExtnames(): string[] {
    return this.getTemplateExtnames();
  }

  public get directories(): string[] {
    let { includeDirectories } = this.getWorkspaceConfig();

    return this.cleanPatterns([...DEF_DIRS, ...includeDirectories]);
  }

  public get isSplitSFC(): boolean {
    let { splitSingleFileComponentOnEditing } = this.getWorkspaceConfig();

    return !!splitSingleFileComponentOnEditing;
  }

  public get sfcExtnames(): string[] {
    let { singleFileComponentExtnames } = this.getWorkspaceConfig();

    return this.cleanPatterns([
      ...DEF_SFC_EXTS,
      ...singleFileComponentExtnames,
    ]);
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

  protected getStyleExtnames() {
    let { styleExtnames } = this.getWorkspaceConfig();

    return this.cleanPatterns([...DEF_EXTS.style, ...styleExtnames]);
  }

  protected getScriptExtnames() {
    let { scriptExtnames } = this.getWorkspaceConfig();

    return this.cleanPatterns([...DEF_EXTS.script, ...scriptExtnames]);
  }

  protected getTemplateExtnames() {
    let { templateExtnames } = this.getWorkspaceConfig();

    return this.cleanPatterns([...DEF_EXTS.template, ...templateExtnames]);
  }

  /**
   * @description 对匹配规则去重和排除
   * @static
   * @param {string[]} patterns
   * @returns {string[]}
   * @memberof Config
   */
  public cleanPatterns(patterns: string[]): string[] {
    return patterns
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
