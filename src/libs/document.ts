/*
 * @Author: Colin Luo
 * @Date: 2018-04-21 14:39:44
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-25 13:38:40
 */
import { DocType } from '../config';
import { createId } from './utils';

export default class Document {
  constructor(type: DocType, path: string) {
    this.type = type;
    this.path = path;
    this.id = createId(path);
  }

  public readonly path: string = '';
  public readonly id: string = '';
  public readonly isMain: boolean = false;
  public readonly type: DocType;
  public readonly ext: string = '';
  public readonly lang: string = '';
  public readonly scope: string = '';
  public readonly content: string = '';
  public textDocument?: any;
}
