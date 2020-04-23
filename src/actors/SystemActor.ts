/**
 * @File   : SystemActor.ts
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Date   : 8/12/2019, 7:08:55 PM
 * 
 */
import * as Sein from 'seinjs';

import render from '../renderer/render';
import Layer, {ILayerOptions} from '../renderer/Layer';
import Event from '../event/Event';
import {EventType} from '../event/EventType';
import Touch from '../event/Touch';
import {ContainerElement} from '../elements/Container';

/**
 * @hidden
 */
interface Point {
  Xmin: number;
  Xmax: number;
  Ymin: number;
  Ymax: number;
}

/**
 * 初始化GUI系统的`SystemActor`的配置参数。
 */
export interface ISystemActorOptions {
  /**
   * 绘制组件的画布的宽度，**必须是2的幂！**。
   * 依据可能出现的最大组件而定。
   * 
   * @default 1024
   */
  canvasWidth?: number;
  /**
   * 绘制组件的画布的高度，**必须是2的幂！**。
   * 依据可能出现的最大组件而定。
   * 
   * @default 1024
   */
  canvasHeight?: number;
}

/**
 * 判定一个对象是不是`GUISystemActor`。
 */
export function isSystemActor(value: Sein.SObject): value is SystemActor {
  return (value as SystemActor).isGUISystemActor;
}

/**
 * 一个系统Actor，用于管理所有的GUI下的层级。
 */
@Sein.SClass({className: 'GUISystemActor'})
export default class SystemActor extends Sein.RenderSystemActor<ISystemActorOptions> {
  public isGUISystemActor = true;
  public updatePriority = Sein.InfoActor.UPDATE_PRIORITY.System;

  // /**
  //  * 用于图集动态分配的AtlasManager池
  //  */
  // public atlasManagerPool: Sein.SArray<Sein.AtlasManager> = new Sein.SArray();

  /**
   * 用于绘制的canvas上下文
   */
  public context: CanvasRenderingContext2D;

  /**
   * 避免小程序释放。
   */
  protected _canvas: HTMLCanvasElement;

  /**
   * @todo priority
   */
  protected _layers: Sein.SMap<Layer> = new Sein.SMap();

  /**
   * 在PC端模拟touch事件鼠标是否按下的Flag
   */
  private _mouseDown: boolean = false;

  /**
   * 存储touchStart事件hitTest被击中的target
   */
  private _activeElements: Array<ContainerElement> = new Array<ContainerElement>();

  /**
   * 存储触摸事件触摸点坐标极值
   * 
   * 用于判断click事件
   */
  private _activePoints: Array<Point> = new Array<Point>();

  /**
   * 判断是否为click事件的欧氏距离平方阈值
   */
  private _CLICK_EVENT_DIST = Math.pow(10, 2);

  private _canvasWidth: number;
  private _canvasHeight: number;
  

  public verifyAdding(initState: ISystemActorOptions) {
    if (Sein.findActorByClass(this.getGame(), SystemActor)) {
      throw new Sein.BreakGuardException(this, `One game can only have one GUISystemActor !`);
    }
  }

  public onAdd(initState: ISystemActorOptions) {
    super.onAdd(initState);
    initState = initState || {};
    this._canvasWidth = initState.canvasWidth || 1024;
    this._canvasHeight = initState.canvasWidth || 1024;

    // add Events
    const game = this.getGame();
    game.hid.add('MouseDown', this.handleTouchStart, 0);
    game.hid.add('MouseMove', this.handleTouchMove, 0);
    game.hid.add('MouseUp', this.handleTouchEnd, 0);
    game.hid.add('MouseOut', this.handleTouchCancel, 0);

    game.hid.add('TouchStart', this.handleTouchStart, 0);
    game.hid.add('TouchMove', this.handleTouchMove, 0);
    game.hid.add('TouchEnd', this.handleTouchEnd, 0);
    game.hid.add('TouchCancel', this.handleTouchCancel, 0);

    // // atlas manager pool
    // this.atlasManagerPool.clear();
    // const atlasManager = Sein.AtlasManager.CREATE_EMPTY({width: this._atlasWidth, height: this._atlasHeight});
    // this.atlasManagerPool.add(atlasManager);

    // create Canvas and get context 2d
    this.createCanvas();
  }

