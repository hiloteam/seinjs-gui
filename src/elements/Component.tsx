/**
 * @File   : Component.tsx
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/23/2019, 4:43:42 PM
 * @Description:
 */
import * as React from 'react';
import SystemActor from '../actors/SystemActor';
import Layer from '../renderer/Layer';

/**
 * Sein专用的React合成组件。
 */
export default class Component<IPropTypes = {}, IStateTypes = {}> extends React.Component<IPropTypes, IStateTypes> {
  public static contextTypes = {
    layer: () => null,
    system: () => null
  }

  private _layer: Layer;

  /**
   * 当前的UI图层。
   */
  get layer() {
    return this._layer;
  }

  /**
   * 当前的UI系统。
   */
  get system() {
    return this._layer.system;
  }

  constructor(props: IPropTypes, context: {layer: Layer, system: SystemActor}) {
    super(props);

    this._layer = context.layer;
  }
}
