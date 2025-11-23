<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import type { Episode } from '$lib/types';

  export let episode: Episode;
  export let showCode: string;
  export let serverUrl: string;
  export let handleDownload: (filePath: string, fileName: string) => Promise<void>;

  const dispatch = createEventDispatcher();

  function closeModal() { dispatch('close'); }
  function triggerDownload() {
    if (episode.path) {
      handleDownload(episode.path, episode.titulo || episode.arquivo);
    }
    closeModal();
  }

  function getEpisodeImageUrl(ep: Episode) {
    if (ep.thumbnail) {
      if (ep.thumbnail.startsWith('http')) return ep.thumbnail;
      return `${serverUrl}/midia/${ep.thumbnail}`;
    }
    return `https://placehold.co/1280x720/1a2923/ffffff?text=${encodeURIComponent(ep.titulo || ep.arquivo)}`;
  }

  function handleOuterClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeModal();
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeModal();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  role="dialog"
  aria-modal="true"
  tabindex="0"
  on:keydown={handleKeydown}
  class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
  on:click={handleOuterClick}
  transition:fade={{ duration: 200 }}
>
  <div
    class="bg-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scroll-container"
    in:fly={{ y: 50, duration: 300 }}
    out:fly={{ y: 50, duration: 200 }}
    aria-labelledby="modal-title"
  >
    <div class="relative">
      <img src={getEpisodeImageUrl(episode)} alt="Thumbnail do episódio" class="w-full h-48 object-cover rounded-t-xl bg-on-subtle/10" />
      <button on:click={closeModal} class="absolute top-3 right-3 bg-surface/50 rounded-full p-1.5 hover:bg-surface/80 transition" aria-label="Fechar modal">
        <!-- ícone -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="p-6">
      <div class="w-full overflow-hidden whitespace-nowrap">
        <h3 id="modal-title" class="truncate text-2xl font-bold text-text-main mb-2">{episode.titulo || `Episódio`}</h3>
      </div>

      <p class="text-text-secondary mb-6 text-wrap whitespace-pre-wrap">{episode.sinopse || 'Nenhuma sinopse disponível.'}</p>

      <div class="flex space-x-3 mt-6">
        <a href={`/player?play=${episode.path}&showCode=${showCode}`} class="flex-1 flex items-center justify-center py-3 px-5 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-transform transform hover:scale-105" on:click={closeModal}>
          <!-- assistir -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          Assistir
        </a>

        <button on:click={triggerDownload} class="flex-1 flex items-center justify-center py-3 px-5 bg-surface-alt text-text-main rounded-lg font-semibold hover:bg-surface-alt/80 transition-transform transform hover:scale-105">
          <!-- baixar -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414zM9 6a1 1 0 011-1h0a1 1 0 011 1v5a1 1 0 11-2 0V6z" clip-rule="evenodd" />
          </svg>
          Baixar
        </button>
      </div>
    </div>
  </div>
</div>
