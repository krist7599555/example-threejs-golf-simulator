import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/draco_decoder.wasm?url';
import dracoWasmWrapperJsUrl from 'three/examples/jsm/libs/draco/draco_wasm_wrapper.js?url';

import { F } from '@mobily/ts-belt';
import { LoadingManager, TextureLoader } from 'three';
import { DRACOLoader, FBXLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';

const { tap } = F;

const loadingManager = tap(new LoadingManager(), _ => {
  _.resolveURL = url => {
    if (url === 'draco_wasm_wrapper.js') return dracoWasmWrapperJsUrl;
    if (url === 'draco_decoder.wasm') return dracoDecoderWasmUrl;
    return url;
  };
});
export const fbxLoader = new FBXLoader(loadingManager);
export const gltfLoader = new GLTFLoader(loadingManager).setDRACOLoader(
  new DRACOLoader(loadingManager)
);
export const textureLoader = new TextureLoader(loadingManager);
