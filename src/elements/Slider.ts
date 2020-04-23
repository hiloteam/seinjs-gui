/**
 * @File   : Slider.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/28/2019, 11:39:47 AM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import {IUpdatePayload} from '../types';
import Material from '../materials/GUIMaterial';

/**
 * 滑动条的初始化参数接口。
 */
export interface ISliderPropTypes extends IContainerPropTypes{
  /**
   * Slider的样式
   * ``row``、``column``
   */
  layout?: string;
  /**
   * Slider填充占比
   */
  percent?: number;
}

/**
 * 滑动条。
 */
@Sein.SClass({className: 'GUISliderElement'})
export class SliderElement<IPropTypes extends ISliderPropTypes = ISliderPropTypes> extends ContainerElement<IPropTypes> {
  protected _percent: Sein.Vector2 = new Sein.Vector2();

  /**
   * **不要自己调用！**
   * 
   * @hidden
   */
  public added() {
    super.added();
    this.calculatePercent();
    this.renderPercent(this._percent);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 检查props
   * @param preProps 原props
   * @param nextProps 新props
   */
  public checkUpdate(preProps: IPropTypes, nextProps: IPropTypes) {
    const res = super.checkUpdate(preProps, nextProps);
    res.others = res.others
      || preProps.percent !== nextProps.percent;
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
  public update(nextProps: IPropTypes, options: IUpdatePayload) {
    super.update(nextProps, options);
    if (!options.others) {
      return;
    }
    this._props = nextProps;
    this.calculatePercent();
    this.renderPercent(this._percent);
  }

  /**
   * 根据Slider的layout和percent计算在Fragment Shader中需要渲染的部分
   */
  private calculatePercent() {
    const layout = this._props.layout ? this._props.layout : 'row';
    const percent = this._props.percent ? this._props.percent : 1.01;

    if (layout === 'row') {
      this._percent.set(percent, 1.01);
    }
    else {
      this._percent.set(1.01, percent);
    }
  }

  /**
   * 根据Slider中在宽和高中需要渲染的占比进行渲染
   * @param u_percent Slider中在宽和高中需要渲染部分的占比
   */
  private renderPercent(u_percent: Sein.Vector2) {
    this.mesh.material.setUniform('u_percent', u_percent);
  }

  public createMaterial(props: IPropTypes) {
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: this.props.background,
        u_transformMatrix: this.transformMatrix,
        u_percent: this._percent
      },
      transparent: props.transparent || false,
    });
  }
}

/**
 * 滑动条。
 */
export function Slider(props: ISliderPropTypes) {
    return React.createElement('Slider', props, props.children);
}