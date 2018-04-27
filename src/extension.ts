/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-27 16:57:21
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
import { createId } from './libs/utils';
import event from './event';
import Members, { Member } from './libs/members';
import VueSpliter from './libs/vue-spliter';

let disposable: Disposable;

export function activate(context: ExtensionContext) {
  let subscriptions: Disposable[] = [];
  let parallel = new Parallel();

  commands.registerTextEditorCommand(
    'parallel.enableForCurrentDocument',
    (editor: TextEditor) => {
      if (editor !== undefined) {
        let uri = editor.document.uri;
        let root = workspace.getWorkspaceFolder(uri);

        if (root) {
          parallel.open(root.uri.path, uri.path);
        }
      }
      console.log(window.activeTextEditor);
    },
  );

  event.on(
    'openDocument',
    async (member: Member, columnIndex: number = 1): Promise<void> => {
      let visibles = window.visibleTextEditors;
      let path = Uri.parse(`file://${member.path}`);
      let isVisibled = false;
      let options = {
        preview: false,
        viewColumn: columnIndex,
        preserveFocus: true,
      };

      visibles.forEach(cur => {
        if (cur.document.uri.path === member.path) {
          isVisibled = true;
        }
      });

      if (!isVisibled) {
        let textDoc = await window.showTextDocument(path, options);

        member.textDocument = textDoc;
      }
    },
  );

  // 关闭一个文档
  event.on(
    'requiredCloseDocument',
    async (member: Member, columnIndex?: number) => {
      await window.showTextDocument(Uri.parse(`file://${member.path}`), {
        preview: false,
        preserveFocus: true,
        viewColumn: columnIndex || member.textDocument.viewColumn,
      });

      await commands.executeCommand('workbench.action.closeActiveEditor');
      event.emit('close', member.path);
      console.log(22222);
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
    async (editor?: TextEditor): Promise<void> => {
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
          // let cmds = [
          //   'workbench.action.moveEditorToFirstGroup',
          //   'workbench.action.moveEditorToSecondGroup',
          //   'workbench.action.moveEditorToThirdGroup',
          // ];
          // await commands.executeCommand(cmds[openedDoc.viewColumn - 1]);
          await commands.executeCommand('workbench.action.closeActiveEditor');
        }

        // 检测文件是否被Parallel所支持
        if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
          event.emit('active', root.uri.path, uri.path);
        }
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
