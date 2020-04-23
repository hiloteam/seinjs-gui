/**
 * @File   : Container.tsx
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Date   : 8/12/2019, 7:23:25 PM
 * 
 */
import * as Sein from 'seinjs';
import * as React from 'react';

import Material from '../materials/GUIMaterial';
import SystemActor from '../actors/SystemActor';
import Event from '../event/Event';
import Touch from '../event/Touch';
import {TImageProp, IUpdatePayload, isAtlasProp, isTextureProp} from '../types';
import Layer from '../renderer/Layer';

/**
 * 基础容器的初始化参数接口。
 */
export interface IContainerPropTypes {
  shape: Sein.Vector2;

  // transform
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;

  // style
  id?: string;
  background?: Sein.Color | TImageProp;
  transparent?: boolean;
  visibility?: boolean;

  // events
  onTouchStart?: (event: Event) => void;
  onTouchEnd?: (event: Event) => void;
  onTouchMove?: (event: Event) => void;
  onTouchCancel?: () => void;
  onClick?: (event: Event) => void;

  // hidden
  /**
   * @hidden
   */
  children?: React.ReactNode;
}

/**
 * Container的包围盒
 */
export interface Bound {
  /**
   * 分别表示Container的四个顶点坐标
   */
  pointNW: Sein.Vector3;
  pointNE: Sein.Vector3;
  pointSE: Sein.Vector3;
  pointSW: Sein.Vector3;
  /**
   * 表示Container在game坐标系下位置对应x轴和y轴的坐标极值
   */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /**
   * 标志Container是否经过旋转
   */
  ifRotated: boolean;
}

/**
 * 基础容器。
 */
@Sein.SClass({ className: 'GUIContainerElement' })
export class ContainerElement<IPropTypes extends IContainerPropTypes = IContainerPropTypes> extends Sein.SObject {
  public mesh: Sein.Mesh;
  public transformMatrix: Sein.Matrix3;
  public bound: Bound;

  protected _props: IPropTypes;
  protected _layer: Layer;
  protected _system: SystemActor;
  protected _parent: ContainerElement;
  protected _children: Sein.SArray<ContainerElement> = new Sein.SArray();

  protected _gameWidth: number;
  protected _gameHeight: number;

  protected _mark: boolean = false;
  protected _visibility: boolean = true;

  protected _offset: {offsetX: number, offsetY: number} = {offsetX: 0, offsetY: 0};

  /**
   * 当前的Props。
   */
  get props() {
    return this._props;
  }

  /**
   * 获取父级容器的引用。
   * 
   * 若为`undefined`，则是根容器。
   */
  get parent() {
    return this._parent;
  }

  /**
   * 获取子元素的引用。
   */
  get children() {
    return this._children;
  }

  /**
   * 获取父级图层的引用。
   */
  get layer() {
    return this._layer;
  }

  /**
   * 获取GUI系统的引用。
   */
  get system() {
    return this._system;
  }

  /**
   * **不要自己使用！**
   * 判断一个容器是否是合成容器。
   * 
   * @hidden
   */
  get mark() {
    return this._mark;
  }
 
