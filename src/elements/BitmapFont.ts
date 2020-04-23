/**
 * @File   : BitmapFont.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 9/23/2019, 5:01:32 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import Material from '../materials/GUIMaterial';
import {IUpdatePayload, TTextureProp, isTextureProp} from '../types';

export interface IBitmapFontPropTypes extends IContainerPropTypes {
  /**
   * bitmap font字体库
   */
  fontLibrary: Sein.AtlasManager;
  /**
   * 文字内容
   * 
   * **用`\n``分行**
   * **文本中涉及的文本字必须包含在自定义字体库中**
   */
  text: string;
  /**
   * 字体大小
   */
  fontSize: number;
  /**
   * 文本的对齐
   * 
   * @default 'center'
   * 
   * **单行文本默认左对齐**
   */
  align?: string;
  /**
   * 行高
   * 
   * @default fontSize
   */
  lineHeight?: number;
  /**
   * 字距
   * 
   * @default 0
   */
  spaceWidth?: number;
  /**
   * 行距
   * 
   * @default 0
   */
  spaceHeight?: number;
}

/**
 * 单行文本信息
 */
interface lineText {
  /**
   * 单行文本总宽度
   */
  width: number;
  /**
   * 单行文本内容
   */
  text: string;
}

@Sein.SClass({className: 'GUIBitMapFontElement'})
export class BitmapFontElement<IPropTypes extends IBitmapFontPropTypes = IBitmapFontPropTypes> extends ContainerElement<IPropTypes> {
  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 创建材质
   * @param props props
   */
  public createMaterial(props: IPropTypes) {
    // const atlas = this.allocateFrame(props);
    return new Material({
      layer: this._layer,
      uniforms: {
        u_background: this.getTexture(props),
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
   * 检查props更新
   * 
   * @param preProps 原props
   * @param nextProps 新props
   */
  public checkUpdate(preProps: IPropTypes, nextProps: IPropTypes) {
    const res = super.checkUpdate(preProps, nextProps);
    res.others = res.others ||
      preProps.text !== nextProps.text ||
      preProps.fontSize !== nextProps.fontSize ||
      preProps.align !== nextProps.align ||
      preProps.lineHeight !== nextProps.lineHeight ||
      preProps.spaceWidth !== nextProps.spaceWidth ||
      preProps.spaceHeight !== nextProps.spaceHeight;
    return res;
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 
   * 根据新props和更新的标记options更新组件变换和样式
   * 
   * @param nextProp 新props
   * @param options 标记props更新为组件的变换还是纹理
   */
  public update(nextProps: IPropTypes, options: IUpdatePayload) {
    super.update(nextProps, options);
    if (!options.others) {
      return;
    }
    const newBackground = this.getTexture(nextProps);
    const material = this.mesh.material;
    material.setUniform('u_background', newBackground.texture);
    material.setUniform('u_backgroundUVMatrix', newBackground.uvMatrix);
  }

  /**
   * 在SystemActor动态分配的AtlasManager中的canvas上绘制Label
   * 不加入CombineContainer合并绘制
   */
  private drawOnSelf = (context: CanvasRenderingContext2D, region: {x: number, y: number, w: number, h: number}) => {
    context.save();

    context.translate(region.x + region.w / 2, region.y + region.h / 2);
    this.draw(context, {w: region.w, h: region.h});

    context.restore();
  }

  /**
   * @hidden
   * 
   * **不建议自己调用**
   * 
   * 在CombineContainer中动态分配的AtlasManager中的canvas中合并绘制
   * 
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
   * 实际绘制函数
   * 
   * @param context canvas 2D上下文
   * @param shape 组件长宽
   */
  private draw(context: CanvasRenderingContext2D, shape: {w: number, h: number}) {
    const background = this._props.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);

    // draw background
    if (Sein.isColor(background)) {
      context.fillStyle = this.convertColor(background);
      context.fillRect(-shape.w / 2, -shape.h / 2, shape.w, shape.h);
    } else if (Sein.isTexture(background)) {
      const img = background.image as HTMLImageElement;
      context.drawImage(img, 0, 0, img.width, img.height, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    } else if (isTextureProp(background)) {
      const imgWhole = background.texture.image as HTMLImageElement;
      context.drawImage(imgWhole, 0, 0, shape.w, shape.h, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    } else {
      const imgWhole = background.atlas.image;
      const imgFrame = background.atlas.getFrame(background.frame);
      context.drawImage(imgWhole, imgFrame.x, imgFrame.y, imgFrame.w, imgFrame.h, -shape.w / 2, -shape.h / 2, shape.w, shape.h);
    }

    // draw font with multiple lines
    const fontLibrary = this._props.fontLibrary;
    const lineHeight = this._props.lineHeight || this._props.fontSize;
    const spaceWidth = this._props.spaceWidth || 0;
    const spaceheight = this._props.spaceHeight || 0;
    const align = this._props.align || 'center';

    const {textArea, ratio, width, height} = this.setTextArea();
    let widthIndex: number;
    let heightIndex: number = -height / 2 + lineHeight;
    if (align === 'left') {
      widthIndex = -shape.w / 2;
    } else if (align === 'right') {
      widthIndex = shape.w / 2 - width;
    } else {
      widthIndex = -width / 2;
    }

    for (let i = 0; i < textArea.length; i++) {
      const line = textArea[i];
      for (let j = 0; j < line.text.length; j++) {
        const frame = fontLibrary.getFrame(line.text.charAt(j));
        context.drawImage(
          fontLibrary.image,
          frame.x,
          frame.y,
          frame.w, 
          frame.h,
          widthIndex,
          heightIndex - frame.h * ratio,
          frame.w * ratio,
          frame.h * ratio
        );
        widthIndex += frame.w * ratio + spaceWidth;
      }
      widthIndex = -width / 2;
      heightIndex += lineHeight + spaceheight;
    }
  }

  // /**
  //  * 动态分配图集
  //  * 
  //  * @param props props
  //  */
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
  private getTexture(props: IPropTypes): TTextureProp {
    const screenRatio = this._layer.screenRatio;
    const pixelRatio = this._system.getGame().renderer.pixelRatio;
    const width = props.shape.x * screenRatio * pixelRatio;
    const height = props.shape.y * screenRatio * pixelRatio;

    this.system.clearCanvas(width, height);
    this.drawOnSelf(this._system.context, {x: 0, y: 0, w: width, h: height});

    const resizedWidth = this.nextPowerOfTwo(width);
    const resizedHeight = this.nextPowerOfTwo(height);

    const image = this._system.context.getImageData(0, 0, resizedWidth, resizedHeight);
    const uvMatrix = this.getUVMatrix(width, height, resizedWidth, resizedHeight);
    return {texture: this.system.createTexture(image), uvMatrix: uvMatrix};
  }

  /**
   * 计算bitmap text文字区域
   */
  private setTextArea() : {textArea: lineText[], ratio: number, width: number, height: number} {
    const text = this._props.text;
    const fontLibrary = this._props.fontLibrary;
    const fontSize = this._props.fontSize;
    const lineHeight = this._props.lineHeight || fontSize;
    const spaceWidth = this._props.spaceWidth || 0;
    const spaceHeight = this._props.spaceHeight || 0;

    let maxHeight: number = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charAt(i) === "\n") {
        continue;
      }
      const frame = fontLibrary.getFrame(text.charAt(i));
      maxHeight = maxHeight < frame.h ? frame.h : maxHeight;
    }
    const ratio = fontSize / maxHeight;

    let totalWidth: number = 0;
    let line: string = "";
    let textArea: lineText[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      if (char === "\n") {
        totalWidth = totalWidth > 0 ? totalWidth - spaceWidth : 0;
        textArea.push({width: totalWidth, text: line});
        totalWidth = 0;
        line = "";
        continue;
      } else {
        const frame = fontLibrary.getFrame(char);
        totalWidth += frame.w * ratio + spaceWidth;
        line += char;
      }
    }
    totalWidth = totalWidth > 0 ? totalWidth - spaceWidth : 0;
    textArea.push({width: totalWidth, text: line});

    let maxWidth: number = 0;
    let totalHeight: number = 0;

    for (let j = 0; j < textArea.length; j++) {
      maxWidth = maxWidth < textArea[j].width ? textArea[j].width : maxWidth;
      totalHeight += lineHeight + spaceHeight;
    }
    totalHeight -= spaceHeight;

    return {textArea: textArea, ratio: ratio, width: maxWidth, height: totalHeight};
  }

}

export function BitmapFont(props: IBitmapFontPropTypes) {
  return React.createElement('BitmapFont', props, props.children);
}