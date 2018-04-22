/*
 * @Author: Colin Luo
 * @Date: 2018-04-17 06:30:10
 * @Last Modified by: Colin Luo
 * @Last Modified time: 2018-04-21 23:12:26
 */
import { ExtensionContext } from 'vscode';
import Parallel from './libs/parallel';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(new Parallel());
}

export function deactivate() {}
