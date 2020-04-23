/**
 * @File   : Touch.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/26/2019, 1:00:36 PM
 */

import {ContainerElement} from '../elements/Container';

/**
 * 触控点参数接口。
 */
export interface TouchOptions {
  identifier: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}

/**
 * 触控点类。
 */
export default class Touch {
  public identifier: number;
  public clientX: number;
  public clientY: number;
  public pageX: number;
  public pageY: number;
  public screenX: number;
  public screenY: number;
  public target: ContainerElement

  constructor(options: TouchOptions) {
    this.identifier = options.identifier;
    this.clientX = options.clientX;
    this.clientY = options.clientY;
    this.pageX = options.pageX;
    this.pageY = options.pageY;
    this.screenX = options.screenX;
    this.screenY = options.screenY;
    this.target = null;
  }
}