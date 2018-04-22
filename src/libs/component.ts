/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:39
 * @Last Modified by: Colin Luo <mail@luozhihua.com>
 * @Last Modified time: 2018-04-22 06:41:24
 */
// import * as mm from 'micromatch';
import { EventEmitter as Events } from 'events';
import { default as Document, DocumentType as DocType } from './document';
import { MemberFiles } from './member';
import Member from './member.sibling';

export default abstract class Component extends Events {
  constructor(uri: string) {
    super();
    this.uri = uri.replace(/^file:\/\//, '');
    this.member = new Member(this.uri);
    this.member.on('resolved', () => {
      this.init();
      this.emit('ready');
    });
  }

  abstract open(): void;

  private init(): void {
    let { script, style, template } = this.member;

    if (script) {
      this.script = new Document(DocType.SCRIPT, script);
    }

    if (style) {
      this.style = new Document(DocType.STYLE, style);
    }

    if (template) {
      this.template = new Document(DocType.TEMPLATE, template);
    }
  }

  /**
   * @description 表示组件位置的URI
   * @private
   * @type {string}
   * @memberof Component
   */
  protected readonly uri: string;
  protected member: Member;
  public script: Document | undefined;
  public style: Document | undefined;
  public template: Document | undefined;

  public componentFiles: MemberFiles = {};
  /**
   * @description 返回构成组件的各类型文件（包含脚本、样式、模板文件）
   * @returns {MemberFiles}
   * @memberof Component
   */
  public getMemberFiles(): MemberFiles {
    let files: MemberFiles = this.componentFiles;

    if (!files.completed) {
      if (Member.isScript(this.uri)) {
        files.script = [this.uri];
        files.style = this.member.getStyle();
        files.template = this.member.getTemplate();
      }

      if (Member.isTemplate(this.uri)) {
        files.template = [this.uri];
        files.style = this.member.getStyle();
        files.script = this.member.getScript();
      }

      if (Member.isStyle(this.uri)) {
        files.template = [this.uri];
        files.template = this.member.getTemplate();
        files.script = this.member.getScript();
      }

      files.completed = true;
    }

    return files;
  }
}
