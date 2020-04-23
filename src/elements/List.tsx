/**
 * @File   : List.tsx
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 9/7/2019, 4:04:08 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {IClipPropTypes, Clip} from './Clip';
import {SliderBar} from './SliderBar';
import Event from '../event/Event';

export interface IListPropTypes extends IClipPropTypes {
  /**
   * 列表元素宽度
   */
  itemWidth: number;
  /**
   * 列表元素高度
   */
  itemHeight: number;
  /**
   * 列表列数
   */
  columnNum: number;
  /**
   * 行间距
   */
  rowSpace: number;
  /**
   * 列表元素信息数据
   */
  data: any[];
  /**
   * 列表元素渲染函数
   */
  renderItem(itemData: any, index: number, transform: {x: number, y: number}): JSX.Element;

  /**
   * 是否显示滚动条
   */
  scrollBar?: boolean;
  /**
   * 滚动条绘制函数
   */
  renderScrollBar?(percent: number, height: number, onScroll: (percent: number) => void): JSX.Element;
  /**
   * 列表初始化位置
   */
  initialPos?: number;
}

export class List extends React.Component<IListPropTypes> {
  public state: {listHead: number};
  private _prePointY: number;

  constructor(props: IListPropTypes) {
    super(props);

    const initialPos = this.props.initialPos || 0;
    this.state = {listHead: -initialPos};
  }

  public render() {
    const {itemWidth, itemHeight, columnNum, rowSpace, data, renderItem,
      scrollBar, renderScrollBar, ...clipProps} = this.props;

    const itemNum = data.length;
    const rowNum = Math.ceil(itemNum / columnNum);
    const totalLength = rowNum * itemHeight + (rowNum - 1) * rowSpace;
  
    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingBottom = padding.z;

    let listPercent: number;
    if (totalLength <= this.props.shape.y - paddingTop - paddingBottom) {
      listPercent = 0;
    }
    else {
      listPercent = this.state.listHead / (this.props.shape.y - paddingTop - paddingBottom - totalLength);
    }

    const visibility = this.props.visibility === undefined ? true : this.props.visibility;

    return (
      <React.Fragment>
        <Clip
          {...clipProps}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMoveList}
        >
          {
            data.map((value: any, index: number) => {
              const {x, y} = this.setItemTransform(index);
              return renderItem(value, index, {x: x, y: y + this.state.listHead});
            })
          }
        </Clip>
        {
          (visibility && scrollBar && renderScrollBar && renderScrollBar(1 - listPercent, this.props.shape.y, this.moveListFromScrollBar)) ||
          (visibility && scrollBar && !renderScrollBar && this.defaultRenderScrollBar(1 - listPercent, this.props.shape.y, this.moveListFromScrollBar))
        }
      </React.Fragment>
      
    );
  }

  /**
   * 计算列表元素位移
   * 
   * @param index 列表元素序号
   */
  private setItemTransform(index: number) : {x: number, y: number} {
    const listWidth = this.props.shape.x;

    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingLeft = padding.w;
    const paddingRight = padding.y

    let columnSpace: number;
    if (this.props.columnNum > 1) {
      columnSpace = (listWidth - paddingLeft - paddingRight - this.props.columnNum * this.props.itemWidth) / (this.props.columnNum - 1);
    }
    else {
      columnSpace = 0;
    }

    const itemX = paddingLeft + Math.floor(index % this.props.columnNum) * (this.props.itemWidth + columnSpace);
    const itemY = paddingTop + Math.floor(index / this.props.columnNum) * (this.props.itemHeight + this.props.rowSpace);

    return {x: itemX, y: itemY};
  }

  /**
   * List的TouchStart事件回调
   */
  private handleTouchStart = (event: Event) => {
    this._prePointY = event.touches[0].pageY;
  }

  /**
   * List的TouchMove事件回调
   */
  private handleTouchMoveList = (event: Event) => {
    const itemNum = this.props.data.length;
    const rowNum = Math.ceil(itemNum / this.props.columnNum);
    const totalLength = rowNum * this.props.itemHeight + (rowNum - 1) * this.props.rowSpace;

    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingBottom = padding.z;

    if (totalLength <= (this.props.shape.y - paddingTop - paddingBottom)) {
      return;
    }

    const delta = event.touches[0].pageY - this._prePointY;
    this.setListHead(delta);
    this._prePointY = event.touches[0].pageY;
  }

  /**
   * 移动List中内容的位置
   * 
   * @param delta List中内容移动距离
   */
  private setListHead(delta: number) {
    const itemNum = this.props.data.length;
    const rowNum = Math.ceil(itemNum / this.props.columnNum);
    const totalLength = rowNum * this.props.itemHeight + (rowNum - 1) * this.props.rowSpace;

    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingBottom = padding.z;

    if (this.state.listHead + delta > 0) {
      this.setState({listHead: 0});
    }
    else if (this.state.listHead + delta < (this.props.shape.y - paddingTop - paddingBottom - totalLength)) {
      this.setState({listHead: this.props.shape.y - paddingTop - paddingBottom - totalLength});
    }
    else {
      this.setState({listHead: this.state.listHead + delta});
    }
  }


  /**
   * 根据SliderBar滑动百分比计算List组件的表头位置
   * 
   * @param percent SliderBar滚动百分比
   */
  private moveListFromScrollBar = (percent: number) => {
    const listPercent = 1 - percent;

    const itemNum = this.props.data.length;
    const rowNum = Math.ceil(itemNum / this.props.columnNum);
    const totalLength = rowNum * this.props.itemHeight + (rowNum - 1) * this.props.rowSpace;

    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingTop = padding.x;
    const paddingBottom = padding.z;
    if (totalLength > this.props.shape.y - paddingTop - paddingBottom) {
      const step = listPercent * (this.props.shape.y - paddingTop - paddingBottom - totalLength);
      this.setState({listHead: step});
    }
  }

  /**
   * List默认渲染滚动条函数
   */
  private defaultRenderScrollBar(percent: number, height: number, onScroll: (percent: number) => void) {
    const padding = this.props.padding || new Sein.Vector4(0, 0, 0, 0);
    const paddingRight = padding.y;
    if (paddingRight === 0) {
      throw new Error('List: (Use Default ScrollBar Render Function) You must specify right padding.');
    }
    const x = this.props.x || 0;
    return (
      <SliderBar
        shape={new Sein.Vector2(paddingRight, height)}
        x={this.props.shape.x + x - paddingRight}
        y={this.props.y}
        layout={'column'}
        percent={percent}
        onChange={onScroll}
        trackBackground={new Sein.Color(0.8, 0.8, 0.8)}
        pieceBackground={new Sein.Color(0.8, 0.8, 0.8)}
        thumbShape={new Sein.Vector2(paddingRight, height / 3)}
        thumbBackground={new Sein.Color(0.6, 0.6, 0.6)}
      />
    );
  }
}
