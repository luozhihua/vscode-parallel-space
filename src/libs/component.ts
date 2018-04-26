/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:39
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 18:01:29
 */
import { default as Document } from './document';
import { config, DocType, SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import Members from './members';
import event from '../event';
import { createId } from './utils';

export default interface Component {
  [key: string]: any;
  SCRIPT: Document;
  STYLE: Document;
  TEMPLATE: Document;
}

export default class Component {
  protected _members: Members;
  public readonly path: string;
  public readonly id: string;
  public [SCRIPT]: Document | undefined;
  public [STYLE]: Document | undefined;
  public [TEMPLATE]: Document | undefined;
  public activated: boolean = false;

  constructor(root: string, path: string) {
    // 如果是已经被切割的单文件组件的子文件，则获取主组件的文件地址
    if (Members.isSplitedFile(path)) {
      this.path = Members.getMainFileBySplitedFile(path);
    } else {
      this.path = path;
    }
    this.id = createId(this.path);
    this._members = new Members(root, this.path);
    this.init();
  }

  get members(): Members {
    return this._members;
  }

  set members(members: Members) {
    this._members = members;
    this.init();
  }

  private init(): void {
    TYPES.forEach((type: DocType) => {
      let { _members } = this;

      let file = _members[type];

      if (file) {
        this[type] = new Document(type, file);
      }
    });
  }

  // 更新子文件成员
  public updateMembers(root: string, path: string) {
    let members = new Members(root, path);

    TYPES.forEach((type: DocType) => {
      let newer = members[type];
      let old = this.members[type];
      let document = this[type];

      if (newer !== old) {
        event.emit('destroyDocument', document, () => {});
      }
    });

    setTimeout(() => {
      this.members = members;
      this.init();
    }, 2000);
  }

  /**
   * @description 打开组件所属的模板、样式、脚本文件
   * @memberof VscodeComponent
   */
  open(): void {
    let order = this.getColumnOrders();
    let columnIndex = 1;

    order.forEach((type: string) => {
      let document: Document = this[type];

      if (document) {
        event.emit('openDocument', document, columnIndex);
        columnIndex += 1;
      }
    });
  }

  public getColumnOrders(): DocType[] {
    let configOrder: string[] = [...config.columnOrders];
    let order: DocType[] = [];

    configOrder.forEach((type: string) => {
      order.push(type as DocType);
    });

    return order;
  }

  public getOpenedMembers() {
    let members: Document[] = [];

    TYPES.forEach(type => {
      let document = this[type];
      let textDoc = document ? document.textDocument : undefined;

      if (document && textDoc && !textDoc.isClosed) {
        members.push(document);
      }
    });

    return members;
  }
}
