/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by:   Colin Luo
 * @Last Modified time: 2018-04-17 06:30:10
 */

import {
  workspace,
  window,
  Disposable,
  commands,
  ExtensionContext,
  TextEditor,
  TextDocument,
} from 'vscode';
import Component from './component-vscode';
import { ComponentFiles } from './component';
import { config } from './config';
import * as mm from 'micromatch';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(new ParallelComponentsEditor());
}

class ParallelComponentsEditor {
  private disposable: Disposable;
  private components: Map<string, Component> = new Map();

  constructor() {
    let subscriptions: Disposable[] = [];

    window.onDidChangeActiveTextEditor(this.onActive, this, subscriptions);
    workspace.onDidOpenTextDocument(this.onOpen, this, subscriptions);
    workspace.onDidCloseTextDocument(this.onClose, this, subscriptions);
    commands.executeCommand('workbench.action.close');

    this.disposable = Disposable.from(...subscriptions);
  }

  dispose() {
    this.disposable.dispose();
  }

  /**
   * @description 文件被激活为当前正在编辑状态时触发的事件方法
   * @param {TextEditor} [textEditor]
   * @memberof ParallelComponentsEditor
   * @event onDidChangeActiveTextEditor
   */
  onActive(textEditor?: TextEditor) {
    if (textEditor !== undefined) {
      let uri: string = textEditor.document.uri.toString();

      this.showComponent(uri);
    }
  }

  /**
   * @description 打开文件时触发的事件方法
   * @param {TextEditor} [textEditor]
   * @memberof ParallelComponentsEditor
   * @event onDidChangeActiveTextEditor
   */
  onOpen(textDocument: TextDocument) {
    this.openComponent(textDocument.uri.toString());
  }

  /**
   * @description 关闭文件时触发的事件方法
   * @param {TextEditor} [textEditor]
   * @memberof ParallelComponentsEditor
   * @event onDidChangeActiveTextEditor
   */
  onClose(textDocument: TextDocument) {
    let uri = textDocument.uri.toString().replace(/^file:\/\//, '');
    let id = Component.createId(uri);
    let component = this.components.get(id);

    if (component) {
      let files: ComponentFiles = component.componentFiles;
      let scriptId: string;
      let styleId: string;
      let templateId: string;

      if (files.script) {
        scriptId = Component.createId(files.script[0] || '');
        this.components.delete(scriptId);
      }

      if (files.style) {
        styleId = Component.createId(files.style[0] || '');
        this.components.delete(styleId);
      }

      if (files.template) {
        templateId = Component.createId(files.template[0] || '');
        this.components.delete(templateId);
      }
    }
  }

  /**
   * @description 显示组件相关的文件
   * @param {Uri} uri
   * @memberof ParallelComponentsEditor
   */
  showComponent(uri: string): Component | undefined {
    let id: string = Component.createId(uri);
    let component = this.components.get(id);
    let dirs = config.directories.map(dir => dir.replace(/^[\/\\]/, ''));
    let matches = mm.match([uri], `**/{${dirs.join(',')}}{s,}/**/*.*`, {
      nocase: true,
    });

    if (matches && matches.length > 0) {
      if (!component) {
        component = new Component(uri);
      }

      component.open();

      return component;
    }
  }

  /**
   * @description 打开组件相关的文件
   * @param {any} uri
   * @memberof ParallelComponentsEditor
   */
  openComponent(uri: string) {
    let component = this.showComponent(uri);

    if (component) {
      let files: ComponentFiles = component.componentFiles;
      let scriptId: string;
      let styleId: string;
      let templateId: string;

      if (files.script) {
        scriptId = Component.createId(files.script[0] || '');
        this.components.set(scriptId, component);
      }

      if (files.style) {
        styleId = Component.createId(files.style[0] || '');
        this.components.set(styleId, component);
      }

      if (files.template) {
        templateId = Component.createId(files.template[0] || '');
        this.components.set(templateId, component);
      }
    }
  }
}

export function deactivate() {}
