/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-05-30 21:36:00
 */
import * as mm from 'micromatch';
import { config, TYPES } from '../config';
import { createId } from './utils';
import Component from './component';
import Members, { Member } from './members';
// import event from '../event';
import VueSpliter from './vue-spliter';
import { Uri, workspace, WorkspaceFolder, commands } from 'vscode';

export default class Parallel {
  static closing: Map<string, boolean> = new Map();
  private components: Map<string, Component> = new Map();

  constructor() {}

  private activatedComponent: Component | undefined;
  // private closeQueue: Promise<any>[] = [];

  dispose() {
    this.components.clear();
  }

  private activate(component: Component): void {
    if (this.activatedComponent) {
      this.activatedComponent.activated = false;
    }

    this.activatedComponent = component;
    component.activated = true;
  }

  /**
   * @description 文件被激活为当前正在编辑状态时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  // private onActive(root : string, path : string) {
  public active(root: string, path: string) {
    if (config.auto) {
      let type = Members.getTypeByPath(path);
      let activated = this.activatedComponent;
      let component = this.getComponentByPath(path);

      if (component) {
        if (activated && activated[type] && activated[type].path !== path) {
          setTimeout(() => {
            this.openComponent(root, path);
          }, 100);
        }
      } else {
        setTimeout(() => {
          // this.openComponent(root, path);
        }, 100);
      }

      commands.executeCommand('parallel.explorer.reveal');
    }
  }

  /**
   * @description 打开文件时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  // private onOpen(root : string, path : string) {   this.open(root, path); }

  /**
   * @description 打开文件时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  public open(root: string, path: string, force = false) {
    if (config.auto || force) {
      let component = this.openComponent(root, path);
      if (component) {
        this.rememberComponent(component);
      }
    }
  }

  /**
   * @description 关闭文件时触发的事件方法
   * @param {string} path
   * @event onDidChangeActiveTextEditor
   */
  // private async onClose(path : string) {
  public async close(path: string) {
    let component = this.getComponentByPath(path);

    if (component) {
      let type = Members.getTypeByPath(path);
      let member: Member = component[type];
      if (member && Members.isSplitedFile(member.path)) {
        member.isClosed = true;
      }
    }
  }

  public getRoot(uri: Uri): WorkspaceFolder | undefined {
    let isSplitedFile = Members.isSplitedFile(uri.path);
    let fileUri = uri.with({ scheme: 'file' });
    let root = isSplitedFile
      ? {
          index: 1,
          name: '',
          uri: Uri.parse(VueSpliter.tempRoot),
        }
      : workspace.getWorkspaceFolder(fileUri);

    return root;
  }

  public getOpenedDocument(path: string) {
    let component = this.getComponentByPath(path);
    let type = Members.getTypeByPath(path);

    if (component) {
      return component[type].textDocument;
    }
  }

  /**
   * @description Get a component which is matched to the given file path
   * @param {string} path
   * @returns {(Component | undefined)}
   */
  getComponentByPath(path: string): Component | undefined {
    let component;
    this.components.forEach((item: Component, key): any => {
      if (createId(path) === key) {
        component = item;
        return false;
      } else {
        TYPES.forEach((type): any => {
          let member = item[type];

          if (member && member.path === path) {
            component = item;
            return false;
          }
        });
      }
    });

    return component;
  }

  /**
   * @description 打开组件相关的文件
   * @param {string} path
   */
  rememberComponent(component: Component) {
    TYPES.forEach((type: string) => {
      if (component) {
        let member: Member = component[type];

        this.components.set(component.id, component);
        if (member) {
          this.components.set(member.id, component);
        }
      }
    });
  }

  /**
   * @description 显示组件相关的文件
   * @param {Uri} path
   */
  openComponent(root: string, path: string): any {
    if (Parallel.isFileSupported(root, path)) {
      let component = this.getComponentByPath(path);

      if (!component) {
        component = new Component(root, path);
      }

      this.activate(component);
      component.open();

      return component;
    }
  }

  static isFileSupported(root: string, path: string) {
    let type = Members.getTypeByPath(path);
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
    if (!Members.isSplitMode(path) && !columnOrders.includes(type)) {
      return false;
    }

    let dirs = config.mergePatterns(componentDirs, [...scriptDirs, ...styleDirs, ...templateDirs]).join(',');
    let exts = config.mergePatterns(sfcExts, [...scriptExts, ...styleExts, ...templateExts]).join(',');
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
      (!mm.isMatch(path, `${root}/**/{${excludes}}{s,}/**`, excludeOptions) &&
        mm.isMatch(path, `${root}/**/{${dirs}}{s,}/**/*{${exts}}`, inludeOptions)) ||
      mm.isMatch(path, `${VueSpliter.tempRoot}/**/{${dirs}}{s,}/**/*{${exts}}`, inludeOptions)
    );
  }
}
