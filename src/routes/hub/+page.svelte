<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { serverUrl } from '$lib/stores/settings';
	import type { CatalogoItem, ShowDetails } from '$lib/types';
	// import { addToFavorites, favorites } from '$lib/stores/favorites'; // Commented out favorites store and addToFavorites
	import { uiHealth } from '$lib/ui/health-check'; // Import uiHealth store

	import { fade } from 'svelte/transition';
	import { Play, Plus, LoaderCircle } from 'lucide-svelte';

	// ESTA ALTERAÇÃO É VISUAL: Componentes de UI redesenhados
	import ContentCarousel from '$lib/components/streaming/ContentCarousel.svelte';
	import DetailsPage from '$lib/components/streaming/DetailsPage.svelte';
	import ContinueWatching from '$lib/components/streaming/ContinueWatching.svelte';

	// --- Estado da Página ---
	let isLoading = true;
	let catalogo: (CatalogoItem & { progress?: number })[] = [];
	let unsubscribeStore: () => void;
	let currentServerUrl = '';

	// --- Estado de Interação ---
	let selectedItem: CatalogoItem | null = null;
	let selectedItemDetails: ShowDetails | null = null;
	let detailsLoading = false;
	let currentHeroIndex = 0; // Novo estado para o carrossel
	let heroRotationInterval: ReturnType<typeof setInterval>;

	// --- Lógica de Ciclo de Vida ---
	onMount(() => {
		if (!browser) return;
		unsubscribeStore = serverUrl.subscribe(url => {
			currentServerUrl = url;
			if (url) {
				fetchCatalogo(url);
			} else {
				goto('/login');
			}
		});
	});

	onDestroy(() => {
		if (unsubscribeStore) unsubscribeStore();
		clearInterval(heroRotationInterval); // Limpa o intervalo ao destruir
	});

	// --- Lógica de Dados ---
	async function fetchCatalogo(url: string) {
		isLoading = true;
		try {
			const response = await fetch(`${url}/api/catalogo`);
			if (!response.ok) throw new Error('Falha na comunicação com o servidor.');
			const data = await response.json();
			if (data.ok) {
				catalogo = data.catalogo.map((item: CatalogoItem) => ({
					...item,
					bannerUrl: item.poster || `${url}/midia/desenhos/${item.code}/banner.jpg`,
					poster: item.poster
						? item.poster.startsWith('http')
							? item.poster
							: `${url}/midia/${item.poster}`
						: `https://placehold.co/300/450/0f1724/ffffff?text=${encodeURIComponent(item.nome)}`,
					progress: Math.random() > 0.5 ? Math.random() : 0 // ESTA ALTERAÇÃO É VISUAL: Dado de progresso mockado
				}));
				isLoading = false;

				// Inicia a rotação do carrossel após carregar o catálogo
				if (catalogo.length > 1) {
					heroRotationInterval = setInterval(() => {
						currentHeroIndex = (currentHeroIndex + 1) % catalogo.length;
					}, 5000); // Troca a cada 5 segundos
				}

				const initialShowCode = $page.url.searchParams.get('showCode');
				if (initialShowCode) {
					const item = catalogo.find(c => c.code === initialShowCode);
					if (item) fetchDetails(item);
				}
			} else {
				throw new Error(data.error || 'Servidor retornou um erro.');
			}
		} catch (e: any) {
			isLoading = false;
		}
	}

	async function fetchDetails(item: CatalogoItem) {
		if (!currentServerUrl) return;
		detailsLoading = true;
		selectedItem = item;
		window.scrollTo(0, 0);

		try {
			const response = await fetch(`${currentServerUrl}/api/catalogo/${item.code}`);
			if (!response.ok) throw new Error('Desenho não encontrado.');
			const data = await response.json();
			if (data.ok && data.desenho) {
				selectedItemDetails = data.desenho;
			} else {
				throw new Error(data.error || 'Falha ao buscar detalhes.');
			}
		} catch (e) {
			selectedItem = null;
		} finally {
			detailsLoading = false;
		}
	}

	// ESTA ALTERAÇÃO É VISUAL: Agrupamento para carrosséis
	$: carousels = catalogo.reduce((acc, item) => {
		const genre = item.genero?.split(',')[0].trim() || 'Recomendados';
		if (!acc[genre]) acc[genre] = [];
		acc[genre].push(item);
		return acc;
	}, {} as Record<string, typeof catalogo>);

	// ESTA ALTERAÇÃO É VISUAL: Seleciona o item para a seção Hero com base no índice
	$: heroItem = catalogo[currentHeroIndex];

	// --- Lógica de Navegação ---
	function handleSelect(event: CustomEvent<CatalogoItem>) {
		const item = event.detail;
		if (item.videoPath) {
			goto(`/player?play=${item.videoPath}&showCode=${item.code}`);
		} else {
			fetchDetails(item);
		}
	}

	function handleBack() {
		selectedItem = null;
		selectedItemDetails = null;
	}
