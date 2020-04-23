/**
 * @File   : Checkbox.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/23/2019, 7:30:07 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import Material from '../materials/GUIMaterial';
import Event from '../event/Event';
import {IUpdatePayload} from '../types';

/**
 * 选择器的初始化参数接口。
 */
export interface ICheckboxPropTypes extends IContainerPropTypes{
  /**
   * Checkbox被选择时的图集样式
   */
  checkedAtlas: {atlas: Sein.AtlasManager, frame: string};
  
  /**
   * Checkbox被取消选择时的图集样式
   */
  uncheckedAtlas: {atlas: Sein.AtlasManager, frame: string};

  /**
   * Checkbox的状态
   */
  checked: boolean;

  /**
   * Checkbox的改变状态时的回调
   */
  onCheck(checked: boolean): void;
}

/**
 * 选择器。
 */
@Sein.SClass({className: 'GUICheckboxElement'})
export class CheckboxElement<IPropTypes extends ICheckboxPropTypes = ICheckboxPropTypes> extends ContainerElement<IPropTypes> {
  /**
   * **不要自己调用！**
   * 
   * @hidden
   */
  public added() {
    super.added();
    this.renderState(this.props.checked);
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * 检查props更新
   * @param preProps 原props
   * @param nextProp 新props
   */
  public checkUpdate(preProps: IPropTypes, nextProp: IPropTypes) {
    const res = super.checkUpdate(preProps, nextProp);
    if (nextProp.checked !== preProps.checked) {
      this._props = nextProp;
      this.renderState(nextProp.checked);
    }
    return res;
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * 根据新props和更新的标记options更新组件变换和样式
   * @param nextProp 新props
   * @param options 标记props更新为组件的变换还是纹理
   */
  public update(nextProp: IPropTypes, options: IUpdatePayload) {
    super.update(nextProp, options);
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * TouchEnd事件的冒泡
   * @param event 事件
   */
  public bubbleTouchEnd(event: Event) {
    super.bubbleTouchEnd(event);
    this.props.onCheck(this.props.checked);
  }

  public createMaterial(props: IPropTypes) {
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: this.getBg(this.props.checked),
        u_transformMatrix: this.transformMatrix
      },
      transparent: props.transparent || false,
    });
  }

  /**
   * 根据Checkbox的状态渲染对应的图集
   * @param state Checkbox的状态
   */
  private renderState(state: boolean) {
    const bg = this.getBg(state);

    const {material} = this.mesh;
    material.setUniform<Sein.Texture>('u_background', bg.atlas.texture);
    material.setUniform<Sein.Matrix3>('u_backgroundUVMatrix', bg.atlas.getUVMatrix(bg.frame));
    material.transparent = this._props.transparent || false
  }

  private getBg(state: boolean) {
    let bg: {atlas: Sein.AtlasManager, frame: string} = null;
    if (state) {
      bg = {atlas: this._props.checkedAtlas.atlas, frame: this._props.checkedAtlas.frame};
    }
    else {
      bg = {atlas: this._props.uncheckedAtlas.atlas, frame: this._props.uncheckedAtlas.frame};
    }

    return bg;
  }
}

/**
 * 选择器
 */
export function Checkbox(props: ICheckboxPropTypes) {
  return React.createElement('Checkbox', props, props.children);
}