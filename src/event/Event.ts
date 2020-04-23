/**
 * @File   : Event.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Date   : 8/12/2019, 7:30:44 PM
 * @Description:
 */

import {EventType} from './EventType';
import {ContainerElement} from '../elements/Container';
import Touch from './Touch';

/**
 * GUI系统的事件。
 */
export interface EventOptions {
  /**
   * 是否冒泡。
   */
  bubbles?: boolean;
  /**
   * 所有触摸点。
   */
  touches?: Array<Touch>;
  /**
   * 当前的触摸点。
   */
  targetTouches?: Array<Touch>;
  /**
   * 变更的触摸点。
   */
  changedTouches?: Array<Touch>;
  /**
   * 事件类型。
   */
  type: EventType;
}

export default class Event {
  /**
   * 是否冒泡。
   */
  public bubbles: boolean;
  /**
   * 所有触摸点。
   */
  public touches: Array<Touch>;
  /**
   * 当前的触摸点。
   */
  public targetTouches: Array<Touch>;
  /**
   * 变更的触摸点。
   */
  public changedTouches: Array<Touch>;
  /**
   * 触发的元素。
   */
  public target: ContainerElement;
  /**
   * 当前的元素。
   */
  public currentTarget: ContainerElement;
  /**
   * 事件类型。
   */
  public type: EventType;

  constructor(options: EventOptions) {
    this.bubbles = options.bubbles === undefined ? true : options.bubbles;
    this.touches = options.touches || new Array<Touch>();
    this.targetTouches = options.targetTouches || new Array<Touch>();
    this.changedTouches = options.changedTouches || new Array<Touch>();
    this.target = null;
    this.currentTarget = null;
    this.type = options.type;
  }

  /**
   * 禁用事件冒泡
   */
  public stopPropagation() {
    this.bubbles = false;
  }
}