</script>

<!-- ESTA ALTERAÇÃO É VISUAL: Layout principal da página do hub -->
<div class="min-h-screen bg-background text-text-main">
	{#if !selectedItem}
		<!-- ESTA ALTERAÇÃO É VISUAL: Visão principal do Hub -->
		<div in:fade={{ duration: 300 }}>
			{#if isLoading}
				<div class="flex h-screen flex-col items-center justify-center">
					<LoaderCircle class="h-12 w-12 animate-spin text-accent-blue" />
					<p class="mt-4 font-semibold">Carregando catálogo...</p>
				</div>
			{:else if catalogo.length > 0}
				<!-- ESTA ALTERAÇÃO É VISUAL: Seção Hero -->
				{#if heroItem}
					<div class="relative -mt-16 h-[60vh] w-full md:-mt-24 lg:h-[75vh]">
						<div class="absolute inset-0 overflow-hidden">
							<img
								src={heroItem.poster}
								alt="Banner de {heroItem.nome}"
								class="h-full w-full object-cover blur-sm scale-110"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"
							></div>
						</div>
						<div
							class="relative mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-4 pb-20 md:px-8"
						>
							<h1 class="text-4xl font-extrabold md:text-6xl">{heroItem.nome}</h1>
							<p class="max-w-xl text-base text-muted md:text-lg line-clamp-3">
								{heroItem.description || 'Nenhuma descrição disponível.'}
							</p>
							<div class="mt-4 flex flex-wrap gap-4">
								<button
									on:click={() => handleSelect({ detail: heroItem } as CustomEvent<CatalogoItem>)}
									class="flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 font-bold text-background transition-transform hover:scale-105 active:scale-95"
								>
									<Play class="h-6 w-6 fill-current" />
									<span>Assistir</span>
								</button>
								<button
									on:click={() => heroItem && addToFavorites(heroItem)}
									class="flex h-12 items-center justify-center gap-2 rounded-lg bg-white/20 px-6 font-bold text-text-main backdrop-blur-sm transition-colors hover:bg-white/30"
								>
									<Plus class="h-6 w-6" />
									<span>Minha Lista</span>
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- ESTA ALTERAÇÃO É VISUAL: Layout para os carrosséis -->
				<main class="-mt-16 space-y-4 pb-20">
					<ContinueWatching {catalogo} on:select={handleSelect} />

					{#each Object.entries(carousels) as [genre, items] (genre)}
						<ContentCarousel title={genre} {items} on:select={handleSelect} />
					{/each}
				</main>
			{/if}
		</div>
	{:else}
		<!-- ESTA ALTERAÇÃO É VISUAL: Visão de Detalhes -->
		{#if detailsLoading && !selectedItemDetails}
			<div class="flex h-screen flex-col items-center justify-center">
				<LoaderCircle class="h-12 w-12 animate-spin text-accent-blue" />
				<p class="mt-4 font-semibold">Carregando detalhes...</p>
			</div>
		{:else if selectedItemDetails}
			<DetailsPage details={selectedItemDetails} serverUrl={$serverUrl} on:back={handleBack} />
		{/if}
	{/if} <!-- This closes the #if !selectedItem block -->

	{#if $uiHealth === 'offline'}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
			<div class="bg-surface p-8 rounded-lg shadow-xl text-center">
				<h2 class="text-2xl font-bold text-white mb-4">Servidor Desconectado</h2>
				<p class="text-muted mb-6">Não foi possível conectar ao servidor. Por favor, contate o suporte.</p>
				<a href="https://wa.me/SEU_NUMERO_DE_WHATSAPP" target="_blank" class="btn btn-primary">
					Contatar Suporte (WhatsApp)
				</a>
			</div>
		</div>
	{/if}
</div> <!-- Added this closing div -->