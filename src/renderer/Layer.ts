/**
 * @File   : Layer.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/13/2019, 2:03:46 PM
 * 
 */
import * as Sein from 'seinjs';

import SystemActor from '../actors/SystemActor';
import * as elements from '../elements';
import {EElementType, IContainerPropTypes, ContainerElement} from '../elements';
import Touch from '../event/Touch';

/**
 * 图层的配置参数接口
 */
export interface ILayerOptions {
  /**
   * 图层优先级
   */
  priority: number;
  /**
   * 图层元素节点
   */
  element: JSX.Element;
  /**
   * 用于自适应布局的宽度，设置此宽度后，所有的transform（x, y, w, h）会按照此缩放：
   * 
   * `realX = x * deviceWidth / baseWidth;`
   * 
   * @default deviceWidth
   */
  baseWidth?: number;
}

/**
 * GUI的图层类
 */
@Sein.SClass({className: 'GUILayer'})
export default class Layer extends Sein.SObject {
  /**
   * GUI系统的引用
   */
  public system: SystemActor;
  /**
   * 图层优先级
   */
  public priority: number;
  /**
   * 图层元素节点
   */
  public element: JSX.Element;
  /**
   * 用于自适应布局的宽度，设置此宽度后，所有的transform（x, y, w, h）会按照此缩放：
   * 
   * `realX = x * deviceWidth / baseWidth;`
   * 
   * @default deviceWidth
   */
  public baseWidth?: number;
  /**
   * 用于自适应布局
   * 
   * 根据baseWidth和game.bound.width计算得到的自适应比例
   */
  public screenRatio: number;

  protected _roots: Sein.SArray<ContainerElement> = new Sein.SArray();
  protected _aspectMatrixUniform: {value: Sein.Matrix3, isGlobal: true};

  public constructor(name: string, options: ILayerOptions, system: SystemActor) {
    super(name);

    this.priority = options.priority;
    this.element = options.element;
    this.baseWidth = options.baseWidth || system.getGame().bound.width;
    this.system = system;

    const {width, height} = system.getGame().bound;
    const aspectMatrix = new Sein.Matrix3();
    aspectMatrix.fromArray([
      2 / width, 0, 0,
      0, 2 / height, 0,
      0, 0, 1
    ]);
    this._aspectMatrixUniform = {value: aspectMatrix, isGlobal: true};

    this.screenRatio = system.getGame().bound.width / this.baseWidth;
  }

  /**
   * 图层下的所有根节点
   */
  get roots() {
    return this._roots;
  }

  /**
   * 标准屏幕空间向game坐标系空间变换的我矩阵
   */
  get aspectMatrixUniform() {
    return this._aspectMatrixUniform;
  }

  /**
   * **不要自己使用，交给React托管！**
   * 
   * @hidden
   */
  public createElement(type: EElementType, props: IContainerPropTypes) {
    if (!EElementType[type]) {
      throw new Error(`No such basic element '${type}' !`);
    }

    const element = new elements[EElementType[type]](props, this);
    return element;
  }

  /**
   * **不要自己使用，交给React托管！**
   * 
   * @hidden
   */
  public addRoot(root: ContainerElement) {
    root.added();
    root.setMatrix();  // update matrix from root to its leaf nodes
    // root.combineAtlas();  // combine atlas at CombineContainer
    this._roots.add(root);
  }

  /**
   * **不要自己使用，交给React托管！**
   * 
   * @hidden
   */
  public removeRoot(root: ContainerElement) {
    this._roots.remove(root);
  }

  /**
   * **不要自己使用，交给React托管！**
   * 
   * @hidden
   */
  public addRootBefore(root: ContainerElement, pre: ContainerElement) {
    root.added();
    this._roots.insert(this._roots.indexOf(pre), root);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 渲染
   */
  public render() {
    // render all ui component by order
    this._roots.forEach(element => {
      element.render();
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 事件捕获
   */
  public searchTarget = (touch: Touch) => {
    for (let i = this._roots.length - 1; i >= 0; i--) {
      this._roots.get(i).searchTarget(touch);
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchCancel事件冒泡
   */
  public handleTouchCancel = () => {
    for (let i = this._roots.length - 1; i >= 0; i--) {
      this._roots.get(i).handleTouchCancel();
    }
  }
}
