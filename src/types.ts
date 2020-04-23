/**
 * @File   : types.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 8/12/2019, 7:35:28 PM
 * @Description:
 */
import * as Sein from 'seinjs';

export type TImageProp = Sein.Texture | {atlas: Sein.AtlasManager, frame: string} | {texture: Sein.Texture, uvMatrix: Sein.Matrix3};

export type TAtlasProp = {atlas: Sein.AtlasManager, frame: string};

export function isAtlasProp(value: any): value is {atlas: Sein.AtlasManager, frame: string} {
  const v = value as {atlas: Sein.AtlasManager, frame: string};

  return v.atlas && Sein.isAtlasManager(v.atlas);
}

export type TTextureProp = {texture: Sein.Texture, uvMatrix: Sein.Matrix3};

export function isTextureProp(value: any): value is {texture: Sein.Texture, uvMatrix: Sein.Matrix3} {
  const v = value as {texture: Sein.Texture, uvMatrix: Sein.Matrix3};
  return v.texture && Sein.isTexture(v.texture);
}

export interface IUpdatePayload {
  transform: boolean;
  others: boolean;
}
