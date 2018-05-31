import * as vscode from 'vscode';
import { TreeView, commands, window, Uri } from 'vscode';
import { ParallelFS } from './pfs-provider';
import Parallel from '../libs/parallel';
import ParallelTreeDataProvider from './tree-data-provider';

export interface ParallelNode {
  resource: vscode.Uri;
  isDirectory: boolean;
  level?: number;
}

export class ParallelExplorer {
  private parallel: Parallel;
  private parallelViewer: TreeView<ParallelNode>;
  private treeDataProvider: ParallelTreeDataProvider;

  constructor(context: vscode.ExtensionContext, parallel: Parallel) {
    const fileProvider = new ParallelFS();
    const treeDataProvider = new ParallelTreeDataProvider(fileProvider);

    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('parallel', fileProvider, {}));

    this.parallel = parallel;
    this.treeDataProvider = treeDataProvider;
    this.parallelViewer = window.createTreeView('parallelExplorer', { treeDataProvider });
  }

  public mount(): void {
    commands.registerCommand('parallel.explorer.refresh', () => this.treeDataProvider.refresh());
    commands.registerCommand('parallel.explorer.reveal', () => this.reveal());
    commands.registerCommand('parallel.explorer.open', (node: Uri) => {
      let { parallel } = this;
      let root = parallel.getRoot(node);

      if (root) {
        parallel.open(root.uri.path, node.path);
      }
    });
  }

  // private openResource(resource: vscode.Uri): void {
  //   workspace.openTextDocument(resource).then(document => vscode.window.showTextDocument(document));
  // }

  private reveal(): void {
    const node = this.getNode();
    if (node) {
      this.parallelViewer.reveal(node);
    }
  }

  /**
   * refresh
   */
  public refresh(): void {}

  private getNode(): ParallelNode {
    if (window.activeTextEditor) {
      if (window.activeTextEditor.document.uri.scheme === 'parallel') {
        return { resource: window.activeTextEditor.document.uri, isDirectory: false };
      }
    }
    return {
      resource: vscode.Uri.parse('parallel://mirror.switch.ch/doc/standard/README.txt'),
      isDirectory: false,
    };
  }
}
