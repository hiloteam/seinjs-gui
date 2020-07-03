/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/12/2019, 6:48:29 PM
 * @Description:
 */
import * as Sein from 'seinjs';
import * as OriginReact from 'react';

import GUISystemActor, {isSystemActor as isGUISystemActor} from './actors/SystemActor';
import GUILayer, {ILayerOptions as IGUILayerOptions} from './renderer/Layer';
import {IContainerPropTypes as TContainerPropTypes, Container as ContainerJSX} from './elements';
import ReactComponent from './elements/Component';
import {ILabelPropTypes as TLabelPropTypes, Label as LabelJSX} from './elements';
import {IButtonPropTypes as TButtonPropTypes, Button as ButtonJSX} from './elements';
import {ICheckboxPropTypes as TCheckboxPropTypes, Checkbox as CheckboxJSX} from './elements';
import {IRadioButtonPropTypes as TRadioButtonPropTypes, RadioButton as RadioButtonJSX} from './elements';
import {ISliderPropTypes as TSliderPropTypes, Slider as SliderJSX} from './elements';
import {ISliderBarPropTypes as TSliderBarPropTypes, SliderBar} from './elements/SliderBar';
import {ICombinePropTypes as TCombinePropTypes, Combine as CombineJSX} from './elements';
import {IClipPropTypes as TClipPropTypes, Clip as ClipJSX} from './elements';
import {IScrollPropTypes as TScrollPropTypes, Scroll as ScrollJSX} from './elements';
import {IListPropTypes as TListPropTypes, List} from './elements/List';

import {IBitmapFontPropTypes as TBitmapFontPropTypes, BitmapFont as BitmapFontJSX} from './elements/BitmapFont';

declare module 'seinjs' {
  export namespace GUI {
    export {OriginReact as React};
    export class SystemActor extends GUISystemActor {}
    export function isSystemActor(value: Sein.SObject): value is SystemActor;
    export class Layer extends GUILayer {}
    export interface ILayerOptions extends IGUILayerOptions {}
    export class Component<IPropTypes extends any = {}, IStateTypes extends any = {}> extends ReactComponent<IPropTypes, IStateTypes> {}
    export interface IContainerPropTypes extends TContainerPropTypes {}
    export function Container(props: IContainerPropTypes): JSX.Element;
    export interface ILabelPropTypes extends TLabelPropTypes {}
    export function Label(props: ILabelPropTypes) : JSX.Element;
    export interface IButtonPropTypes extends TButtonPropTypes {}
    export function Button(props: IButtonPropTypes) : JSX.Element;
    export interface ICheckboxPropTypes extends TCheckboxPropTypes {}
    export function Checkbox(props: ICheckboxPropTypes) : JSX.Element;
    export interface IRadioButtonPropTypes extends TRadioButtonPropTypes {}
    export function RadioButton(props: IRadioButtonPropTypes) : JSX.Element;
    export interface ISliderPropTypes extends TSliderPropTypes {}
    export function Slider(props: ISliderPropTypes) : JSX.Element;
    export interface ISliderBarPropTypes extends TSliderBarPropTypes {}
    export class SliderBar extends ReactComponent<ISliderBarPropTypes> {}
    export interface ICombinePropTypes extends TCombinePropTypes {}
    export function Combine(props: ICombinePropTypes) : JSX.Element;
    export interface IClipPropTypes extends TClipPropTypes {}
    export function Clip(props: IClipPropTypes) : JSX.Element;
    export interface IScrollPropTypes extends TScrollPropTypes {}
    export function Scroll(props: IScrollPropTypes) : JSX.Element;
    export interface IListPropTypes extends TListPropTypes {}
    export class List extends ReactComponent<IListPropTypes> {}
    
    export interface IBitmapFontPropTypes extends TBitmapFontPropTypes {}
    export function BitmapFont(props: IBitmapFontPropTypes) : JSX.Element;
  }
}

(Sein as any).GUI = {
  React: OriginReact,
  SystemActor: GUISystemActor,
  isSystemActor: isGUISystemActor,
  Layer: GUILayer,
  Component: ReactComponent,
  Container: ContainerJSX,
  Label: LabelJSX,
  Button: ButtonJSX,
  Checkbox: CheckboxJSX,
  RadioButton: RadioButtonJSX,
  Slider: SliderJSX,
  SliderBar,
  Combine : CombineJSX,
  Clip: ClipJSX,
  Scroll: ScrollJSX,
  List,

  BitmapFont: BitmapFontJSX
};

export {
  OriginReact as React,
  GUISystemActor as SystemActor,
  isGUISystemActor as isSystemActor,
  GUILayer as Layer,
  IGUILayerOptions as ILayerOptions,
  ReactComponent as Component,
  TContainerPropTypes as IContainerPropTypes,
  ContainerJSX as Container,
  TLabelPropTypes as ILabelPropTypes,
  LabelJSX as Label,
  TButtonPropTypes as IButtonPropTypes,
  ButtonJSX as Button,
  TCheckboxPropTypes as ICheckboxPropTypes,
  CheckboxJSX as Checkbox,
  TRadioButtonPropTypes as IRadioButtonPropTypes,
  RadioButtonJSX as RadioButton,
  TSliderPropTypes as ISliderPropTypes,
  SliderJSX as Slider,
  TSliderBarPropTypes as ISliderBarPropTypes,
  TCombinePropTypes as ICombinePropTypes,
  CombineJSX as Combine,
  TClipPropTypes as IClipPropTypes,
  ClipJSX as Clip,
  TScrollPropTypes as IScrollPropTypes,
  ScrollJSX as Scroll,
  TListPropTypes as IListPropTypes,

  TBitmapFontPropTypes as IBitmapFontPropTypes,
  BitmapFontJSX as BitmapFont
};
