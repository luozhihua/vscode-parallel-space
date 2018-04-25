/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:39
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-26 01:46:21
 */
import { default as Document } from './document';
import { config, DocType, SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import Member from './member';
import event from '../event';

interface ColumnsOrder {
  [key: string]: number;
  [SCRIPT]: number;
  [STYLE]: number;
  [TEMPLATE]: number;
}

export default interface Component {
  [key: string]: any;
  SCRIPT: Document;
  STYLE: Document;
  TEMPLATE: Document;
}

export default class Component {
  constructor(root: string, path: string) {
    this.path = path;
    this.member = new Member(root, this.path);
    this.init();
  }

  protected readonly path: string;
  protected member: Member;
  public script: Document | undefined;
  public style: Document | undefined;
  public template: Document | undefined;
  public activated: boolean = false;

  private init(): void {
    TYPES.forEach((type: DocType) => {
      let { member, path } = this;

      if (member.documents) {
        this[type] = member.documents[type];
      } else {
        let file = member[type];

        if (file) {
          this[type] = new Document(type, file, path === file);
        }
      }
    });
  }

  /**
   * @description 打开组件所属的模板、样式、脚本文件
   * @memberof VscodeComponent
   */
  open(entry: string): void {
    let columns: string[] = [...config.columnOrders];
    let order = this.getColumnOrders();

    columns.forEach((type: string) => {
      let document: Document = this[type];

      if (document) {
        event.emit('openDocument', document, order[type]);
      }
    });
  }

  public getColumnOrders(): ColumnsOrder {
    let configOrder: string[] = [...config.columnOrders];
    let order: ColumnsOrder = {
      [SCRIPT]: 1,
      [STYLE]: 2,
      [TEMPLATE]: 3,
    };

    configOrder.forEach((type: string, index: number) => {
      order[type] = index + 1;
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
