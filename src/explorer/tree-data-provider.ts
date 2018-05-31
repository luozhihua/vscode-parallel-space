import { TEMP_DIR } from './../config';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import {
  workspace,
  WorkspaceFolder,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  commands,
} from 'vscode';
import { ParallelFS } from './pfs-provider';
import { ParallelNode } from './parallel-explorer';

let statesFile = `${TEMP_DIR}/collapsible-states.json`;
let collapsibleStates: { [key: string]: boolean };

try {
  collapsibleStates = JSON.parse(fs.readFileSync(statesFile, 'utf-8') || '{}');
} catch (err) {
  collapsibleStates = {};
}

export default class ParallelTreeDataProvider implements TreeDataProvider<ParallelNode> {
  private collapsibleStates: { [key: string]: boolean } = collapsibleStates;
  private onDidChange: vscode.EventEmitter<ParallelNode> = new vscode.EventEmitter<ParallelNode>();
  readonly onDidChangeTreeData = this.onDidChange.event;
  private readonly fileSystemProvider: ParallelFS;

  constructor(fsProvider: ParallelFS) {
    this.fileSystemProvider = fsProvider;

    commands.registerCommand('parallel.explorer.toggleNode', (uri: Uri) => {
      let path = uri.path;

      if (this.collapsibleStates[path]) {
        delete this.collapsibleStates[path];
      }
      fs.writeFileSync(statesFile, JSON.stringify(this.collapsibleStates, undefined, 4));
    });
  }

  refresh() {
    this.onDidChange.fire();
  }

  public getTreeItem(element: ParallelNode): TreeItem {
    /*
      322:"explorer.newFile"
      323:"explorer.newFolder"
      324:"explorer.openToSide"

      356:"filesExplorer.copy" // 复制文件
      359:"filesExplorer.paste" // 粘贴文件
      359:"renameFile"
      359:"copyFilePath"
      357:"filesExplorer.findInFolder"
      358:"filesExplorer.findInWorkspace"
     */
    let { Expanded, Collapsed } = TreeItemCollapsibleState;
    let state = !!this.collapsibleStates[element.resource.path] || !element.level ? Expanded : Collapsed;
    let treeItem = {
      // id: '',
      tooltip: path.join(__filename, '..', '..', 'resources', 'icons', 'dark', 'cmd-icon.png'),
      // tooltip: element.resource.path,
      contextValue: 'parallel.item.component',
      resourceUri: element.resource,
      collapsibleState: element.isDirectory ? state : void 0,
      // iconPath: {
      //   light: path.join(__filename, '..', '..', '..', 'resources', 'icons', 'light', 'cmd-icon.png'),
      //   dark: path.join(__filename, '..', '..', '..', 'resources', 'icons', 'dark', 'cmd-icon.png'),
      // },
      command: {
        command: element.isDirectory ? 'parallel.explorer.toggleNode' : 'parallel.explorer.open',
        arguments: [element.resource],
        title: 'Open Parallel Resource',
      },
    };

    return treeItem;
  }

  public async getChildren(element?: ParallelNode): Promise<ParallelNode[]> {
    if (element) {
      let dirs = await this.fileSystemProvider.readDirectory(element.resource);

      return Promise.resolve(
        dirs.map((path): ParallelNode => {
          let uri = Uri.parse(`parallel://${path[0]}`);
          return {
            resource: uri,
            isDirectory: fs.statSync(uri.path).isDirectory(),
            level: (element.level || 0) + 1,
          };
        }),
      );
    } else {
      return Promise.resolve(this.rootDirs);
    }
  }

  get rootDirs(): ParallelNode[] {
    let dirs: ParallelNode[] = [];

    if (workspace.workspaceFolders) {
      workspace.workspaceFolders.forEach((dir: WorkspaceFolder) => {
        dirs.push({
          resource: Uri.parse(`parallel://${dir.uri.path}`),
          isDirectory: fs.statSync(dir.uri.path).isDirectory(),
        });
      });
    }

    return dirs;
  }

  public getParent(element: ParallelNode): ParallelNode | null {
    const parent = Uri.parse(dirname(element.resource.fsPath));
    return !parent.fsPath
      ? null
      : {
          resource: Uri.parse('parallel://' + parent.path),
          isDirectory: fs.statSync(parent.path).isDirectory(),
        };
  }

  // private sort(nodes: ParallelNode[]): ParallelNode[] {
  //   return nodes.sort((n1, n2) => {
  //     if (n1.isDirectory && !n2.isDirectory) {
  //       return -1;
  //     }

  //     if (!n1.isDirectory && n2.isDirectory) {
  //       return 1;
  //     }

  //     return basename(n1.resource.fsPath).localeCompare(basename(n2.resource.fsPath));
  //   });
  // }
}
