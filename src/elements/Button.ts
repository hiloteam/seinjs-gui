/**
 * @File   : Button.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/23/2019, 11:57:21 AM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {ILabelPropTypes, LabelElement} from './Label';
import Event from '../event/Event';

/**
 * 按钮的初始化参数接口。
 */
export interface IButtonPropTypes extends ILabelPropTypes {

}

/**
 * 按钮组件。
 */
@Sein.SClass({className: 'GUIButtonElement'})
export class ButtonElement extends LabelElement<IButtonPropTypes> {
  /**
   * 定义每次点击时Button位移偏移量的宏
   */
  private _CLICK_STEP: number = 2;

  /**
   * 标志Button是否被点击
   */
  private _clicked: boolean;

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * Button的TouchStart事件冒泡
   * @param event 触摸事件
   */
  public bubbleTouchStart(event: Event) {
    super.bubbleTouchStart(event);
    if (event.currentTarget !== this) {
      return;
    }
    this._clicked = true;
    this.clickDown();
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * Button的TouchEnd事件冒泡
   * @param event 触摸事件
   */
  public bubbleTouchEnd(event: Event) {
    super.bubbleTouchEnd(event);
    if (event.currentTarget !== this) {
      return;
    }
    if (this._clicked) {
      this._clicked = false;
      this.clickUp();
    }
  }

  /**
   * Button被按下时向右下角偏移_CLICK_STEP
   */
  private clickDown() {
    this.transformMatrix.elements[6] += this._CLICK_STEP;
    this.transformMatrix.elements[7] -= this._CLICK_STEP;
    this.mesh.material.setUniform('u_transformMatrix', this.transformMatrix);
  }

  /**
   * Button被松开时向左上角偏移_CLICK_STEP
   */
  private clickUp() {
    this.transformMatrix.elements[6] -= this._CLICK_STEP;
    this.transformMatrix.elements[7] += this._CLICK_STEP;
    this.mesh.material.setUniform('u_transformMatrix', this.transformMatrix);
  }
}

/**
 * 按钮元素。
 */
export function Button(props: IButtonPropTypes) {
  return React.createElement('Button', props, props.children);
}