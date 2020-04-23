/**
 * @File   : SliderBar.tsx
 * @Author : AlchemyZJK (alchemyzjk@foxmail.com)
 * @Link   : 
 * @Date   : 9/9/2019, 3:21:51 PM
 */

import * as Sein from 'seinjs';
import * as React from 'react';

import {Container} from './Container';
import {Slider} from './Slider';
import {TImageProp} from '../types';
import Event from '../event/Event';

export interface ISliderBarPropTypes {
  /**
   * Slider长与宽
   */
  shape: Sein.Vector2;
  /**
   * Slider位置
   */
  x?: number;
  /**
   * Slider位置
   */
  y?: number;
  /**
   * 布局
   * `row`或`column`
   */
  layout: string;
  /**
   * SliderBar
   */
  percent: number;
  /**
   * SliderBar滑动百分比回调函数
   */
  onChange?: (percent: number) => void;
  /**
   * SliderTrack背景
   */
  trackBackground?: Sein.Color | TImageProp;
  /**
   * SliderTrack背景是否开启透明
   */
  trackTransparent?: boolean;
  /**
   * SliderPiece的背景
   */
  pieceBackground?: Sein.Color | TImageProp;
  /**
   * SliderPiece背景是否开启透明度测试
   */
  pieceTransparent?: boolean;
  /**
   * 是否设置SliderThumb
   */
  thumbShape: Sein.Vector2;
  /**
   * SliderThumb的背景
   */
  thumbBackground?: Sein.Color | TImageProp;
  /**
   * SlierThumb背景是否开启透明度测试
   */
  thumbTransparent?: boolean;
}

export class SliderBar extends React.Component<ISliderBarPropTypes> {
  public state = {sliderBarPercent: this.props.percent};

  private _prePoint: number;

  public UNSAFE_componentWillReceiveProps(nextProps: ISliderBarPropTypes) {
    if (nextProps.percent !== this.props.percent) {
      this.setState({sliderBarPercent: nextProps.percent});
    }
  }

  public render() {
    const {shape, x, y, layout, trackBackground, trackTransparent, pieceBackground, pieceTransparent} = this.props;
    const sliderPercent = this.calculateSliderPercent(this.state.sliderBarPercent);

    return (
      <Container
        id={'SliderTrack'}
        shape={shape}
        x={x}
        y={y}
        background={trackBackground}
        transparent={trackTransparent}
        >
          <Slider
            id={'SliderPiece'}
            shape={shape}
            layout={layout}
            percent={sliderPercent}
            background={pieceBackground}
            transparent={pieceTransparent}
          />
          {this.renderController()}
        </Container>
    );
  }

  /**
   * 根据SliderBar组件的滑动百分比计算Slider组件的填充百分比
   * 
   * @param sliderBarPercent SliderBar组件的滑动百分比
   */
  private calculateSliderPercent(sliderBarPercent: number): number {
    let sliderPercent: number;
    let sliderLength: number;
    if (this.props.layout === 'row') {
      sliderLength = sliderBarPercent * (this.props.shape.x - this.props.thumbShape.x) + this.props.thumbShape.x / 2;
      sliderPercent = sliderLength / this.props.shape.x;
    }
    else if (this.props.layout === 'column') {
      sliderLength = sliderBarPercent * (this.props.shape.y - this.props.thumbShape.y) + this.props.thumbShape.y / 2;
      sliderPercent = sliderLength / this.props.shape.y;
    }
    else {
      throw new Error('SliderBar: layout can only be set to `row` or `column`!');
    }
    return sliderPercent;
  }

  /**
   * Controller部分的TouchStart事件回调
   */
  private handleTouchStart = (event: Event) => {
    if (this.props.layout === 'row') {
      this._prePoint = event.touches[0].pageX;
    }
    else if (this.props.layout === 'column') {
      this._prePoint = event.touches[0].pageY;
    }
    else {
      throw new Error('SliderBar: layout can only be set to `row` or `column`!');
    }
  }

  /**
   * Controller部分的TouchMove事件回调
   */
  private handleTouchMove = (event: Event) => {
    let delta: number;
    let preLength: number;
    let sliderBarLength: number;
    let sliderBarPercent: number;

    if (this.props.layout === 'row') {
      delta = event.touches[0].pageX - this._prePoint;
      sliderBarLength = this.props.shape.x - this.props.thumbShape.x;
      preLength = this.state.sliderBarPercent * sliderBarLength + this.props.thumbShape.x / 2;
      
      if (preLength + delta <= this.props.thumbShape.x / 2) {
        this.setState({sliderBarPercent: 0});
        sliderBarPercent = 0;
      }
      else if (preLength + delta >= this.props.thumbShape.x / 2 + sliderBarLength) {
        this.setState({sliderBarPercent: 1.0});
        sliderBarPercent = 1.0;
      }
      else {
        this.setState({sliderBarPercent: (preLength + delta - this.props.thumbShape.x / 2) / sliderBarLength});
        sliderBarPercent = (preLength + delta - this.props.thumbShape.x / 2) / sliderBarLength;
      }
      this._prePoint = event.touches[0].pageX;
      if (this.props.onChange) {
        this.props.onChange(sliderBarPercent);
      }
    }
    else if (this.props.layout === 'column') {
      delta = event.touches[0].pageY - this._prePoint;
      sliderBarLength = this.props.shape.y - this.props.thumbShape.y;
      preLength = this.state.sliderBarPercent * sliderBarLength + this.props.thumbShape.y / 2;

      if (preLength - delta <= this.props.thumbShape.y / 2) {
        this.setState({sliderBarPercent: 0});
        sliderBarPercent = 0;
      }
      else if (preLength - delta >= this.props.thumbShape.y / 2 + sliderBarLength) {
        this.setState({sliderBarPercent: 1.0});
        sliderBarPercent = 1.0;
      }
      else {
        this.setState({sliderBarPercent: (preLength - delta - this.props.thumbShape.y / 2) / sliderBarLength});
        sliderBarPercent = (preLength - delta - this.props.thumbShape.y / 2) / sliderBarLength;
      }
      this._prePoint = event.touches[0].pageY;
      if (this.props.onChange) {
        this.props.onChange(sliderBarPercent);
      }
    }
    else {
      throw new Error('SliderBar: layout can only be set to `row` or `column`!');
    }
  }

  /**
   * 根据SliderBar组件的滑动百分比渲染Controller（位置）
   */
  private renderController(): JSX.Element {
    const sliderBarPercent = this.state.sliderBarPercent;
    if (this.props.layout === 'row') {
      return (
        <Container
          shape={this.props.thumbShape}
          x={sliderBarPercent * (this.props.shape.x - this.props.thumbShape.x)}
          y={this.props.shape.y / 2 - this.props.thumbShape.y / 2}
          background={this.props.thumbBackground}
          transparent={this.props.thumbTransparent}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
        />
      );
    }
    else if (this.props.layout === 'column') {
      return (
        <Container
          shape={this.props.thumbShape}
          x={this.props.shape.x / 2 - this.props.thumbShape.x / 2}
          y={(1 - sliderBarPercent) * (this.props.shape.y - this.props.thumbShape.y)}
          background={this.props.thumbBackground}
          transparent={this.props.thumbTransparent}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
        />
      );
    }
    else {
      throw new Error('SliderBar: layout can only be set to `row` or `column`!');
    }
  }

}