/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:44
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-24 03:30:04
 */
import * as crypto from 'crypto';
// import * as mm from 'micromatch';
import {DocType} from '../config';
import {EventEmitter} from 'events';

export default class Document extends EventEmitter {
  constructor(type : DocType, path : string, isMain : boolean = false) {
    super();

    this.type = type;
    this.path = path;
    this.id = Document.createId(path);
  }

  public readonly path : string = '';
  public readonly id : string = '';
  public readonly isMain : boolean = false;
  public readonly type : DocType;
  public readonly ext : string = '';
  public readonly lang : string = '';
  public readonly scope : string = '';
  public readonly content : string = '';
  public textDocument?: any;

  public static createId(str : string) : string {
    let hash = crypto.createHash('md5');
    hash.update(str);

    return hash.digest('hex');
  }
}
