/**
 * @File   : Clip.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 9/5/2019, 4:08:11 PM
 * @Description:
 */
import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';

export interface IClipPropTypes extends IContainerPropTypes {
  /**
   * 内边距
   * 
   * 顺序依次为为上边距、右边距、下边距、左边距
   */
  padding?: Sein.Vector4;
}

/**
 * 裁剪组件。
 */
@Sein.SClass({className: 'GUIClipElement'})
export class ClipElement<IPropTypes extends IClipPropTypes = IClipPropTypes> extends ContainerElement<IPropTypes> {
  protected _clip: {x: number, y: number, w: number, h: number} = {x: 0, y: 0, w: 0, h: 0};

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public draw() {
    throw new Error('Clip does not support combination!');
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public setBounds(transformMatrix: Sein.Matrix3) {
    super.setBounds(transformMatrix);

    let {padding, scaleX, scaleY} = this.props;
    padding = padding || new Sein.Vector4();
    scaleX = scaleX || 1;
    scaleY = scaleY || 1;
    const pt = padding.x * scaleY;
    const pr = padding.y * scaleX;
    const pb = padding.z * scaleY;
    const pl = padding.w * scaleX;
    const {minX, minY, maxX, maxY} = this.bound;
    const {pixelRatio} = this.system.getGame().renderer;
    this._clip.x = (minX + pl) * pixelRatio;
    this._clip.w = (maxX - minX - pr) * pixelRatio;
    this._clip.y = (this._gameHeight - maxY + pb) * pixelRatio;
    this._clip.h = (maxY - minY - pt) * pixelRatio;
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 渲染
   */
  public render() {
    if (this._props.visibility === false || !this._visibility) {
      return;
    }

    if (this._props.rotation) {
      throw new Error('Clip does not support rotation !');
    }

    const {renderer} = this.system.getGame();
    renderer.renderMesh(this.mesh);

    const {x, y, w, h} = this._clip;
    const {gl} = renderer.state;

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);

    this._children.forEach(child => {
      child.render();
    });

    gl.disable(gl.SCISSOR_TEST);
  }
}

export function Clip(props: IClipPropTypes) {
  return React.createElement('Clip', props, props.children);
}