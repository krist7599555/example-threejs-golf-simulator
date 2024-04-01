import { F } from '@mobily/ts-belt';
import { BackSide, BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { textureLoader } from './loader';

const { tap } = F;

export async function createMeshSky() {
  // prettier-ignore
  const ALL_SKY_THEMES = ['rainbow', 'arch3', 'cave3', 'dark', 'hot', 'sh', 'skyast', 'skyhsky', 'skype', 'sp2', 'sp3', 'tron']
  const skyMesh = tap(new Mesh(new BoxGeometry(1500, 1500, 1500), [] as MeshBasicMaterial[]), _ => {
    _.rotateY(2.9);
    _.position.y = 38;
  });

  async function updateTheme(theme: string) {
    skyMesh.material = await Promise.all(
      ['ft', 'bk', 'up', 'dn', 'rt', 'lf'].map(async side => {
        const url = `models/opengameart-skybox_elyvisions/${theme}_${side}.png`;
        const texture = await textureLoader.loadAsync(url);
        return new MeshBasicMaterial({ map: texture, side: BackSide });
      })
    );
  }

  let theme = ALL_SKY_THEMES[0];
  await updateTheme(theme);

  return {
    mesh: { sky: skyMesh },
    get theme() {
      return theme;
    },
    set theme(val) {
      theme = val;
      updateTheme(theme);
    },
    get list_themes() {
      return ALL_SKY_THEMES;
    }
  };
}
