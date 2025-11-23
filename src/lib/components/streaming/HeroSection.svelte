<!-- /src/lib/components/streaming/HeroSection.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  export let items = []; // array de shows/filmes para banner
  let current = 0;
  let timer = null;

  onMount(()=> {
    if (items.length > 1) {
      timer = setInterval(()=> {
        current = (current + 1) % items.length;
      }, 10000); // 10s
    }
  });
  onDestroy(()=> {
    if (timer) clearInterval(timer);
  });

  function gotoItem(i) {
    // redireciona para página de detalhe
    if (typeof window !== 'undefined') {
      const id = items[i]?.id;
      if (id) window.location.href = `/catalogo/${id}`;
    }
  }
</script>

<style>
  .hero { width:100%; height:220px; border-radius:12px; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; background:#111; }
  .bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:opacity 600ms ease; opacity:0; }
  .bg.show { opacity:1; }
  .overlay { position:absolute; left:12px; bottom:12px; color:white; text-shadow:0 4px 20px rgba(0,0,0,0.6); }
</style>

<div class="hero">
  {#each items as it, i}
    <div class="bg {i===current ? 'show' : ''}" style="background-image: url('{it?.backdrop || it?.poster || ''}')" on:click={() => gotoItem(i)}></div>
  {/each}
  <div class="overlay">
    <div style="font-size:20px;font-weight:800">{items[current]?.title}</div>
    <div style="opacity:0.9">{items[current]?.tagline ?? items[current]?.short ?? ''}</div>
  </div>
</div>
