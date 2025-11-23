<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
  // ESTA ALTERAÇÃO É VISUAL
  import { fade } from 'svelte/transition';

  let showToast = false;

  // ESTA ALTERAÇÃO É VISUAL
  // Exibe um toast ao tentar interagir com o player falso.
  const handleInteractionAttempt = () => {
    if (showToast) return;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 3000);
  };
</script>

<!-- ESTA ALTERAÇÃO É VISUAL -->
<div class="relative flex h-full w-full items-center justify-center overflow-hidden bg-background text-text-main">
  <!-- Background Image -->
  <div
    class="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
    style="background-image: url(/fallback/background-1.jpg);"
  ></div>
  <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

  <!-- Player UI -->
  <div
    role="button"
    tabindex="0"
    class="relative z-10 flex w-full max-w-4xl cursor-pointer flex-col items-center p-8 text-center"
    on:click={handleInteractionAttempt}
    on:keydown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleInteractionAttempt() }}
  >
    <h1 class="text-3xl font-bold md:text-4xl">Player Indisponível</h1>
    <p class="mt-4 max-w-md text-lg text-muted">
      O conteúdo não pode ser carregado no momento. Você parece estar offline.
    </p>

    <!-- Fake Player Controls -->
    <div class="mt-8 flex items-center justify-center gap-8">
      <button aria-label="Voltar" class="text-white/70 transition-colors hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.445 14.832A1 1 0 0010 14.168V5.832a1 1 0 00-1.555-.832L4 8.168a1 1 0 000 1.664l4.445 2.832z" />
        </svg>
      </button>
      <button aria-label="Play" class="transform text-white transition-transform active:scale-90">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      <button aria-label="Avançar" class="text-white/70 transition-colors hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11.555 5.168A1 1 0 0010 5.832v8.336a1 1 0 001.555.832l4.445-2.832a1 1 0 000-1.664l-4.445-2.832z" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Toast Notification -->
  {#if showToast}
    <div
      transition:fade={{ duration: 300 }}
      class="fixed bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-full bg-accent-blue px-6 py-3 font-semibold text-white shadow-lg"
    >
      Modo offline — streaming indisponível
    </div>
  {/if}
</div>
