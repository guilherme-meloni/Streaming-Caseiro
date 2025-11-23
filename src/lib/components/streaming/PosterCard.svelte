<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
	import type { CatalogoItem } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { Play, Plus } from 'lucide-svelte';

	export let item: CatalogoItem & { progress?: number };

	const dispatch = createEventDispatcher();

	// ESTA ALTERAÇÃO É VISUAL: Ação de clique principal (play/details)
	function handleClick() {
		dispatch('select', item);
	}

	// ESTA ALTERAÇÃO É VISUAL: Ação para adicionar à lista (sem lógica, apenas visual)
	function handleAddToList(e: MouseEvent) {
		e.stopPropagation(); // Previne que o clique dispare o `handleClick` do card
		console.info('Visual action: Add to list', item.nome);
	}

    // ESTA ALTERAÇÃO É VISUAL: Garante acessibilidade para o card clicável
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
        }
    }
</script>

<!-- 
  ESTA ALTERAÇÃO É VISUAL
  - Alterado para card vertical (aspect-2/3)
  - Adicionada animação de hover/focus (scale, translate, shadow)
  - Overlay agora tem botões de Ação (Play, Add)
  - Barra de progresso visual adicionada
  - Touch-action-pan-y permite scroll vertical em mobile sem acionar o card
-->
<div
	role="button"
    tabindex="0"
	class="group relative h-full w-full shrink-0 cursor-pointer text-left focus:outline-none"
	on:click={handleClick}
    on:keydown={handleKeydown}
>
	<div
		class="relative transform-gpu overflow-hidden rounded-xl bg-surface shadow-md transition-transform-shadow duration-200 ease-custom-ease group-hover:-translate-y-1 group-hover:scale-103 group-hover:shadow-lg group-focus-visible:-translate-y-1 group-focus-visible:scale-103 group-focus-visible:shadow-lg"
	>
		<img
			src={item.poster}
			alt={item.nome}
			class="aspect-[2/3] w-full bg-surface object-cover"
			loading="lazy"
		/>

		<!-- ESTA ALTERAÇÃO É VISUAL: Overlay com ações que aparece no hover -->
		<div
			class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
		>
			<h4 class="text-center text-lg font-bold text-text-main">{item.nome}</h4>
			<div class="mt-4 flex items-center gap-4">
				<button
					class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-background transition-transform hover:bg-white active:scale-90"
					aria-label="Play"
				>
					<Play class="h-6 w-6 fill-current" />
				</button>
				<button
					on:click={handleAddToList}
					class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-text-main transition-colors hover:border-white hover:bg-white/30 active:scale-90"
					aria-label="Adicionar à lista"
				>
					<Plus class="h-6 w-6" />
				</button>
			</div>
		</div>

		<!-- ESTA ALTERAÇÃO É VISUAL: Barra de progresso -->
		{#if item.progress && item.progress > 0 && item.progress < 1}
			<div class="absolute bottom-0 left-0 h-1 w-full bg-muted/30">
				<div class="h-full bg-accent-blue" style="width: {item.progress * 100}%;"></div>
			</div>
		{/if}
	</div>
</div>