  public onPostRender() {
    this._layers.forEach(layer => layer.render());
  }

  public onDestroy() {
    // this.atlasManagerPool.clear();
  }

  /**
   * 根据名字`name`和配置参数，创建一个图层。
   */
  public createLayer(name: string, options: ILayerOptions) {
    if (this._layers.has(name)) {
      throw new Sein.BreakGuardException(this, `Layer ${name} is already in GUISystem !`);
    }

    const layer = new Layer(name, options, this);
    this._layers.set(name, layer);

    render(this, layer);
  }

  // public allocateFrame(
  //   region: {w: number, h: number, space?: number, frameName?: string},
  //   onDraw: (context: CanvasRenderingContext2D, region: {
  //       x: number;
  //       y: number;
  //       w: number;
  //       h: number;
  //   }, frameName: string) => void
  // ): {atlas: Sein.AtlasManager, frame: string} {
  //   region = Object.assign({space: 4}, region);
  //   const {pixelRatio} = this.getGame().renderer;
  //   region.w *= pixelRatio;
  //   region.h *= pixelRatio;

  //   const size = this.atlasManagerPool.length;
  //   let atlasManager: Sein.AtlasManager;
  //   let frame: string | null;
  //   let i: number;
  //   for (i = size - 1; i >= 0; i--) {
  //     atlasManager = this.atlasManagerPool.get(i);
  //     if ((1 - atlasManager.usage) * atlasManager.meta.size.w * atlasManager.meta.size.h < region.w * region.h) {
  //       continue;
  //     }
  //     frame = atlasManager.allocateFrame(region, onDraw);
  //     if (frame) {
  //       this.sortAtlasManagerPool();
  //       break;
  //     }
  //   }
  //   if (i < 0) {
  //     atlasManager = Sein.AtlasManager.CREATE_EMPTY({width: this._atlasWidth, height: this._atlasWidth});
  //     frame = atlasManager.allocateFrame(region, onDraw);
  //     this.atlasManagerPool.add(atlasManager);
  //     this.sortAtlasManagerPool();
  //   }

  //   return {atlas: atlasManager, frame: frame};
  // }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 处理mousedown和touchstart事件
   */
  private handleTouchStart = (args) => {
    let event: Event;
    if (args.type === 'mousedown') {
      this._mouseDown = true;
      const touch = new Touch({
        identifier: 0,
        clientX: args.offsetX,
        clientY: args.offsetY,
        pageX: args.offsetX,
        pageY: args.offsetY,
        screenX: args.screenX,
        screenY: args.screenY
      });
      this._layers.forEach(layer => {
        layer.searchTarget(touch);
      });
      if (touch.target !== null) {
        const eventTarget = touch.target;
        this._activeElements[0] = eventTarget;

        this._activePoints[0] = {Xmin: touch.pageX, Xmax: touch.pageX, Ymin: touch.pageY, Ymax: touch.pageY};
        
        const touches = new Array<Touch>();
        touches.push(touch);
        event = new Event({
          touches: touches,
          changedTouches: touches,
          targetTouches: touches,
          type: EventType.TouchStart
        });
        event.target = eventTarget;

        eventTarget.bubbleTouchStart(event);
        return true;
      }
    }
    else {
      const touches = new Array<Touch>();
      const changedTouches = new Array<Touch>();
      for (let i = 0; i < args.touches.length; i++) {
        let touch = new Touch({
          identifier: args.touches[i].identifier,
          clientX: args.touches[i].clientX,
          clientY: args.touches[i].clientY,
          pageX: args.touches[i].pageX,
          pageY: args.touches[i].pageY,
          screenX: args.touches[i].screenX,
          screenY: args.touches[i].screenY
        });
        if (this._activeElements[args.touches[i].identifier] === undefined) {
          this._layers.forEach(layer => {
            layer.searchTarget(touch);
          });
          this._activeElements[args.touches[i].identifier] = touch.target;

          this._activePoints[args.touches[i].identifier] = {Xmin: touch.pageX, Xmax: touch.pageX, Ymin: touch.pageY, Ymax: touch.pageY};
          
          changedTouches.push(touch);
        }
        else {
          touch.target = this._activeElements[args.touches[i].identifier];
        }
        touches.push(touch);
      }
      let eventTarget: ContainerElement = null;
      for (let i = 0; i < args.changedTouches.length; i++) {
        eventTarget = this._activeElements[args.changedTouches[i].identifier];
        if (eventTarget !== null) {
          break;
        }
      }
      if (eventTarget !== null && eventTarget !== undefined) {
        const targetTouches = new Array<Touch>();
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].target === eventTarget) {
            targetTouches.push(touches[i]);
          }
        }
        event = new Event({
          touches: touches,
          changedTouches: changedTouches,
          targetTouches: targetTouches,
          type: EventType.TouchStart
        });
        event.target = eventTarget;

