/**
 * @File   : Scroll.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 9/7/2019, 10:57:02 PM
 * @Description:
 */
import * as Sein from 'seinjs';
import * as React from 'react';

import {IClipPropTypes, ClipElement} from './Clip';
import {IUpdatePayload} from '../types';
import Event from '../event/Event';

export interface IScrollPropTypes extends IClipPropTypes {
  /**
   * 是否锁定横向滚动
   * 
   * @default false
   */
  isLockScrollX?: boolean;
  /**
   * 是否锁定纵向滚动
   * 
   * @default false
   */
  isLockScrollY?: boolean;
  /**
   * Scrollable初始位置
   */
  initialPos?: Sein.Vector2;
}

@Sein.SClass({className: 'GUIScrollElement'})
export class ScrollElement<IPropTypes extends IScrollPropTypes = IScrollPropTypes> extends ClipElement<IPropTypes> {
  protected _size: {width: number, height: number};

  private _prePoint: {x: number, y: number};
  private _listHead: {x: number, y: number};
  
  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 渲染
   */
  public render() {
    if (this._size === undefined) {
      this.calcSize();
      this.setInitialPos();
    }
    super.render();
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 检查组件props更新
   * @param preProps 原props
   * @param nextProps 新props
   */
  public checkUpdate(preProps: IPropTypes, nextProps: IPropTypes) {
    const res = super.checkUpdate(preProps, nextProps);
    return res;
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 根据新props和更新的标记options更新组件变换和样式
   * @param nextProps 新props
   * @param options 标记props更新为组件的变换还是纹理
   */
  public update(props: IPropTypes, options: IUpdatePayload) {
    super.update(props, options);
    if (options.others) {
      this.calcSize();
    }
  }

  /**
   * 遍历Scroll组件的子元素计算其内容的大小
   */
  protected calcSize() {
    const padding = this._props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingBottom = padding.z;
    const paddingLeft = padding.w;
    const paddingRight = padding.y;

    let x0 = this._gameWidth;
    let y0 = this._gameHeight;
    let x1 = 0;
    let y1 = 0;

    this._children.forEach(child => {
      const {maxX, maxY, minX, minY} = child.bound;
      x1 = x1 > maxX ? x1 : maxX;
      y1 = y1 > maxY ? y1 : maxY;
      x0 = x0 < minX ? x0 : minX;
      y0 = y0 < minY ? y0 : minY;
    });

    this._size = {width: x1 - x0, height: y1 - y0};

    const initialPos = this._props.initialPos || new Sein.Vector2(0, 0);
    let initialX = this.bound.minX + paddingLeft - initialPos.x;
    let initialY = this.bound.minY + paddingTop - initialPos.y;
    if (this.bound.maxX - paddingRight - this._size.width > initialX) {
      initialX = this.bound.maxX - paddingRight - this._size.width;
    }
    if (this.bound.maxY - paddingBottom - this._size.height > initialY) {
      initialY = this.bound.maxY - paddingBottom - this._size.height;
    }

    this._listHead = {x: initialX, y: initialY};
    console.log(this._listHead);
  }

  /**
   * 根据initialPos初始化子元素初始位置
   */
  protected setInitialPos() {
    const padding = this._props.padding || new Sein.Vector4(0, 0);
    const paddingTop = padding.x;
    const paddingLeft = padding.w;

    this._children.forEach(child => {
      child.setOffset(this._listHead.x - this.bound.minX - paddingLeft, this.bound.minY + paddingTop - this._listHead.y);
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchMove事件向上冒泡
   * @param event 事件
   */
  public bubbleTouchStart(event: Event) {
    super.bubbleTouchStart(event);
    this._prePoint = {x: event.touches[0].pageX, y: event.touches[0].pageY};
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchMove事件向上冒泡
   * @param event 事件
   */
  public bubbleTouchMove(event: Event) {
    super.bubbleTouchMove(event);
    const deltaX = event.touches[0].pageX - this._prePoint.x;
    const deltaY = event.touches[0].pageY - this._prePoint.y;

    const padding = this._props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingRight = padding.y;
    const paddingBottom = padding.z;
    const paddingLeft = padding.w;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (this.props.isLockScrollX) {
        return;
      }
      else if (this._size.width <= this._props.shape.x - paddingLeft - paddingRight) {
        return;
      }
      else {
        if (this._listHead.x + deltaX > this.bound.minX + paddingLeft) {
          if (this._listHead.x === this.bound.minX + paddingLeft) {
            return;
          }
          this._children.forEach(child => {
            child.setOffset(this.bound.minX + paddingLeft - this._listHead.x, 0);
          });
          this._listHead.x = this.bound.minX + paddingLeft;
        }
        else if (this._listHead.x + deltaX < this.bound.maxX - paddingRight - this._size.width) {
          if (this._listHead.x === this.bound.maxX - paddingRight - this._size.width) {
            return;
          }
          this._children.forEach(child => {
            child.setOffset(this.bound.maxX - paddingRight - this._size.width - this._listHead.x, 0);
          });
          this._listHead.x = this.bound.maxX - paddingRight - this._size.width;
        }
        else {
          this._listHead.x += deltaX;
          this._children.forEach(child => {
            child.setOffset(deltaX, 0);
          });
        }
      }
    }
    else {
      if (this.props.isLockScrollY) {
        return;
      }
      else if (this._size.height <= this._props.shape.y - paddingTop - paddingBottom) {
        return;
      }
      else {
        if (this._listHead.y + deltaY > this.bound.minY + paddingTop) {
          if (this._listHead.y === this.bound.minY + paddingTop) {
            return;
          }
          this._children.forEach(child => {
            child.setOffset(0, this._listHead.y - this.bound.minY - paddingTop);
          });
          this._listHead.y = this.bound.minY+ paddingTop;
        }
        else if (this._listHead.y + deltaY < this.bound.maxY - paddingBottom - this._size.height) {
          if (this._listHead.y === this.bound.maxY - paddingBottom - this._size.height) {
            return;
          }
          this._children.forEach(child => {
            child.setOffset(0, this._listHead.y - this.bound.maxY + paddingBottom + this._size.height);
          });
          this._listHead.y = this.bound.maxY - paddingBottom - this._size.height;
        }
        else {
          this._listHead.y += deltaY;
          this._children.forEach(child => {
            child.setOffset(0, -deltaY);
          });
        }
      }
    }
    this._prePoint = {x: event.touches[0].pageX, y: event.touches[0].pageY};
  }
}

export function Scroll(props: IScrollPropTypes) {
  return React.createElement('Scroll', props, props.children);
}
