/**
 * @File   : Combine.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 8/23/2019, 3:18:43 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IContainerPropTypes, ContainerElement} from './Container';
import Material from '../materials/GUIMaterial';

import {TTextureProp, isTextureProp} from '../types'

/**
 * 合成组件的初始化参数列表。
 */
export interface ICombinePropTypes extends IContainerPropTypes{
}

/**
 * 合成组件。
 */
@Sein.SClass({className: 'GUICombineElement'})
export class CombineElement<
  IPropTypes extends ICombinePropTypes = ICombinePropTypes
> extends ContainerElement<IPropTypes> {
  protected _mark = true;

  public createMaterial(props: IPropTypes) {
    // const atlas = this.allocateAtlas(props);
    return new Material({
      layer: this.layer,
      uniforms: {
        u_background: this.getTexture(props),
        u_transformMatrix: this.transformMatrix
      },
      transparent: props.transparent
    });
  }

  // /**
  //  * 从SystemActor中分配图集
  //  */
  // public allocateAtlas(props: IPropTypes): {atlas: Sein.AtlasManager, frame: string} {
  //   const pixelRatio = this._system.getGame().renderer.pixelRatio;
  //   const screenRatio = this._layer.screenRatio;

  //   const width = this._props.shape.x * screenRatio * pixelRatio;
  //   const height = this._props.shape.y * screenRatio * pixelRatio;
  //   const region = {w: width, h: height, space: 4};
    
  //   const size = this._system.atlasManagerPool.length;
  //   let atlasManager: Sein.AtlasManager;
  //   let frame: string | null;
  //   let i: number;
  //   for (i = size -1; i >= 0; i--) {
  //     atlasManager = this._system.atlasManagerPool.get(i);
  //     if ((1 - atlasManager.usage) * atlasManager.meta.size.w * atlasManager.meta.size.h < width * height) {
  //       continue;
  //     }
  //     frame = atlasManager.allocateFrame(region, this.onDraw);
  //     if (frame) {
  //       this._system.sortAtlasManagerPool();
  //       break;
  //     }
  //   }
  //   if (i < 0) {
  //     atlasManager = Sein.AtlasManager.CREATE_EMPTY({width: 2048, height: 2048});
  //     frame = atlasManager.allocateFrame(region, this.onDraw);
  //     this._system.atlasManagerPool.add(atlasManager);
  //     this._system.sortAtlasManagerPool();
  //   }

  //   return {atlas: atlasManager, frame: frame};

  //   // this.mesh.material.setUniform('u_background', atlasManager.texture);
  //   // this.mesh.material.setUniform('u_backgroundUVMatrix', atlasManager.getUVMatrix(frame));
  // }

  /**
   * 在共有的canvas上绘制
   * 
   * @returns {texture: Sein.Texture, uvMatrix: Sein.Matrix3}
   */
  private getTexture(props: IPropTypes): TTextureProp {
    const pixelRatio = this._system.getGame().renderer.pixelRatio;
    const screenRatio = this._layer.screenRatio;

    const width = this._props.shape.x * screenRatio * pixelRatio;
    const height = this._props.shape.y * screenRatio * pixelRatio;

    this._system.clearCanvas(width, height);
    this.onDraw(this._system.context, {x: 0, y: 0, w: width, h: height});

    const resizedWidth = this.nextPowerOfTwo(width);
    const resizedHeight = this.nextPowerOfTwo(height);

    const image = this._system.context.getImageData(0, 0, resizedWidth, resizedHeight);
    const uvMatrix = this.getUVMatrix(width, height, resizedWidth, resizedHeight);
    return {texture: this.system.createTexture(image), uvMatrix: uvMatrix};
  }

  /**
   * 绘制Combine并递归调用其子元素的绘制函数
   */
  private onDraw = (context: CanvasRenderingContext2D, region: {x: number, y: number, w: number, h: number}, frameName?: string) => {
    context.save();
    const background = this._props.background || new Sein.Color(1.0, 1.0, 1.0, 1.0);
    if (Sein.isColor(background)) {
      context.fillStyle = this.convertColor(background);
      context.fillRect(region.x, region.y, region.w, region.h);
    }
    else if (Sein.isTexture(background)) {
      const img = background.image as HTMLImageElement;
      context.drawImage(img, 0, 0, img.width, img.height, region.x, region.y, region.w, region.h);
    }
    else if (isTextureProp(background)) {
      const imgWhole = background.texture.image as HTMLImageElement;
      context.drawImage(imgWhole, 0, 0, imgWhole.width, imgWhole.height, region.x, region.y, region.w, region.h);
      throw Error('You May Not Directly Using {texture: Sein.Texture, uvMatrix: Sein.Matrix3} on Yourself!!!');
    }
    else {
      const imgWhole = background.atlas.image;
      const imgRegion = background.atlas.getFrame(background.frame);
      context.drawImage(imgWhole, imgRegion.x, imgRegion.y, imgRegion.w, imgRegion.h, region.x, region.y, region.w, region.h);
    }
    context.restore();

    this._children.forEach(child => {
      child.drawOnOthers(context, {x: region.x, y: region.y, rotation: 0, sx: 1.0, sy: 1.0});
    });
  }
}

/**
 * 合成组件
 */
export function Combine(props: ICombinePropTypes) {
    return React.createElement('Combine', props, props.children);
}
