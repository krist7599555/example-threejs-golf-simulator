<script lang="ts">
import '../app.css';
import { browser } from '$app/environment';
let canvas = $state<HTMLCanvasElement>();
let comp = $state<typeof import('./Scene.svelte').default>();
if (browser) {
  console.log('+page');
}
$effect(() => {
  import('./Scene.svelte').then(mod => {
    comp = mod.default;
  });
});
</script>

<canvas bind:this={canvas}></canvas>
{#if comp}
  <svelte:component this={comp} {canvas} />
{/if}
