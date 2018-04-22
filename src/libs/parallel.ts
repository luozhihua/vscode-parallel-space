/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo
 * @Last Modified time: 2018-04-21 23:12:44
 */

import {
  workspace,
  window,
  Disposable,
  commands,
  TextEditor,
  TextDocument,
} from 'vscode';
import Component from '../component-vscode';
import { MemberFiles } from './member';
import { config } from '../config';
import * as mm from 'micromatch';
import Document, { DocumentType as DocType } from './document';

export default class Parallel {
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
   * @memberof Parallel
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
   * @memberof Parallel
   * @event onDidChangeActiveTextEditor
   */
  onOpen(textDocument: TextDocument) {
    this.openComponent(textDocument.uri.toString());
  }

  /**
   * @description 关闭文件时触发的事件方法
   * @param {TextEditor} [textEditor]
   * @memberof Parallel
   * @event onDidChangeActiveTextEditor
   */
  onClose(textDocument: TextDocument) {
    let uri = textDocument.uri.toString().replace(/^file:\/\//, '');
    let id = Document.createId(uri);
    let component = this.components.get(id);

    if (component) {
      let files: MemberFiles = component.componentFiles;
      let scriptId: string;
      let styleId: string;
      let templateId: string;

      let scriptFiles = files[DocType.SCRIPT];
      if (scriptFiles) {
        scriptId = Document.createId(scriptFiles[0] as string);
        this.components.delete(scriptId);
      }

      let styleFiles = files[DocType.STYLE];
      if (styleFiles) {
        styleId = Document.createId(styleFiles[0] || '');
        this.components.delete(styleId);
      }

      let templateFiles = files[DocType.TEMPLATE];
      if (templateFiles) {
        templateId = Document.createId(templateFiles[0] || '');
        this.components.delete(templateId);
      }
    }
  }

  /**
   * @description 显示组件相关的文件
   * @param {Uri} uri
   * @memberof Parallel
   */
  showComponent(uri: string): Component | undefined {
    let id: string = Document.createId(uri.replace(/^file:\/\//, ''));
    let component = this.components.get(id);
    let confDirs = [
      ...config.scriptDirs,
      ...config.styleDirs,
      ...config.templateDirs,
      ...config.componentDirs,
    ];
    let dirs = confDirs.map(dir => dir.replace(/^[\/\\]/, ''));
    let patterns = config.mergePatterns([], confDirs);
    let matches = mm.match([uri], `**/{${patterns.join(',')}}{s,}/**/*.*`, {
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
   * @memberof Parallel
   */
  openComponent(uri: string) {
    let component = this.showComponent(uri);

    if (component) {
      let files: MemberFiles = component.getMemberFiles();
      let scriptId: string;
      let styleId: string;
      let templateId: string;

      let scripts = files[DocType.SCRIPT];
      if (scripts) {
        scriptId = Document.createId(scripts[0] || '');
        this.components.set(scriptId, component);
      }

      let styles = files[DocType.STYLE];
      if (styles) {
        styleId = Document.createId(styles[0] || '');
        this.components.set(styleId, component);
      }

      let templates = files[DocType.TEMPLATE];
      if (templates) {
        templateId = Document.createId(templates[0] || '');
        this.components.set(templateId, component);
      }
    }
  }
}
