/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:48
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 07:00:15
 */
import { QuickPickItem, TextEditor, Uri, window } from 'vscode';
import Component from './libs/component';
import { config } from './config';
import { DocumentType as DocType } from './libs/document';
import { MemberFiles } from './libs/member';

interface ColumnsOrder {
  [key: string]: number;
  [DocType.SCRIPT]: number;
  [DocType.STYLE]: number;
  [DocType.TEMPLATE]: number;
}

export default class VscodeComponent extends Component {
  constructor(uri: string) {
    super(uri);
  }

  getColumnsOrder(): ColumnsOrder {
    let order: ColumnsOrder = {
      [DocType.SCRIPT]: 1,
      [DocType.STYLE]: 2,
      [DocType.TEMPLATE]: 3,
    };
    let configOrder: string[] = [...config.columnsOrder];

    configOrder.forEach((item: string, index: number) => {
      order[item] = index + 1;
    });

    return order;
  }

  /**
   * @description 打开组件所属的模板、样式、脚本文件
   * @memberof VscodeComponent
   */
  open(): void {
    let files: MemberFiles = this.member.getMemberFiles();
    let order = this.getColumnsOrder();
    let maxColumn = Object.keys(files).reduce((result, type) => {
      let items = files[type] as string[];

      return result + (items.length > 0 ? 1 : 0);
    }, 0);

    // 打开脚本文件
    let scriptFiles = files[DocType.SCRIPT];
    if (scriptFiles && scriptFiles.length > 0) {
      this.openFileInColumn(
        DocType.SCRIPT.toLowerCase(),
        scriptFiles,
        Math.min(maxColumn, order[DocType.SCRIPT]),
      );
    }

    let templateFiles = files[DocType.TEMPLATE];
    // 打开模板文件
    if (templateFiles && templateFiles.length > 0) {
      this.openFileInColumn(
        DocType.TEMPLATE.toLowerCase(),
        templateFiles,
        Math.min(maxColumn, order[DocType.TEMPLATE]),
      );
    }

    // 打开样式文件
    let styleFiles = files[DocType.STYLE];
    if (styleFiles && styleFiles.length > 0) {
      this.openFileInColumn(
        DocType.STYLE.toLowerCase(),
        styleFiles,
        Math.min(maxColumn, order[DocType.STYLE]),
      );
    }
  }

  /**
   * @description 在指定的列视图中打开文件
   * @private
   * @param {string[]} files
   * @param {number} columnIndex
   * @memberof VscodeComponent
   */
  private openFileInColumn(
    type: string,
    files: string[],
    columnIndex: number,
  ): void {
    if (files.length === 1) {
      window
        .showTextDocument(Uri.parse('file://' + files[0]), {
          preserveFocus: true,
          viewColumn: columnIndex,
        })
        .then((textEditor: TextEditor) => {
          console.log('opened');
        });
    } else {
      let filenames: QuickPickItem[] = [...files].map(
        (f: string, index: number): QuickPickItem => {
          let item: QuickPickItem = {
            label: f.split(/\\\//g).pop() || '',
            description: f,
            picked: index === 0,
          };

          return item;
        },
      );
      let options = {
        canPickMany: true,
        placeHolder: `Please choose ${type} part for this component`,
      };

      window.showQuickPick(filenames, options).then(picked => {
        console.log(picked);
      });
    }
  }
}
