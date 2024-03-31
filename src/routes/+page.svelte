<script lang="ts">
import '../app.css';
import { browser } from '$app/environment';
let canvas = $state<HTMLCanvasElement>();
</script>

{#if browser}
  <canvas bind:this={canvas}></canvas>
  {#await import('./Scene.svelte') then comp}
    <svelte:component this={comp.default} {canvas} />
  {/await}
{/if}
