/**
 * @File   : Label.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Date   : 8/12/2019, 7:30:44 PM
 * @Description:
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import Material from '../materials/GUIMaterial';
import {IUpdatePayload, isTextureProp, TTextureProp} from '../types';

/**
 * 标签的初始化参数接口。
 */
export interface ILabelPropTypes extends IContainerPropTypes{
  // style

  /**
   * Label的文字内容
   */
  text?: string;
  /**
   * Label文字对齐方式（参照canvas中的textAlign）
   * ``center``、``left``、``right``
   */
  textAlign?: string;
  /**
   * Label文字基线位置（参照cnavas中的textBaseline）
   * ``middle``、``top``、``bottom``
   */
  textBaseline?: string;
  /**
   * Label文字颜色
   */
  fontColor?: Sein.Color;
  /**
   * Label文字大小（参照canvas文本绘制）
   * 
   * @default 14
   */
  fontSize?: number;
  /**
   * Label文字字体样式
   */
  fontStyle?: string;
  /**
   * Label文字字体粗细（参照canvas中的fontWeight）
   * ``normal``、``bold``
   */
  fontWeight?: string;
  /**
   * Lable边框粗细（参照canvas中的stroke）
   * e.g. ``4``
   */
  border?: number;
  /**
   * Label边框颜色
   */
  borderColor?: Sein.Color;
}

