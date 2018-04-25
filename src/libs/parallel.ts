/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 00:43:13
 */
import * as mm from 'micromatch';
import { config, TYPES } from '../config';
import { createId } from './utils';
import Component from './component';
import Member from './member-base';
import Document from './document';
import event from '../event';

const a: xx = {
  x: '2',
};

export default class Parallel {
  private components: Map<string, Component> = new Map();

  constructor() {
    this.initEvents();
  }

  private activatedComponent: Component | undefined;
  // private closeQueue: Promise<any>[] = [];

  dispose() {
    this.components.clear();
  }

  private initEvents(): void {
    event.on('open', this.onOpen.bind(this));
    event.on('close', this.onClose.bind(this));
    event.on('active', this.onActive.bind(this));
  }

  private activate(component: Component): void {
    if (this.activatedComponent) {
      this.activatedComponent.activated = false;
    }

    this.activatedComponent = component;
    component.activated = true;
  }

  public getOpenedDocment(path: string) {
    let id = createId(path);
    let type = Member.getTypeByPath(path);
    let component = this.components.get(id);

    if (component) {
      return component[type].textDocument;
    }
  }

  /**
   * @description 文件被激活为当前正在编辑状态时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  private onActive(root: string, path: string) {
    let type = Member.getTypeByPath(path);
    let activated = this.activatedComponent;

    if (activated && activated[type] && activated[type].path !== path) {
      setTimeout(() => {
        this.openComponent(root, path);
      }, 100);
    }
  }

  /**
   * @description 打开文件时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  private onOpen(root: string, path: string) {
    let component = this.openComponent(root, path);
    if (component) {
      this.rememberComponent(component);
    }
  }

  /**
   * @description 关闭文件时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  private onClose(root: string, path: string) {
    let id = createId(path);
    let component = this.components.get(id);
    if (component) {
      let type = Member.getTypeByPath(path);
      let document: Document = component[type];

      if (document) {
        // document.isClosed = true;
      }
    }
  }
  /**
   * @description 打开组件相关的文件
   * @param {string} path
   */
  rememberComponent(component: Component) {
    TYPES.forEach((type: string) => {
      if (component) {
        let document: Document = component[type];

        if (document) {
          this.components.set(document.id, component);
        }
      }
    });
  }

  /**
   * @description 显示组件相关的文件
   * @param {Uri} path
   */
  openComponent(root: string, path: string): Component | undefined {
    let id: string = createId(path);
    let { scriptDirs, styleDirs, templateDirs, componentDirs } = config;
    let conf = [...scriptDirs, ...styleDirs, ...templateDirs, ...componentDirs];
    let patterns = config.mergePatterns([], conf);
    let matches = mm.match([path], `**/{${patterns.join(',')}}{s,}/**/*.*`, {
      nocase: true,
    });

    if (matches && matches.length > 0) {
      let component = this.components.get(id);

      if (!component) {
        component = new Component(root, path);
      }

      this.activate(component);
      component.open(path);

      return component;
    }
  }

  static isFileSupported(root: string, path: string) {
    let type = Member.getTypeByPath(path);
    let {
      componentDirs,
      scriptDirs,
      styleDirs,
      templateDirs,
      scriptExts,
      styleExts,
      templateExts,
      sfcExts,
      columnOrders,
    } = config;

    // 没有开启对应的列
    if (!this.isSplitMode(path) && !columnOrders.includes(type)) {
      return false;
    }

    let dirs = config
      .mergePatterns(componentDirs, [
        ...scriptDirs,
        ...styleDirs,
        ...templateDirs,
      ])
      .join(',');
    let exts = config
      .mergePatterns(sfcExts, [...scriptExts, ...styleExts, ...templateExts])
      .join(',');
    let excludes = ['node_modules', 'build', 'dist', 'release'].join(',');
    let inludeOptions = {
      nocase: true,
      dot: false,
    };
    let excludeOptions = {
      nocase: true,
      dot: true,
    };

    return (
      !mm.isMatch(path, `${root}/**/{${excludes}}{s,}/**`, excludeOptions) &&
      mm.isMatch(path, `${root}/**/{${dirs}}{s,}/**/*{${exts}}`, inludeOptions)
    );
  }

  static isSplitMode(path: string): boolean {
    let { isSplitSFC, sfcExts } = config;
    let exts = config.mergePatterns([], sfcExts);
    let isSFC = mm.isMatch(path, `*{${exts.join(',')}}`, {
      matchBase: true,
    });
    let isSplited = mm.isMatch(path, '**/.vscodeparallel/components/**', {
      dot: true,
    });

    return isSFC && isSplitSFC && !isSplited;
  }
}
