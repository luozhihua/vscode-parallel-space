/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 17:52:26
 */

import {
  workspace,
  window,
  ExtensionContext,
  Disposable,
  commands,
  TextEditor,
  TextDocument,
  Uri,
  TextEditorSelectionChangeEvent,
} from 'vscode';

import Parallel from './libs/parallel';
import Document from './libs/document';
import { createId } from './libs/utils';
import event from './event';
import Members from './libs/members';
import VueSpliter from './libs/vue-spliter';

let disposable: Disposable;

export function activate(context: ExtensionContext) {
  let subscriptions: Disposable[] = [];
  let parallel = new Parallel();

  event.on(
    'openDocument',
    async (document: Document, columnIndex: number = 1): Promise<void> => {
      let visibles = window.visibleTextEditors;
      let path = Uri.parse(`file://${document.path}`);
      let isVisibled = false;
      let options = {
        preview: false,
        viewColumn: columnIndex,
        preserveFocus: true,
      };

      visibles.forEach(cur => {
        if (cur.document.uri.path === document.path) {
          isVisibled = true;
        }
      });

      if (!isVisibled) {
        let textDoc = await window.showTextDocument(path, options);

        document.textDocument = textDoc;
      }
    },
  );

  // 关闭一个文档
  event.on(
    'destroyDocument',
    async (document: Document, callback: Function) => {
      await window.showTextDocument(Uri.parse(`file://${document.path}`), {
        preview: false,
        preserveFocus: true,
      });

      await commands.executeCommand('workbench.action.closeActiveEditor');

      if (typeof callback === 'function') {
        callback();
      }
    },
  );

  // 关闭文档
  workspace.onDidCloseTextDocument(
    (doc: TextDocument) => {
      let uri = doc.uri;
      let root = workspace.getWorkspaceFolder(uri);

      // 检测文件是否被Parallel所支持
      if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
        event.emit('close', uri.path);
      }
    },
    parallel,
    subscriptions,
  );

  // 打开了新的文档
  workspace.onDidOpenTextDocument(
    (doc: TextDocument) => {
      let uri = doc.uri;
      let root = workspace.getWorkspaceFolder(uri);

      // 检测文件是否被Parallel所支持
      if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
        event.emit('open', root.uri.path, uri.path);
      }
    },
    parallel,
    subscriptions,
  );

  // 已打开的文档被激活
  window.onDidChangeActiveTextEditor(
    (editor?: TextEditor): void => {
      if (editor !== undefined) {
        let uri = editor.document.uri;
        let root = workspace.getWorkspaceFolder(uri);
        let openedDoc = parallel.getOpenedDocument(uri.path);
        // let isSplitMode = Parallel.isSplitMode(uri.path);

        if (
          // isSplitMode ||
          openedDoc &&
          openedDoc.viewColumn !== editor.viewColumn
        ) {
          commands.executeCommand('workbench.action.closeActiveEditor');
        }

        setTimeout(() => {
          // 检测文件是否被Parallel所支持
          if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
            event.emit('active', root.uri.path, uri.path);
          }
        }, 100);
      }
    },
    parallel,
    subscriptions,
  );

  // 一般情况下鼠标点击或者改变光标位置时会调用
  window.onDidChangeTextEditorSelection(
    (changeEvent: TextEditorSelectionChangeEvent) => {
      let document = changeEvent.textEditor.document;
      let path = document.uri.path;
      let component = parallel.getComponentByPath(path);
      let root = workspace.getWorkspaceFolder(document.uri);

      if (root && !component && Parallel.isFileSupported(root.uri.path, path)) {
        event.emit('open', root.uri.path, path);
      }
    },
  );

  // 保存文件
  workspace.onDidSaveTextDocument((doc: TextDocument) => {
    let path = doc.uri.path;
    let root = workspace.getWorkspaceFolder(doc.uri);
    let id = createId(path);

    // 通知SFC的子文件重新merge
    event.emit(`save-${id}`, path);

    // 如果是从单文件组件直接修改内容，则重新对单文件组件进行分割以更新子文件的内容
    let component = parallel.getComponentByPath(path);
    if (root && Members.isSplitMode(path)) {
      if (component) {
        component.updateMembers(root.uri.path, path);
      } else {
        let spliter = new VueSpliter(root.uri.path, path);

        spliter.split();
      }
    }
  });

  disposable = Disposable.from(...subscriptions);
  context.subscriptions.push(parallel);
}

export function deactivate() {
  disposable.dispose();
  event.removeAllListeners();
}
