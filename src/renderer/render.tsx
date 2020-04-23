/**
 * @File   : render.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/13/2019, 11:49:51 AM
 * @Description:
 */
import * as React from 'react';

import SystemActor from '../actors/SystemActor';
import reconciler from './reconciler';
import Layer from './Layer';

/**
 * **不要自己使用！**
 * 
 * @hidden
 */
class TopContainer extends React.Component<{layer: Layer}> {
  public static childContextTypes = {
    layer: () => null,
    system: () => null
  }

  public getChildContext() {
    return {
      layer: this.props.layer,
      system: this.props.layer.system
    };
  }

  public render() {
    return (
      <React.Fragment>
        {this.props.children}
      </React.Fragment>
    );
  }
}

/**
 * **不要自己使用！**
 * 
 * @hidden
 */
export default function render(
  system: SystemActor,
  layer: Layer,
  callback: () => void = () => {}
) {
  const isAsync = false // Disables async rendering
  const container = reconciler.createContainer(layer, isAsync, false) // Creates root fiber node.

  const parentComponent = null // Since there is no parent (since this is the root fiber). We set parentComponent to null.
  reconciler.updateContainer(
    <TopContainer layer={layer}>{layer.element}</TopContainer>,
    container,
    parentComponent,
    callback
  );
}
