/**
 * @File   : reconciler.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/13/2019, 11:47:25 AM
 * @Description:
 */
import * as Reconciler from 'react-reconciler';

import Layer from './Layer';
import SystemActor from '../actors/SystemActor';
import {EElementType, IContainerPropTypes, ContainerElement} from '../elements';
import {IUpdatePayload} from '../types';

/**
 * **不要自己使用！**
 * 
 * @hidden
 */
export interface IReconcilerHostContext {
  system: SystemActor;
}

/**
 * **不要自己使用！**
 * 
 * @hidden
 */
export default Reconciler<
  EElementType,
  IContainerPropTypes,
  Layer,
  ContainerElement,
  any,
  any,
  any,
  IReconcilerHostContext,
  IUpdatePayload,
  any,
  any,
  any
>({
  now: Date.now,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  getRootHostContext: (layer: Layer) => {
    return {system: layer.system};
  },

  getChildHostContext: (parentHostContext: IReconcilerHostContext, type: EElementType, layer: Layer) => {
    parentHostContext = parentHostContext || {system: layer.system};
    return parentHostContext;
  },

  shouldSetTextContent: (type: EElementType, newProps: IContainerPropTypes) => {
    // console.log('shouldSetTextContent');
    return false;
  },

  createTextInstance: () => {
    // console.log('createTextInstance')
    throw new Error('We do not support standalone Text now !');
  },

  createInstance: (
    type: EElementType,
    props: IContainerPropTypes,
    layer: Layer,
    hostContext: IReconcilerHostContext,
    internalInstanceHandle: Reconciler.Fiber
  ) => {
    // console.log('createInstance');

    return layer.createElement(type, props);
  },

  appendInitialChild: (parent: ContainerElement, child: ContainerElement) => {
    // console.log('appendInitialChild');
    parent.addChild(child);
  },

  finalizeInitialChildren: (
    parent: ContainerElement,
    type: EElementType,
    props: IContainerPropTypes,
    layer: Layer,
    hostContext: IReconcilerHostContext,
  ) => {
    // console.log('finalizeInitialChildren');

    return false;
  },

  prepareForCommit: (layer: Layer) => {
    // console.log('prepareForCommit');
  },

  resetAfterCommit: (layer: Layer) => {
    // console.log('resetAfterCommit', layer);
  },

  appendChildToContainer: (layer: Layer, child: ContainerElement) => {
    // console.log('appendChildToContainer');
    layer.addRoot(child);
  },

  prepareUpdate: (
    instance: ContainerElement,
    type: EElementType,
    oldProps: IContainerPropTypes,
    newProps: IContainerPropTypes,
    layer: Layer,
    hostContext: IReconcilerHostContext,
  ) => {
    const payload = instance.checkUpdate(oldProps, newProps);

    return (payload.transform || payload.others) ? payload : null;
  },

  commitUpdate(
    instance: ContainerElement,
    updatePayload: IUpdatePayload,
    type: EElementType,
    oldProps: IContainerPropTypes,
    newProps: IContainerPropTypes,
    internalInstanceHandle: Reconciler.Fiber
  ) {
    instance.update(newProps, updatePayload);
  },

  appendChild: (parent: ContainerElement, child: ContainerElement) => {
    // console.log('appendChild');
    parent.addChild(child);
  },

  insertBefore: (parent: ContainerElement, child: ContainerElement, pre: ContainerElement) => {
    // console.log('insertBefore');
    parent.addChildBefore(child, pre);
  },

  removeChild: (parent: ContainerElement, child: ContainerElement) => {
    // console.log('removeChild');
    parent.removeChild(child);
  },

  insertInContainerBefore: (layer: Layer, child: ContainerElement, pre: ContainerElement) => {
    // console.log('insertInContainerBefore');
    layer.addRootBefore(child, pre);
  },

  removeChildFromContainer: (layer: Layer, child: ContainerElement) => {
    // console.log('removeChildFromContainer');
    layer.removeRoot(child);
  },
} as any);