        eventTarget.bubbleTouchStart(event);
        return true;
      }
    }
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 处理mousemove和touchmove事件
   */
  private handleTouchMove = (args) => {
    if (args.type === 'mousemove' && !this._mouseDown) {
      return;
    }
    let event: Event;
    if (args.type === 'mousemove') {
      const touch = new Touch({
        identifier: 0,
        clientX: args.offsetX,
        clientY: args.offsetY,
        pageX: args.offsetX,
        pageY: args.offsetY,
        screenX: args.screenX,
        screenY: args.screenY
      });
      touch.target = this._activeElements[touch.identifier];

      const touches = new Array<Touch>();
      touches.push(touch);
      if (touch.target !== null && touch.target !== undefined) {
        const eventTarget = touch.target;
        event = new Event({
          touches: touches,
          changedTouches: touches,
          targetTouches: touches,
          type: EventType.TouchMove
        });
        event.target = eventTarget;

        eventTarget.bubbleTouchMove(event);

        this._activePoints[touch.identifier].Xmin = this._activePoints[touch.identifier].Xmin < touch.pageX ? this._activePoints[touch.identifier].Xmin : touch.pageX;
        this._activePoints[touch.identifier].Xmax = this._activePoints[touch.identifier].Xmax > touch.pageX ? this._activePoints[touch.identifier].Xmax : touch.pageX;
        this._activePoints[touch.identifier].Ymin = this._activePoints[touch.identifier].Ymin < touch.pageY ? this._activePoints[touch.identifier].Ymin : touch.pageY;
        this._activePoints[touch.identifier].Ymax = this._activePoints[touch.identifier].Ymax > touch.pageY ? this._activePoints[touch.identifier].Ymax : touch.pageY;

        return true;
      }
    }
    else {
      const touches = new Array<Touch>();
      for (let i = 0; i < args.touches.length; i++) {
        let touch = new Touch({
          identifier: args.touches[i].identifier,
          clientX: args.touches[i].clientX,
          clientY: args.touches[i].clientY,
          pageX: args.touches[i].pageX,
          pageY: args.touches[i].pageY,
          screenX: args.touches[i].screenX,
          screenY: args.touches[i].screenY
        });
        touch.target = this._activeElements[args.touches[i].identifier];

        if (touch.target !== null && touch.target !== undefined) {
          this._activePoints[args.touches[i].identifier].Xmin = this._activePoints[args.touches[i].identifier].Xmin < touch.pageX ? this._activePoints[args.touches[i].identifier].Xmin : touch.pageX;
          this._activePoints[args.touches[i].identifier].Xmax = this._activePoints[args.touches[i].identifier].Xmax > touch.pageX ? this._activePoints[args.touches[i].identifier].Xmax : touch.pageX;
          this._activePoints[args.touches[i].identifier].Ymin = this._activePoints[args.touches[i].identifier].Ymin < touch.pageY ? this._activePoints[args.touches[i].identifier].Ymin : touch.pageY;
          this._activePoints[args.touches[i].identifier].Ymax = this._activePoints[args.touches[i].identifier].Ymax > touch.pageY ? this._activePoints[args.touches[i].identifier].Ymax : touch.pageY; 
        }

        touches.push(touch);
      }
      const changedTouches = new Array<Touch>();
      for (let i = 0; i < args.changedTouches.length; i++) {
        let touch = new Touch({
          identifier: args.changedTouches[i].identifier,
          clientX: args.changedTouches[i].clientX,
          clientY: args.changedTouches[i].clientY,
          pageX: args.changedTouches[i].pageX,
          pageY: args.changedTouches[i].pageY,
          screenX: args.changedTouches[i].screenX,
          screenY: args.changedTouches[i].screenY
        });
        touch.target = this._activeElements[args.changedTouches[i].identifier];
        changedTouches.push(touch);
      }
      let eventTarget: ContainerElement = null;
      for (let i = 0; i < args.changedTouches.length; i++) {
        eventTarget = this._activeElements[args.changedTouches[i].identifier];
        if (eventTarget !== null) {
          break;
        }
      }
      if (eventTarget !== null && eventTarget !== undefined) {
        const targetTouches = new Array<Touch>();
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].target === eventTarget) {
            targetTouches.push(touches[i]);
          }
        }
        event = new Event({
          touches: touches,
          changedTouches: changedTouches,
          targetTouches: targetTouches,
          type: EventType.TouchMove
        });
        event.target = eventTarget;

        eventTarget.bubbleTouchMove(event);
        return true;
      }
    }
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 处理mouseup和touchdown事件
   */
  private handleTouchEnd = (args) => {
    if (args.type === 'mouseup' && !this._mouseDown) {
      return;
    }
    let event: Event;
    if (args.type === 'mouseup') {
      this._mouseDown = false;
      const touch = new Touch({
        identifier: 0,
        clientX: args.offsetX,
        clientY: args.offsetY,
        pageX: args.offsetX,
        pageY: args.offsetY,
        screenX: args.screenX,
        screenY: args.screenY
      });
      touch.target = this._activeElements[touch.identifier];
      if (touch.target !== null && touch.target !== undefined) {
        const changedTouches = new Array<Touch>();
        changedTouches.push(touch);
        const eventTarget = touch.target;
        const event = new Event({
          touches: new Array<Touch>(),
          changedTouches: changedTouches,
          targetTouches: new Array<Touch>(),
          type: EventType.TouchEnd
        });
        event.target = eventTarget;
        eventTarget.bubbleTouchEnd(event);

        const Xmax = this._activePoints[touch.identifier].Xmax;
        const Xmin = this._activePoints[touch.identifier].Xmin;
        const Ymax = this._activePoints[touch.identifier].Ymax;
        const Ymin = this._activePoints[touch.identifier].Ymin;

        if (Math.pow(Xmax - Xmin, 2) + Math.pow(Ymax - Ymin, 2) < this._CLICK_EVENT_DIST) {
          const clickEvent = new Event({
            touches: new Array<Touch>(),
            changedTouches: new Array<Touch>(),
            targetTouches: new Array<Touch>(),
            type: EventType.Click
          });
          clickEvent.target = eventTarget;
          eventTarget.bubbleClick(event);
        }

        this._activeElements = [];
        this._activePoints = [];
        return true;
      }
    }
    else {
      const touches = new Array<Touch>();
      for (let i = 0; i < args.touches.length; i++) {
        let touch = new Touch({
          identifier: args.touches[i].identifier,
          clientX: args.touches[i].clientX,
          clientY: args.touches[i].clientY,
          pageX: args.touches[i].pageX,
          pageY: args.touches[i].pageY,
          screenX: args.touches[i].screenX,
          screenY: args.touches[i].screenY
        });
        touch.target = this._activeElements[args.touches[i].identifier];
        touches.push(touch);
      }
      const changedTouches = new Array<Touch>();
      for (let i = 0; i < args.changedTouches.length; i++) {
        let touch = new Touch({
          identifier: args.changedTouches[i].identifier,
          clientX: args.changedTouches[i].clientX,
          clientY: args.changedTouches[i].clientY,
          pageX: args.changedTouches[i].pageX,
          pageY: args.changedTouches[i].pageY,
          screenX: args.changedTouches[i].screenX,
          screenY: args.changedTouches[i].screenY
        });
        touch.target = this._activeElements[args.changedTouches[i].identifier];
        changedTouches.push(touch);
      }
      let eventTarget: ContainerElement = null;
      let identifier: number = -1;
      for (let i = 0; i < args.changedTouches.length; i++) {
        eventTarget = this._activeElements[args.changedTouches[i].identifier];
        if (eventTarget !== null) {
          identifier = i;
          break;
        }
      }
      if (eventTarget !== null && eventTarget !== undefined) {
        const targetTouches = new Array<Touch>();
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].target === eventTarget) {
            targetTouches.push(touches[i]);
          }
        }
        event = new Event({
          touches: touches,
          changedTouches: changedTouches,
          targetTouches: targetTouches,
          type: EventType.TouchEnd
        });
        event.target = eventTarget;
        eventTarget.bubbleTouchEnd(event);

        if (identifier >= 0) {
          const Xmin = this._activePoints[identifier].Xmin;
          const Xmax = this._activePoints[identifier].Xmax;
          const Ymin = this._activePoints[identifier].Ymin;
          const Ymax = this._activePoints[identifier].Ymax;
          if (Math.pow(Xmax - Xmin, 2) + Math.pow(Ymax - Ymin, 2) < this._CLICK_EVENT_DIST) {
            const clickEvent = new Event({
              touches: touches,
              changedTouches: changedTouches,
              targetTouches: targetTouches,
              type: EventType.Click
            });
            clickEvent.target = eventTarget;
            eventTarget.bubbleClick(event);
          }
        }

        this._activeElements = [];
        this._activePoints = [];
        return true;
      }
    }
    this._activeElements = [];
    this._activePoints = [];
  }

  /**
   * @hidden
   * 
   * **不建议直接调用**
   * 处理touchcancel事件
   */
  private handleTouchCancel = (args) => {
    console.log('trigger global touchcancel!');
    if (this._mouseDown) {
      this._mouseDown = false;
      this._activeElements = [];
    }
    this._layers.forEach(layer => {
      layer.handleTouchCancel();
    });
    return true;
  }

  // /**
  //  * 将AtlasManager池中的AtlasManager按照usage从大到小排序
  //  * 经内外循环两次优化的冒泡排序算法
  //  */
  // public sortAtlasManagerPool() {
  //   let i = 0;
  //   let j = 0;
  //   let k = this.atlasManagerPool.length - 1;
  //   let pos = 0;
  //   for (i = 0; i < this.atlasManagerPool.length; i++) {
  //     let flag = false;
  //     for (j = 0; j < k; j++) {
  //       if (this.atlasManagerPool.get(j).usage < this.atlasManagerPool.get(j + 1).usage) {
  //         const temp = this.atlasManagerPool.get(j);
  //         this.atlasManagerPool.set(j, this.atlasManagerPool.get(j + 1));
  //         this.atlasManagerPool.set(j + 1, temp);
  //         flag = true;
  //         pos = j;
  //       }
  //     }
  //     k = pos;
  //     if (flag === false) {
  //       return;
  //     }
  //   }
  // }

  /**
   * 生成canvas和上下文
   */
  public createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this._canvasWidth;
    canvas.height = this._canvasHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(255, 255, 255, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    this._canvas = canvas;
    this.context = context;
  }

  /**
   * 清理canvas
   */
  public clearCanvas(width: number, height: number) {
    const context = this.context;

    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(255, 255, 255, 0)';
    context.fillRect(0, 0, width, height);
  }

  /**
   * 创建一个适合GUI系统的纹理。
   */
  public createTexture(image: ImageData) {
    /**
     * Safari and android-chrome only support Uint8Array, not Clamp
     */
    return new Sein.Texture({image: new Uint8Array(image.data.buffer), width: image.width, height: image.height});
  }
}
