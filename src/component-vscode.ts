/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:48
 * @Last Modified by:   Colin Luo
 * @Last Modified time: 2018-04-17 06:30:48
 */
import { QuickPickItem, TextEditor, Uri, window } from 'vscode';
import Component, { ComponentFiles } from './component';
import { config } from './config';

interface ColumnsOrder {
  [key: string]: number;
  script: number;
  style: number;
  template: number;
}

export default class VscodeComponent extends Component {
  constructor(uri: string) {
    super(uri);
  }

  getColumnsOrder(): ColumnsOrder {
    let order: ColumnsOrder = { script: 1, style: 2, template: 3 };
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
    let files: ComponentFiles = this.getComponentFiles();
    let order = this.getColumnsOrder();

    // 打开脚本文件
    if (files.script && files.script.length > 0) {
      this.openFileInColumn(files.script, order.script);
    }

    // 打开模板文件
    if (files.template && files.template.length > 0) {
      this.openFileInColumn(files.template, order.template);
    }

    // 打开样式文件
    if (files.style && files.style.length > 0) {
      this.openFileInColumn(files.style, order.style);
    }
  }

  /**
   * @description 在指定的列视图中打开文件
   * @private
   * @param {string[]} files
   * @param {number} columnIndex
   * @memberof VscodeComponent
   */
  private openFileInColumn(files: string[], columnIndex: number): void {
    if (files.length === 1) {
      window
        .showTextDocument(Uri.parse('file://' + files[0]), {
          preserveFocus: true,
          viewColumn: columnIndex,
        })
        .then((textEditor: TextEditor) => {
          // textEditor.show(columnIndex);
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

      window.showQuickPick(filenames).then(picked => {
        console.log(picked);
      });
    }
  }
}
