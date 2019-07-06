/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-07-06 12:00:08
 */
import * as nls from 'vscode-nls';
const lang = JSON.parse(process.env.VSCODE_NLS_CONFIG || 'null');
nls.config(lang)();

import {
  workspace,
  window,
  ExtensionContext,
  Disposable,
  commands,
  TextEditor,
  TextDocument,
  Uri,
  // TextEditorSelectionChangeEvent
} from 'vscode';

import Parallel from './libs/parallel';
import {ParallelExplorer} from './explorer/parallel-explorer';
import {createId} from './libs/utils';
import event from './event';
import Members, {Member} from './libs/members';
import VueSpliter from './libs/vue-spliter';
// import EditorReferers from './libs/editor-referers';

let disposable : Disposable;

export function activate(context : ExtensionContext) {
  let subscriptions : Disposable[] = [];
  let parallel = new Parallel();

  new ParallelExplorer(context, parallel).mount();

  commands.registerTextEditorCommand('parallel.spreadCurrentDocument', (editor : TextEditor) => {
    if (editor !== undefined) {
      let uri = editor.document.uri;
      let root = workspace.getWorkspaceFolder(uri);

      if (root) {
        parallel.open(root.uri.path, uri.path, true);
      }
    }
  });

  event.on('openDocument', async(member : Member, columnIndex : number = 1) : Promise < void > => {
    let visibles = window.visibleTextEditors;
    let path = Uri.parse(`file://${member.path}`);
    let isVisibled = false;
    let options = {
      preview: false,
      viewColumn: columnIndex,
      preserveFocus: true
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
  });

  // 关闭一个文档
  event.on('requiredCloseDocument', async(path : string, columnIndex?: number) => {
    await window.showTextDocument(Uri.parse(`file://${path}`), {
      preview: false,
      preserveFocus: true,
      viewColumn: columnIndex
    });

    await commands.executeCommand('workbench.action.closeActiveEditor');
    // event.emit('close', path);
    parallel.close(path);
  });

  // 关闭文档
  workspace.onDidCloseTextDocument((doc : TextDocument) => {
    let uri = doc.uri;
    let isSplitedFile = Members.isSplitedFile(uri.path);
    let root = isSplitedFile
      ? {
        uri: Uri.parse(VueSpliter.tempRoot)
      }
      : workspace.getWorkspaceFolder(uri);

    if (isSplitedFile && uri.scheme === 'git') {
      uri = Uri.parse('file://' + uri.path.replace(/\.git$/, ''));
    }

    // EditorReferers.remove(doc); 检测文件是否被Parallel所支持
    if (uri.scheme === 'file' && root && Parallel.isFileSupported(root.uri.path, uri.path)) {
      // event.emit('close', uri.path);
      parallel.close(uri.path);
    }
  }, parallel, subscriptions,);

  // 打开了新的文档
  workspace.onDidOpenTextDocument((doc : TextDocument) => {
    let uri = doc.uri;
    let root = parallel.getRoot(uri);

    // 检测文件是否被Parallel所支持
    if (uri.scheme === 'file' && root && Parallel.isFileSupported(root.uri.path, uri.path)) {
      // parallel.open(root.uri.path, uri.path);
    }
  }, parallel, subscriptions,);

  // 已打开的文档被激活
  window.onDidChangeActiveTextEditor(async(editor?: TextEditor) : Promise < void > => {
    if (editor !== undefined) {
      let uri = editor.document.uri;
      let isSplitedFile = Members.isSplitedFile(uri.path);
      let openedDoc = parallel.getOpenedDocument(uri.path);
      let root = isSplitedFile
        ? {
          uri: Uri.parse(VueSpliter.tempRoot)
        }
        : workspace.getWorkspaceFolder(uri);

      if (
      // isSplitMode ||
      openedDoc && openedDoc.viewColumn !== editor.viewColumn) {
        // let cmds = [   'workbench.action.moveEditorToFirstGroup',
        // 'workbench.action.moveEditorToSecondGroup',
        // 'workbench.action.moveEditorToThirdGroup', ]; await
        // commands.executeCommand(cmds[openedDoc.viewColumn - 1]); await
        // commands.executeCommand('workbench.action.closeActiveEditor');
      }

      // 检测文件是否被Parallel所支持
      if (root && Parallel.isFileSupported(root.uri.path, uri.path)) {
        // event.emit('active', root.uri.path, uri.path);
        parallel.active(root.uri.path, uri.path);
      }
    }
  }, parallel, subscriptions,);

  /**
  // 一般情况下鼠标点击或者改变光标位置时会调用
  window.onDidChangeTextEditorSelection((changeEvent : TextEditorSelectionChangeEvent) => {
    let document = changeEvent.textEditor.document;
    let path = document.uri.path;
    let component = parallel.getComponentByPath(path);
    let root = parallel.getRoot(document.uri);

    if (root && component && Parallel.isFileSupported(root.uri.path, path)) {
      // event.emit('open', root.uri.path, path);
      parallel.open(root.uri.path, path);
    }
  });
  */

  // 保存文件
  workspace.onDidSaveTextDocument((doc : TextDocument) => {
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
  context
    .subscriptions
    .push(parallel);
}

export function deactivate() {
  disposable.dispose();
  event.removeAllListeners();
}
