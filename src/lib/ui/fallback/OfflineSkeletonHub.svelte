<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
  // ESTA ALTERAÇÃO É VISUAL
  import { sampleCatalog } from './sample_catalog';
  import ContentCarousel from '$lib/components/streaming/ContentCarousel.svelte';

  // ESTA ALTERAÇÃO É VISUAL
  // Agrupa o catálogo de amostra por gênero para criar os carrosséis de fallback.
  const byGenre = sampleCatalog.reduce((acc, item) => {
    if (!acc[item.genre]) {
      acc[item.genre] = [];
    }
    acc[item.genre].push(item);
    return acc;
  }, {} as Record<string, typeof sampleCatalog>);

  const continueWatching = sampleCatalog.filter(item => item.progress && item.progress > 0 && item.progress < 1);
</script>

<!-- ESTA ALTERAÇÃO É VISUAL -->
<!-- Este componente renderiza um hub com dados locais quando o backend está offline -->
<div class="p-4 pt-28 md:p-8">
  <!-- Hero Section Skeleton -->
  <div class="relative mb-12 h-64 w-full animate-pulse rounded-2xl bg-surface md:h-80 lg:h-96"></div>

  <!-- Continue Watching Carousel -->
  {#if continueWatching.length > 0}
    <div class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-main">Continue Assistindo (Offline)</h2>
      <ContentCarousel>
        {#each continueWatching as item (item.id)}
          <div class="w-1/2 flex-shrink-0 snap-start pr-4 md:w-1/3 lg:w-1/4 xl:w-1/5">
            <!-- Placeholder para o PosterCard -->
            <div class="aspect-[2/3] w-full rounded-lg bg-surface/80">
              <div class="flex h-full flex-col justify-end p-3">
                <div class="h-4 w-3/4 rounded bg-muted/30"></div>
              </div>
            </div>
          </div>
        {/each}
      </ContentCarousel>
    </div>
  {/if}

  <!-- Carousels por Gênero -->
  {#each Object.entries(byGenre) as [genre, items] (genre)}
    <div class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-main">{genre} (Offline)</h2>
      <ContentCarousel>
        {#each items as item (item.id)}
          <div class="w-1/2 flex-shrink-0 snap-start pr-4 md:w-1/3 lg:w-1/4 xl:w-1/5">
            <!-- Placeholder para o PosterCard -->
            <div class="aspect-[2/3] w-full rounded-lg bg-surface/80">
              <div class="flex h-full flex-col justify-end p-3">
                <div class="h-4 w-3/4 rounded bg-muted/30"></div>
              </div>
            </div>
          </div>
        {/each}
      </ContentCarousel>
    </div>
  {/each}
</div>
