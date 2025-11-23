<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
	import type { CatalogoItem } from '$lib/types';
	import PosterCard from './PosterCard.svelte';

	export let title: string;
	export let items: (CatalogoItem & { progress?: number })[];
</script>

<!-- 
  ESTA ALTERAÇÃO É VISUAL
  - Adicionado scroll-snap para uma experiência de swipe mais natural.
  - Ajustado o espaçamento e o tamanho dos itens para o novo PosterCard vertical.
  - Adicionado padding horizontal para que os cards não colem nas bordas.
-->
<section class="mb-8 md:mb-12">
	<h3 class="mb-4 px-4 text-xl font-bold text-text-main md:px-8 md:text-2xl">{title}</h3>
	<div
		class="snap-x-mandatory scrollbar-hide grid auto-cols-[42%] grid-flow-col gap-4 overflow-x-auto px-4 md:auto-cols-[22%] md:gap-6 md:px-8 lg:auto-cols-[18%] xl:auto-cols-[15%]"
	>
		{#each items as item (item.code)}
			<div class="snap-start">
				<PosterCard {item} on:select />
			</div>
		{/each}
	</div>
</section>