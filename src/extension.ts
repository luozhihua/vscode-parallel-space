/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 00:44:03
 */

import {
  workspace,
  window,
  ExtensionContext,
  Disposable,
  commands,
  TextEditor,
  TextDocument,
  TextDocumentChangeEvent,
  Uri,
} from 'vscode';

import Parallel from './libs/parallel';
import Document from './libs/document';
import { createId } from './libs/utils';
import event from './event';

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

  // 关闭文档
  workspace.onDidCloseTextDocument(
    (doc: TextDocument) => {
      let uri = doc.uri;
      let root = workspace.getWorkspaceFolder(uri);

      // 检测文件是否被Parallel所支持
      if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
        event.emit('close', root.uri.path, uri.path);
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
        let openedDoc = parallel.getOpenedDocment(uri.path);
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

  window.onDidChangeVisibleTextEditors((editors: TextEditor[]): void => {
    console.log(editors);
  }, parallel);

  workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
    console.log(event);
  });

  workspace.onDidSaveTextDocument((doc: TextDocument) => {
    console.log(event);
    let path = doc.uri.path;
    let id = createId(path);

    event.emit(`save-${id}`, path);
  });

  commands.executeCommand('workbench.action.close');
  disposable = Disposable.from(...subscriptions);
  context.subscriptions.push(parallel);
}

export function deactivate() {
  disposable.dispose();
  event.removeAllListeners();
}
