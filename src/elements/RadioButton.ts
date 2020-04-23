/**
 * @File   : RadioButton.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/25/2019, 10:11:49 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import Material from '../materials/GUIMaterial';
import Event from '../event/Event';
import {IUpdatePayload} from '../types';

/**
 * 多选器的初始化参数接口
 */
export interface IRadioButtonPropTypes extends IContainerPropTypes{
  /**
   * RadioButton被选择时的图集样式
   */
  selectedAtlas: {atlas: Sein.AtlasManager, frame: string};
  /**
   * RadioButton被取消选择时的图集样式
   */
  unselectedAtlas: {atlas: Sein.AtlasManager, frame: string};
  /**
   * RadioButton的选择状态，为id
   * 在RadioGroup中建议其中某一个RadioButton为选择状态
   */
  selected: string;

  /**
   * RadioButton被选择时的事件
   */
  onSelect(selectedId: string): void;
}

/**
 * 多选器。
 */
@Sein.SClass({className: 'GUIRadioButtonElement'})
export class RadioButtonElement<
  IPropTypes extends IRadioButtonPropTypes = IRadioButtonPropTypes
> extends ContainerElement<IPropTypes> {
  /**
   * **不要自己调用！**
   * 
   * @hidden
   */
  public added() {
    super.added();
    this.renderState(this.props.selected === this.props.id);
  }

  public createMaterial(props: IPropTypes) {
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: this.getBg(this.props.selected === this.props.id),
        u_transformMatrix: this.transformMatrix
      },
      transparent: props.transparent || false,
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * RadioButton的TouchEnd冒泡
   * @param event 事件
   */
  public bubbleTouchEnd(event: Event) {
    super.bubbleTouchEnd(event);
    this.props.onSelect(this.props.id);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 检查props更新
   * @param preProps 原props
   * @param nextProps 新props
   */
  public checkUpdate(preProps: IPropTypes, nextProps: IPropTypes) {
    const res = super.checkUpdate(preProps, nextProps);
    if (nextProps.selected !== preProps.selected) {
      this.renderState(nextProps.selected === nextProps.id);
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
   * 根据RadioButton的状态渲染对应的图集
   * @param state RadioButton的状态
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
      bg = {atlas: this._props.selectedAtlas.atlas, frame: this._props.selectedAtlas.frame};
    }
    else {
      bg = {atlas: this._props.unselectedAtlas.atlas, frame: this._props.unselectedAtlas.frame};
    }

    return bg;
  }
}

/**
 * 多选器。
 */
export function RadioButton(props: IRadioButtonPropTypes) {
  return React.createElement('RadioButton', props, props.children);
}