@Sein.SClass({className: 'GUILabelElement'})
export class LabelElement<IPropTypes extends ILabelPropTypes = ILabelPropTypes> extends ContainerElement<IPropTypes> {
  public createMaterial(props: IPropTypes) {
    // const atlas = this.allocateFrame(props);
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: this.getTexture(props),
        u_transformMatrix: this.transformMatrix
      },
      transparent: props.transparent || false,
    });
  }

  // private allocateFrame(props: IPropTypes): {atlas: Sein.AtlasManager, frame: string} {
  //   const screenRatio = this._layer.screenRatio;
  //   const width = props.shape.x * screenRatio;
  //   const height = props.shape.y * screenRatio;
  //   return this.system.allocateFrame({w: width, h: height}, this.drawOnSelf);
  // }

  /**
   * 在共有的canvas上绘制
   * 
   * @returns {texture: Sein.Texture, uvMatrix: Sein.Matrix3}
   */
  private getTexture(props: IPropTypes): TTextureProp  {
    const screenRatio = this._layer.screenRatio;
    const pixelRatio = this._system.getGame().renderer.pixelRatio;
    const width = this._props.shape.x * screenRatio * pixelRatio;
    const height = this._props.shape.y * screenRatio * pixelRatio;

    this._system.clearCanvas(width, height);
    this.drawOnSelf(this._system.context, {x: 0, y: 0, w: width, h: height});

    const resizedWidth = this.nextPowerOfTwo(width);
    const resizedHeight = this.nextPowerOfTwo(height);

    const image = this._system.context.getImageData(0, 0, resizedWidth, resizedHeight);
    const uvMatrix = this.getUVMatrix(width, height, resizedWidth, resizedHeight);
    return {texture: this.system.createTexture(image), uvMatrix: uvMatrix};
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

    const preFontColor = preProps.fontColor || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    const nextFontColor = nextProps.fontColor || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    const preBorderColor = preProps.borderColor || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    const nextBorderColor = nextProps.borderColor || new Sein.Color(1.0, 1.0, 1.0, 1.0);

    res.others = res.others
      || preProps.text !== nextProps.text
      || preProps.textAlign !== nextProps.textAlign
      || preProps.textBaseline !== nextProps.textBaseline
      || !(preFontColor.equals(nextFontColor))
      || preProps.fontSize !== nextProps.fontSize
      || preProps.fontStyle !== nextProps.fontStyle
      || preProps.fontWeight !== nextProps.fontWeight
      || preProps.border !== nextProps.border
      || !(preBorderColor.equals(nextBorderColor));
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
    const {material} = this.mesh;
    const bg = this.getTexture(nextProps);
    material.setUniform('u_background', bg.texture);
    material.setUniform('u_backgroundUVMatrix', bg.uvMatrix);
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
    const {pixelRatio} = this.system.getGame().renderer;
    const screenRatio = this._layer.screenRatio;

    const width = this._props.shape.x * screenRatio * pixelRatio;
    const height = this._props.shape.y * screenRatio * pixelRatio;
    const x = (this._props.x ? this._props.x : 0) * screenRatio * pixelRatio + transform.x;
    const y = (this._props.y ? this._props.y : 0) * screenRatio * pixelRatio + transform.y;
    const rotation = (this._props.rotation ? -this._props.rotation : 0) + transform.rotation;
    const sx = (this._props.scaleX ? this._props.scaleX : 1.0) * transform.sx;
    const sy = (this._props.scaleY ? this._props.scaleY : 1.0) * transform.sy;

    // draw on canvas
    context.save();

    context.translate(x + width / 2, y + height / 2);
    context.rotate(rotation);
    context.scale(sx, sy);

    this.draw(context, {w: width, h: height});

    context.restore();
    
    this._children.forEach(child => {
      child.drawOnOthers(context, {x: x, y: y, rotation: rotation, sx: sx, sy: sy});
    });
  }

  /**
   * 在SystemActor动态分配的AtlasManager中的canvas上绘制Label
   * 不加入CombineContainer合并绘制
   */
  private drawOnSelf = (context: CanvasRenderingContext2D, region: {x: number, y: number, w: number, h: number}, frameName?: string) => { 
    // draw on canvas
    context.save();

    context.translate(region.x + region.w / 2, region.y + region.h / 2);
    this.draw(context, {w: region.w, h: region.h});

    context.restore();
  }

  /**
   * 实际绘制函数
   * 
   * @param context canvas 2D上下文
   * @param shape 组件长宽
   */
  private draw(context: CanvasRenderingContext2D, shape: {w: number, h: number}) {
    const background = this._props.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    const text = this._props.text || 'Text';
    const textAlign = this._props.textAlign || 'center';
    const textBaseline = this._props.textBaseline || 'middle';
    const fontColor = this._props.fontColor || new Sein.Color(0, 0, 0, 1.0);
    const fontSize = `${~~((this._props.fontSize || 14) * this._layer.screenRatio * this._system.getGame().renderer.pixelRatio)}px`;
    const fontStyle = this._props.fontStyle || 'sans-serif';
    const fontWeight = this._props.fontWeight || 'normal';
    const border = this._props.border || 0;
    const borderColor = this._props.borderColor || new Sein.Color(0, 0, 0, 1.0);

    if (Sein.isColor(background)) {
      context.fillStyle = this.convertColor(background);
      context.fillRect(-shape.w / 2, -shape.h / 2, shape.w, shape.h);
      if (border > 0) {
        context.strokeStyle = this.convertColor(borderColor);
        context.lineWidth = border;
        context.strokeRect(-shape.w / 2, -shape.h / 2, shape.w, shape.h);
      }
    }
    else if (Sein.isTexture(background)) {
      const img = background.image as HTMLImageElement;
      context.drawImage(img, 0, 0, img.width, img.height, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    }
    else if (isTextureProp(background)) {
      const img = background.texture.image as HTMLImageElement;
      context.drawImage(img, 0, 0, img.width, img.height, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    }
    else {
      const imgWhole = background.atlas.image;
      const imgFrame = background.atlas.getFrame(background.frame);
      context.drawImage(imgWhole, imgFrame.x, imgFrame.y, imgFrame.w, imgFrame.h, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    }

    context.font = fontWeight + ' ' + fontSize + ' ' + fontStyle;
    switch (textAlign) {
      case 'center':
        context.textAlign = 'center';
        break;
      case 'left':
        context.textAlign = 'left';
        break;
      case 'right':
        context.textAlign = 'right';
        break;
      default:
        context.textAlign = 'center';
    }
    switch (textBaseline) {
      case 'middle':
        context.textBaseline = 'middle';
        break;
      case 'top':
        context.textBaseline = 'top';
        break;
      case 'bottom':
        context.textBaseline = 'bottom';
        break;
      default:
        context.textBaseline = 'middle';
        break;
    }
    context.fillStyle = this.convertColor(fontColor);
    context.fillText(text, 0, 0);
  }
}

export function Label(props: ILabelPropTypes) {
    return React.createElement('Label', props, props.children);
}