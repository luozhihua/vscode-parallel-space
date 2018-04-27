/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:39
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-27 17:11:20
 */
import * as fs from 'fs';
import { config, DocType, SCRIPT, STYLE, TEMPLATE, TYPES } from '../config';
import Members, { Member } from './members';
import event from '../event';
import { createId } from './utils';

export default interface Component {
  [key: string]: any;
  [SCRIPT]: Member;
  [STYLE]: Member;
  [TEMPLATE]: Member;
}

export default class Component {
  protected _members: Members;
  public readonly path: string;
  public readonly id: string;
  public [SCRIPT]: Member;
  public [STYLE]: Member;
  public [TEMPLATE]: Member;
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

    TYPES.forEach((type: DocType) => {
      let file = this._members[type];

      if (file) {
        this[type] = { type: type, path: file, id: createId(file) };
      }
    });
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
      let path = this.members[type];

      if (path) {
        this[type] = { type: type, path: path, id: createId(path) };
      }
    });
  }

  // 更新子文件成员
  public async updateMembers(root: string, path: string) {
    let members = new Members(root, path);
    let waiter: Promise<void>[] = [];
    let removed: string[] = [];

    TYPES.forEach((type: DocType) => {
      let newPath = members[type];
      let oldPath = this.members[type];

      if (newPath !== oldPath) {
        removed.push(oldPath);
        // waiter.push(this.closeMember(this[type]));
      }
    });

    this.members = members;
    this.open();
    removed.map(path => fs.unlinkSync(path));
    await Promise.all(waiter);
  }

  public async closeMember(member: Member): Promise<any> {
    let waiter = new Promise((resolve, reject) => {
      event.once('close', closedPath => {
        if (closedPath === member.path) {
          resolve();
        }
      });

      setTimeout(() => {
        reject('timeout.');
      }, 10000);
    });

    // 请求关闭文件
    event.emit('requiredCloseDocument', member);

    return waiter;
  }

  public async closeMembers(): Promise<void> {
    for (let i = 0; i < TYPES.length; i++) {
      await this.closeMember(this[TYPES[i]]);
    }
  }

  /**
   * @description 打开组件所属的模板、样式、脚本文件
   * @memberof VscodeComponent
   */
  open(): void {
    let order = this.getColumnOrders();
    let columnIndex = 1;

    order.forEach((type: string) => {
      let member: Member = this[type];

      if (member) {
        event.emit('openDocument', member, columnIndex);
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
    let members: Member[] = [];

    TYPES.forEach(type => {
      let member = this[type];
      let textDoc = member ? member.textDocument : undefined;

      if (member && textDoc && !textDoc.isClosed) {
        members.push(member);
      }
    });

    return members;
  }
}
