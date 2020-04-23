/**
 * @File   : Material.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/12/2019, 7:47:36 PM
 * 
 */
import * as Sein from 'seinjs';

import {TImageProp, isAtlasProp, isTextureProp} from '../types';
import Layer from '../renderer/Layer';

/**
 * 判断是否为GUI的材质。
 */
export function isMaterial(value: Sein.Material): value is Material {
  return (value as Material).isGUIMaterial;
}

/**
 * GUI的材质参数接口。
 */
export interface IMaterialOptions {
  layer: Layer;
  uniforms: {
    u_background: Sein.Color | TImageProp;
    u_transformMatrix: Sein.Matrix3;
    u_percent?: Sein.Vector2;
  },
  transparent?: boolean;
}

/**
 * GUI的材质。
 */
@Sein.SMaterial({className: 'GUIMaterial'})
export default class Material extends Sein.RawShaderMaterial {
  public isGUIMaterial = true;

  constructor(options: IMaterialOptions) {
    super({
      attributes: {
        a_position: 'POSITION',
        a_uv: 'TEXCOORD_0'
      },
      uniforms: {
        u_background: {value: getBackground(options)},
        u_backgroundUVMatrix: {value: getUVMatrix(options)},
        u_aspectMatrix: options.layer.aspectMatrixUniform,
        u_transformMatrix: {value: options.uniforms.u_transformMatrix},
        u_percent: {value: options.uniforms.u_percent ? options.uniforms.u_percent : new Sein.Vector2(1.01, 1.01)}
      },
      vs: `
precision HILO_MAX_FRAGMENT_PRECISION float;

attribute vec3 a_position;
attribute float a_index;
attribute vec2 a_uv;

uniform mat3 u_aspectMatrix;
uniform mat3 u_transformMatrix;

#ifdef SEIN_GUI_BACKGROUND_ATLAS
uniform mat3 u_backgroundUVMatrix;
#endif

varying vec2 v_uv;

void main() {
  #ifdef SEIN_GUI_BACKGROUND_ATLAS
    v_uv = (u_backgroundUVMatrix * vec3(a_uv, 1.)).xy;
  #else
    v_uv = a_uv;
  #endif
  vec3 position = u_aspectMatrix * u_transformMatrix * vec3(a_position.xy, 1.0);
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
      `,
      fs: `
precision HILO_MAX_FRAGMENT_PRECISION float;

#ifdef SEIN_GUI_BACKGROUND_COLOR
uniform vec4 u_background;
#else
uniform sampler2D u_background;
#endif

varying vec2 v_uv;
uniform vec2 u_percent;

void main() {
  #ifdef SEIN_GUI_BACKGROUND_COLOR
    if (v_uv.x > u_percent.x || v_uv.y > u_percent.y) {
      discard;
    }
    else {
      vec4 color = vec4(u_background.xyz * u_background.w, u_background.w);
      gl_FragColor = color;
    }
  #else
    if (v_uv.x > u_percent.x || v_uv.y > u_percent.y) {
      discard;
    }
    else {
      gl_FragColor = texture2D(u_background, v_uv);
    }
  #endif
}
      `,
      depthTest: false,
      transparent: options.transparent === undefined ? false : options.transparent
    });
  }

  public getCustomRenderOption(options: any) {
    const background = this.getUniform('u_background').value;
    const uvMatrix = this.getUniform('u_backgroundUVMatrix').value;

    if (uvMatrix) {
      options.SEIN_GUI_BACKGROUND_ATLAS = 1;
    } else if (Sein.isColor(background)) {
      options.SEIN_GUI_BACKGROUND_COLOR = 1;
    } else {
      options.SEIN_GUI_BACKGROUND_TEXTURE = 1;
    }

    return options;
  }
}

function getBackground(options: IMaterialOptions) {
  let background: Sein.Color | Sein.Texture;
  if (isAtlasProp(options.uniforms.u_background)) {
    background = options.uniforms.u_background.atlas.texture;
  } else if (isTextureProp(options.uniforms.u_background)) {
    background = options.uniforms.u_background.texture;
  } else {
    background = options.uniforms.u_background;
  }
  return background;
}

function getUVMatrix(options: IMaterialOptions) {
  let uvMatrix: Sein.Matrix3;
  if (isAtlasProp(options.uniforms.u_background)) {
    uvMatrix = options.uniforms.u_background.atlas.getUVMatrix(options.uniforms.u_background.frame);
  } else if (isTextureProp(options.uniforms.u_background)) {
    uvMatrix = options.uniforms.u_background.uvMatrix;
  } else {
    uvMatrix = null;
  }
  return uvMatrix;
}
