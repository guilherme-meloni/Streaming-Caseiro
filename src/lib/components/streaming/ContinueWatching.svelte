<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
	import type { CatalogoItem } from '$lib/types';
	import ContentCarousel from './ContentCarousel.svelte';
	import { createEventDispatcher } from 'svelte';

	export let catalogo: (CatalogoItem & { progress?: number })[] = [];

	const dispatch = createEventDispatcher();

	// ESTA ALTERAÇÃO É VISUAL: Filtra itens para a seção "Continue Assistindo"
	$: continueWatchingItems = catalogo.filter(
		item => item.progress && item.progress > 0.05 && item.progress < 0.95 // Itens com progresso significativo
	);

	function handleSelect(event: CustomEvent<CatalogoItem>) {
		dispatch('select', event.detail);
	}
</script>

<!-- ESTA ALTERAÇÃO É VISUAL: Reutiliza o ContentCarousel para consistência visual -->
{#if continueWatchingItems.length > 0}
	<ContentCarousel title="Continue Assistindo" items={continueWatchingItems} on:select={handleSelect} />
{/if}