  constructor(props: IPropTypes, layer: Layer) {
    super();
    const system = layer.system;
    this._gameWidth = system.getGame().bound.width;
    this._gameHeight = system.getGame().bound.height;

    this._layer = layer;
    this._props = props;
    this._system = system;
    this.transformMatrix = new Sein.Matrix3();
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public addChild(child: ContainerElement) {
    child._parent = this;
    child.added();
    this._children.add(child);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public addChildBefore(child: ContainerElement, pre: ContainerElement) {
    child.added();
    this._children.insert(this._children.indexOf(pre), child);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public removeChild(child: ContainerElement) {
    this._children.remove(child);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public added() {
    if (this._parent && this._parent._mark) {
      return;
    }
    if (this.judgeCombineChild()) {
      return;
    }
    this.createMesh(this._props);
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public createMesh(props: IPropTypes) {
    const screenRatio = this._layer.screenRatio;

    const geometry = this.createGeometry(props.shape.x * screenRatio, props.shape.y * screenRatio);
    const material = this.createMaterial(props);

    this.mesh = new Sein.Mesh({geometry, material});
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   */
  public createMaterial(props: IPropTypes) {
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: props.background || new Sein.Color(1.0, 1.0, 1.0, 1.0),
        u_transformMatrix: this.transformMatrix
      },
      transparent: props.transparent || false
    });
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
  public checkUpdate(preProps: IPropTypes, nextProps: IPropTypes): IUpdatePayload {
    const preBackground = preProps.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    const nextBackground = nextProps.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    let backgroundChanged: boolean;
    if (Sein.isColor(preBackground) && Sein.isColor(nextBackground)) {
      backgroundChanged = !(preBackground.equals(nextBackground));
    }
    else if (Sein.isTexture(preBackground) && Sein.isTexture(nextBackground)) {
      backgroundChanged = preBackground !== nextBackground;
    }
    else if (isAtlasProp(preBackground) && isAtlasProp(nextBackground)) {
      backgroundChanged = preBackground.atlas !== nextBackground.atlas || preBackground.frame !== nextBackground.frame;
    }
    else {
      backgroundChanged = true;
    }
    return {
      transform: preProps.x !== nextProps.x
        || preProps.y !== nextProps.y
        || preProps.scaleX !== nextProps.scaleX
        || preProps.scaleY !== nextProps.scaleY
        || preProps.rotation !== nextProps.rotation
        || !(preProps.shape.equals(nextProps.shape)),
      others: preProps.visibility !== nextProps.visibility
        || preProps.transparent !== nextProps.transparent
        || backgroundChanged
    };
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 根据新props和更新的标记options更新组件变换和样式
   * @param nextProps 新props
   * @param options 标记props更新为组件的变换还是纹理
   */
  public update(nextProps: IPropTypes, options: IUpdatePayload) {
    if (!options.transform && !options.others) {
      return;
    }

    this._props = nextProps;
    const {material} = this.mesh;

    if (options.transform) {
      // update the tranform matrix and bound from the current node to its leaf node
      this.setMatrix();
      material.setUniform('u_transformMatrix', this.transformMatrix);
    }
    if (options.others) {
      if (nextProps.background) {
        if (isAtlasProp(nextProps.background)) {
          material.setUniform('u_background', nextProps.background.atlas.texture);
          material.setUniform('u_backgroundUVMatrix', nextProps.background.atlas.getUVMatrix(nextProps.background.frame));
        } else if (isTextureProp(nextProps.background)) {
          material.setUniform('u_background', nextProps.background.texture);
          material.setUniform('u_backgroundUVMatrix', nextProps.background.uvMatrix);
        } else {
          material.setUniform('u_background', nextProps.background);
        }
      }
    }
    
    material.transparent = nextProps.transparent || false;
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 根据参数更新Container自身组件的变换矩阵
   * @param x Container在x轴方向上的位移
   * @param y Container在y轴方向上的位移
   * @param rotation Container的旋转角度（弧度制）
   * @param scaleX Container在x轴方向上的缩放
   * @param scaleY Container在y轴方向上的缩放
   * @param width Container的宽
   * @param height Container的高
   */
  public updateMatrix(x: number, y: number, rotation: number, scaleX: number, scaleY: number, width: number, height: number) {
    // update self matrix
    this.transformMatrix.set(
      scaleX * Math.cos(rotation),
      scaleX * Math.sin(rotation),
      0,
      -scaleY * Math.sin(rotation),
      scaleY * Math.cos(rotation),
      0,
      (-scaleX * width * Math.cos(rotation) - scaleY * height * Math.sin(rotation) + width) / 2 + x,
      (-scaleX * width * Math.sin(rotation) + scaleY * height * Math.cos(rotation) - height) / 2 - y,
      1
    );
  }

  /**
   * 用于Scroll组件中Container移动
   * 
   * @param x Container组件在Scroll组件中x移动量
   * @param y Container组件在Scroll组件中y移动量
   */
  public setOffset(deltaX: number, deltaY: number) {
    this._offset.offsetX += deltaX;
    this._offset.offsetY += deltaY;

    // update transform matrix
    this.transformMatrix.elements[6] += deltaX;
    this.transformMatrix.elements[7] += deltaY;

    // update bound 
    this.setBounds(this.transformMatrix);

    // judge screen and parent occulusion
    if (this.dealWithOcclusion()) {
      this._visibility = false;
    }
    else {
      this._visibility = true;
    }

    this._children.forEach(child => {
      child.setMatrix();
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 根据父组件更新其变换矩阵并设置包围盒
   * 递归更新其子组件的变换矩阵和包围盒
   */
  public setMatrix() {
    const screenRatio = this._layer.screenRatio;

    const x = (this._props.x === undefined ? 0 : this._props.x) + this._offset.offsetX;
    const y = (this._props.y === undefined ? 0 : this._props.y) + this._offset.offsetY;
    const rotation = this._props.rotation === undefined ? 0 : this._props.rotation;
    const scaleX = this._props.scaleX === undefined ? 1 : this._props.scaleX;
    const scaleY = this._props.scaleY === undefined ? 1 : this._props.scaleY;
    this.updateMatrix(
      x * screenRatio,
      y * screenRatio,
      rotation,
      scaleX,
      scaleY,
      this._props.shape.x * screenRatio,
      this._props.shape.y * screenRatio);

    // set matrix according to its parent
    if (this._parent) {
      this.transformMatrix.premultiply(this._parent.transformMatrix);
    }
    else {
      this.transformMatrix.elements[6] -= this._gameWidth / 2;
      this.transformMatrix.elements[7] += this._gameHeight / 2;
    }

    if (this.mesh) {
      this.mesh.material.setUniform('u_transformMatrix', this.transformMatrix);
    }
    
    // set the bound according to its parent transform
    this.setBounds(this.transformMatrix);
    if (this._parent && this._parent.bound.ifRotated) {
      this.bound.ifRotated = true;
    }
    
    // judge screen and parent occulusion
    if (this.dealWithOcclusion()) {
      this._visibility = false;
    }
    else {
      this._visibility = true;
    }

    this._children.forEach(child => {
      child.setMatrix();
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 根据点击事件的位置信息从根节点向下捕获事件的target
   * @param touch 触摸事件位置信息
   */
  public searchTarget(touch: Touch) {
    if (this._props.visibility === false || !this.dealWithInteraction(touch)) {
      return;
    }

    for (let i = this._children.length - 1; i >= 0; i--) {
      this._children.get(i).searchTarget(touch);
    }

    if (touch.target === null) {
      touch.target = this;
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchStart事件向上冒泡
   * @param event 事件
   */
  public bubbleTouchStart(event: Event) {
    event.currentTarget = this;
    if (this._props.onTouchStart) {
      this._props.onTouchStart(event);
    }
    if (event.bubbles && this._parent) {
      this._parent.bubbleTouchStart(event);
    }
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
    event.currentTarget = this;
    if (this._props.onTouchMove) {
      this._props.onTouchMove(event);
    }
    if (event.bubbles && this._parent) {
      this._parent.bubbleTouchMove(event);
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchEnd事件向上冒泡
   * @param event 事件
   */
  public bubbleTouchEnd(event: Event) {
    event.currentTarget = this;
    if (this._props.onTouchEnd) {
      this._props.onTouchEnd(event);
    }
    if (event.bubbles && this._parent) {
      this._parent.bubbleTouchEnd(event);
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * TouchCancel事件向上冒泡
   */
  public handleTouchCancel() {
    for (let i = this._children.length - 1; i >= 0; i--) {
      this._children.get(i).handleTouchCancel();
    }
    if (this._props.onTouchCancel) {
      this._props.onTouchCancel();
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * Click事件向上冒泡
   */
  public bubbleClick(event: Event) {
    event.currentTarget = this;
    if (this._props.onClick) {
      this._props.onClick(event);
    }
    if (event.bubbles && this._parent) {
      this._parent.bubbleClick(event);
    }
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 根据触摸事件的位置信息和包围盒进行相交检测（hitTest）
   * @param touch 触摸事件的位置信息
   */
  public dealWithInteraction(touch: Touch): boolean {
    const x = touch.pageX;
    const y = touch.pageY;
    let hit = false;
    if (x <= this.bound.maxX && x >= this.bound.minX && y <= this.bound.maxY && y >= this.bound.minY) {
      if (this.bound.ifRotated) {
        const vecx = new Sein.Vector2(this.bound.pointNE.x - this.bound.pointNW.x, this.bound.pointNE.y - this.bound.pointNW.y);
        const vecy = new Sein.Vector2(this.bound.pointSW.x - this.bound.pointNW.x, this.bound.pointSW.y - this.bound.pointNW.y);
        const v = new Sein.Vector2(x - this.bound.pointNW.x, y - this.bound.pointNW.y);

        const width = vecx.length();
        const height = vecy.length();
        const xComponent = v.dot(vecx.normalize());
        const yComponent = v.dot(vecy.normalize());

        if (xComponent <= width && xComponent >= 0 && yComponent <= height && yComponent >= 0) {
          hit = true;
        }
      }
      else {
        hit = true;
      }
    }
    return hit;
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 从根节点搜索CombineContainer并触发调用CombineContainer的allocateAtlas方法合并图集进行绘制
   */
  public combineAtlas() {
    if (this._mark) {
      (this as any).allocateAtlas();
      return;
    }
    this._children.forEach(child => {
      child.combineAtlas();
    });
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 在CombineContainer中动态分配的AtlasManager中的canvas中合并绘制
   * @param context 从CombineContainer中传递的canvas context
   * @param transform 相对于CombineContainer父节点的变换
   */
  public drawOnOthers(
    context: CanvasRenderingContext2D,
    transform: {x: number, y: number, rotation: number, sx: number, sy: number}
  ) {
    const pixelRatio = this.system.getGame().renderer.pixelRatio;
    const screenRatio = this._layer.screenRatio;

    const width = this._props.shape.x * screenRatio * pixelRatio;
    const height = this._props.shape.y * screenRatio * pixelRatio;
    const x = (this._props.x ? this._props.x : 0) * screenRatio * pixelRatio + transform.x;
    const y = (this._props.y ? this._props.y : 0) * screenRatio * pixelRatio + transform.y;
    const rotation = (this._props.rotation ? -this._props.rotation : 0) + transform.rotation;
    const scaleX = (this._props.scaleX ? this._props.scaleX : 1.0) * transform.sx;
    const scaleY = (this._props.scaleY ? this._props.scaleY : 1.0) * transform.sy;

    context.save();

    context.translate(x + width / 2, y + height / 2);
    context.rotate(rotation);
    context.scale(scaleX, scaleY);

    const background = this._props.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    if (Sein.isColor(background)) {
      context.fillStyle = this.convertColor(background);
      context.fillRect(-width / 2, -height / 2, width, height);
    }
    else if (Sein.isTexture(background)) {
      const img = background.image as HTMLCanvasElement;
      context.drawImage(img, 0, 0, img.width, img.height, -width / 2, -height / 2, width, height);
    }
    else if (isTextureProp(background)) {
      const img = background.texture.image as HTMLCanvasElement;
      context.drawImage(img, 0, 0, img.width, img.height, -width / 2, -height / 2, width, height);
    }
    else {
      const imgWhole = background.atlas.image;
      const imgRegion = background.atlas.getFrame(background.frame);
      context.drawImage(imgWhole, imgRegion.x, imgRegion.y, imgRegion.w, imgRegion.h, -width / 2, -height / 2, width, height);
    }
    context.restore();

    this._children.forEach(child => {
      child.drawOnOthers(context, {x: x, y: y, rotation: rotation, sx: scaleX, sy: scaleY});
    });
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

    if (this._parent && this._parent._mark) {
      return;
    }

    if (!this.mesh) {
      return;
    }

    const renderer = this.system.getGame().renderer;
    renderer.renderMesh(this.mesh);
    this._children.forEach(child => {
      child.render();
    });
  }

  /**
   * 根据Container的变换矩阵设置Container的包围盒
   * @param transformMatrix Container的变换矩阵
   */
  public setBounds(transformMatrix: Sein.Matrix3) {
    const transform = transformMatrix.clone().transpose();

    const screenRatio = this._layer.screenRatio;
    const width = this._props.shape.x * screenRatio;
    const height = this._props.shape.y * screenRatio;

    const pointNW = this.transformPoint(transform, new Sein.Vector3(0, 0, 1));
    const pointNE = this.transformPoint(transform, new Sein.Vector3(width, 0, 1));
    const pointSE = this.transformPoint(transform, new Sein.Vector3(width, -height, 1));
    const pointSW = this.transformPoint(transform, new Sein.Vector3(0, -height, 1));

    const xArray = new Float32Array([pointNW.elements[0], pointNE.elements[0], pointSE.elements[0], pointSW.elements[0]]);
    const yArray = new Float32Array([pointNW.elements[1], pointNE.elements[1], pointSE.elements[1], pointSW.elements[1]]);
    xArray.sort();
    yArray.sort();

    const rotated = ((this._props.rotation === undefined) || (this._props.rotation % (Math.PI * 2) === 0)) ? false : true;

    this.bound = {
      pointNW: pointNW,
      pointNE: pointNE,
      pointSE: pointSE,
      pointSW: pointSW,
      minX: xArray[0],
      maxX: xArray[3],
      minY: yArray[0],
      maxY: yArray[3],
      ifRotated: rotated
    };
  }

  /**
   * 将``Sein.Color``转化为``#xxxxxx``的颜色格式
   * 方便在canvas上绘制
   * @param color 
   */
  protected convertColor(color: Sein.Color) {
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + color.a + ')';
  }

  /**
   * 根据包围盒判断Container是否完全移出可视范围外
   */
  protected dealWithOcclusion(): boolean {
    if (this._parent && this._parent.bound && this.bound) {
      if (this.bound.maxX <= this._parent.bound.minX || this.bound.minX >= this._parent.bound.maxX || this.bound.maxY <= this._parent.bound.minY || this.bound.minY >= this._parent.bound.maxY) {
        return true;
      }
    }
    if (this.bound) {
      if (this.bound.maxY <= 0 || this.bound.minX >= this._gameWidth || this.bound.maxY <= 0 || this.bound.minY >= this._gameHeight) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算比``num``大的最小2的整次幂数
   * 
   * @param num 数
   */
  protected nextPowerOfTwo(num: number): number {
    let base = 64;
    while(num > base) {
      base *= 2;
    }
    return base;
  }

  /**
   * 
   * @param width 组件原宽度
   * @param height 组件原高度
   * @param resizedWidth 比组件宽度大的最小2的整次幂
   * @param resizedHeight 比组件高度大的最小2的整次幂
   */
  protected getUVMatrix(width: number, height: number, resizedWidth: number, resizedHeight: number): Sein.Matrix3 {
    const matrix = new Sein.Matrix3();
    // flipY
    matrix.set(
      width / resizedWidth,
      0,
      0,
      0,
      -height / resizedHeight,
      0,
      0,
      height / resizedHeight,
      1
    );
    return matrix;
  }


  /**
   * 根据参数生成左上角顶点位于game屏幕中央的几何平面
   * @param width 宽
   * @param height 高
   * @param widthSegments 宽分段数
   * @param heightSegments 高分段数
   */
  private createGeometry(width: number, height: number, widthSegments: number = 1, heightSegments: number = 1): Sein.Geometry {
    const diffW = width / widthSegments;
    const diffH = height / heightSegments;
    const count = (widthSegments + 1) * (heightSegments + 1);

    const vertices = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const indices = new Uint16Array(widthSegments * heightSegments * 6);

    let indicesIdx = 0;
    for (let h = 0; h <= heightSegments; h++) {
      for (let w = 0; w <= widthSegments; w++) {
        let idx = h * (widthSegments + 1) + w;
        vertices[idx * 3] = w * diffW;
        vertices[idx * 3 + 1] = -h * diffH;
        uvs[idx * 2] = w / widthSegments;
        uvs[idx * 2 + 1] = 1 - h / heightSegments;

        if (h < heightSegments && w < widthSegments) {
          let lb = (h + 1) * (widthSegments + 1) + w;
          indices[indicesIdx++] = idx;
          indices[indicesIdx++] = lb;
          indices[indicesIdx++] = lb + 1;
          indices[indicesIdx++] = idx;
          indices[indicesIdx++] = lb + 1;
          indices[indicesIdx++] = idx + 1;
        }
      }
    }

    const geometry = new Sein.Geometry({
      vertices: new Sein.GeometryData(vertices, 3),
      indices: new Sein.GeometryData(indices, 1),
      uvs: new Sein.GeometryData(uvs, 2)
    });
    return geometry;
  }

  /**
   * 根据变换矩阵计算变换后点的位置（用于Container包围盒顶点的计算）
   * @param transformMatrix 变换矩阵
   * @param point 点
   */
  private transformPoint(transformMatrix: Sein.Matrix3, point: Sein.Vector3): Sein.Vector3 {
    const a00 = transformMatrix.elements[0]; const a01 = transformMatrix.elements[1]; const a02 = transformMatrix.elements[2];
    const a10 = transformMatrix.elements[3]; const a11 = transformMatrix.elements[4]; const a12 = transformMatrix.elements[5];
    const a20 = transformMatrix.elements[6]; const a21 = transformMatrix.elements[7]; const a22 = transformMatrix.elements[8];

    const v0 = point.elements[0]; const v1 = point.elements[1]; const v2 = point.elements[2];

    const newPoint = new Sein.Vector3(
      a00 * v0 + a01 * v1 + a02 * v2,
      a10 * v0 + a11 * v1 + a12 * v2,
      a20 * v0 + a21 * v1 + a22 * v2
    );
    newPoint.elements[0] += this._gameWidth / 2;
    newPoint.elements[1] = -(newPoint.elements[1] - this._gameHeight / 2);

    return newPoint;
  }

  /**
   * 判断该组件是否为Combine组件的子元素
   */
  private judgeCombineChild(): boolean {
    let parent = this._parent;
    let result = false;
    while(parent) {
      if (parent._mark) {
        result = true;
        break;
      }
      parent = parent._parent;
    }
    return result;
  }
}

/**
 * 基础容器
 */
export function Container(props: IContainerPropTypes) {
  return React.createElement('Container', props, props.children);
}
