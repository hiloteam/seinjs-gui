/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/13/2019, 4:57:33 PM
 * @Description:
 */
export * from './Container';
export * from './Label';
export * from './Button';
export * from './Checkbox';
export * from './RadioButton';
export * from './Slider';
export * from './Combine';
export * from './Clip';
export * from './Scroll';

export * from './BitmapFont';

/**
 * 所有可以支持原生组件类型。
 */
export enum EElementType {
  Container = 'ContainerElement',
  Label = 'LabelElement',
  Button = 'ButtonElement',
  Checkbox = 'CheckboxElement',
  RadioButton = 'RadioButtonElement',
  Slider = 'SliderElement',
  Combine = 'CombineElement',
  Clip = 'ClipElement',
  Scroll = 'ScrollElement',

  BitmapFont = 'BitmapFontElement'
}
