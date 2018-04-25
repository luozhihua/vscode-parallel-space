/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-25 13:07:56
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
} from 'vscode';

import Parallel from './libs/parallel';
import Document from './libs/document';
import event from './event';

let disposable: Disposable;

export function activate(context: ExtensionContext) {
  let subscriptions: Disposable[] = [];
  let parallel = new Parallel();

  parallel.on(
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

  // 关闭文档
  workspace.onDidCloseTextDocument(
    (doc: TextDocument) => {
      let uri = doc.uri;
      let root = workspace.getWorkspaceFolder(uri);

      // 检测文件是否被Parallel所支持
      if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
        parallel.emit('close', root.uri.path, uri.path);
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
        parallel.emit('open', root.uri.path, uri.path);
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
        let opened = parallel.getOpenedComponent(uri.path);
        let isSplitMode = Parallel.isSplitMode(uri.path);

        if (
          isSplitMode ||
          (opened && opened.viewColumn !== editor.viewColumn)
        ) {
          commands.executeCommand('workbench.action.closeActiveEditor');
        }

        setTimeout(() => {
          // 检测文件是否被Parallel所支持
          if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
            parallel.emit('active', root.uri.path, uri.path);
          }
        }, 100);
      }
    },
    parallel,
    subscriptions,
  );

  window.onDidChangeVisibleTextEditors((editors: TextEditor[]): void => {
    console.log(editors);
  }, parallel);

  commands.executeCommand('workbench.action.close');
  disposable = Disposable.from(...subscriptions);
  context.subscriptions.push(parallel);
}

export function deactivate() {
  disposable.dispose();
}
