<script lang="ts">
import '../app.css';
import { MetaTags } from 'svelte-meta-tags';

let title = 'นักกอร์ฟหรรษา';
let description = 'Interactive golf animation scene with Three.js';
let ogimage = new URL('/ogimage.png', 'https://golfyboy.krist7599555.com');

let canvas = $state<HTMLCanvasElement>();
let comp = $state<typeof import('./Scene.svelte').default>();

$effect(() => {
  import('./Scene.svelte').then(mod => {
    comp = mod.default;
  });
});
</script>

<MetaTags
  {title}
  {description}
  openGraph={{ title, description, images: [{ url: ogimage.href }] }}
  twitter={{ title, description, image: ogimage.href }}
  keywords={[
    'krist7599555',
    'three.js',
    '3d',
    'model',
    'sketchfab',
    'opengameart',
    'mixamo',
    'skybox'
  ]}
/>

<canvas bind:this={canvas}></canvas>
{#if comp}
  <svelte:component this={comp} {canvas} />
{/if}
