<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { serverUrl } from '$lib/stores/settings';
	import { fly } from 'svelte/transition';
	import type { ShowDetails } from '$lib/types';
	import { ArrowLeft, LoaderCircle, AlertTriangle, Play, Download, CheckCircle, AlertCircle as AlertCircleIcon } from 'lucide-svelte';
    import { downloads } from '$lib/stores/downloads';
    import onlineStatus from '$lib/stores/onlineStatus';

	let desenho: ShowDetails | null = null;
	let isLoading = true;
	let errorMessage = '';
	let currentServerUrl = '';
	let activeSeasonIndex = 0;
	let unsubscribeStore: () => void;

	onMount(() => {
		unsubscribeStore = serverUrl.subscribe((url) => {
			currentServerUrl = url;
			if (url) {
				console.log('DEBUG: currentServerUrl no catalogo: ', url);
				fetchDetalhes();
			}
		});
	});

    onDestroy(() => {
        if (unsubscribeStore) unsubscribeStore();
    })

	async function fetchDetalhes() {
		const code = $page.params.code;
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(`${currentServerUrl}/api/catalogo/${code}`);
			if (!response.ok) {
                // Se a resposta não for OK e estiver offline, pode ser um erro de rede
                if (response.status === 0 && !$onlineStatus) {
                    throw new Error('Sem conexão com a internet. Exibindo dados em cache (se disponíveis).');
                }
                throw new Error('Desenho não encontrado ou erro no servidor.');
            }

			const data = await response.json();
			if (data.ok && data.desenho) {
				desenho = data.desenho;
			} else {
				throw new Error(data.error || 'Falha ao buscar detalhes do desenho.');	
			}
		} catch (err) {
            // Erros de tipo `TypeError` geralmente indicam problemas de rede (offline, servidor inacessível, DNS)
            if (err instanceof TypeError) {
                errorMessage = 'Servidor desligado ou sem conexão com a internet. Informe o suporte técnico.';
            } else {
                // Outros erros (ex: HTTP 404, 500 do servidor)
                errorMessage = (err as Error).message;
            }
		} finally {
			isLoading = false;
		}
	}



    function formatEpisodeName(filename: string): string {
		const match = filename.match(/E(\d+)/i);
		return match ? `Episódio ${parseInt(match[1], 10)}` : filename.replace('.mp4', '');
	}
</script>

<main class="h-full w-full p-4 md:p-6">
	<div class="mx-auto max-w-5xl">
		<a
			href="/catalogo"
			class="mb-6 inline-flex items-center gap-2 text-subtle transition-colors hover:text-white"
		>
			<ArrowLeft class="h-5 w-5" />
			Voltar para o Catálogo
		</a>

		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<LoaderCircle class="h-12 w-12 animate-spin text-primary" />
				<p class="mt-4 font-semibold">Carregando detalhes do desenho...</p>
			</div>
		{:else if errorMessage}
			<div
				class="flex flex-col items-center justify-center rounded-lg bg-red-900/50 py-20 text-center text-red-300"
			>
				<AlertTriangle class="h-12 w-12" />
				<p class="mt-4 font-semibold">Falha ao carregar</p>
				<p class="text-sm">{errorMessage}</p>
			</div>
		{:else if desenho}
			<div
				class="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr] lg:gap-8"
				in:fly={{ y: 20, duration: 400 }}
			>
				<div class="flex flex-col items-center md:items-start">
					<img
						src={desenho.poster || desenho.posterUrl ||
			`https://placehold.co/400x600/1a2923/8f9e98?text=${encodeURIComponent
			(desenho.nomeReal)}`}
						alt="Pôster de {desenho.nomeReal}"
						class="aspect-[2/3] w-full max-w-xs rounded-lg object-cover shadow-lg"
					/>
					<div class="mt-4 w-full max-w-xs space-y-2 text-center text-sm text-subtle md:text-left">
						<p><strong>Ano:</strong> {desenho.ano || 'N/A'}</p>
						<p><strong>Gênero:</strong> {desenho.genero || 'N/A'}</p>
					</div>
					{#if $onlineStatus}
						<a
							href="/player?channel={$page.params.code}"
							class="mt-4 block w-full max-w-xs rounded-lg bg-primary py-3 text-center font-display font-bold text-white transition hover:bg-primary-hover active:scale-95"
						>
							Assistir Canal 24h
						</a>
					{:else}
						<div class="mt-4 w-full max-w-xs rounded-lg bg-gray-700 py-3 text-center font-display font-bold text-gray-400">
							Sem rede para assistir
						</div>
					{/if}
				</div>

				<div class="w-full">
					<h1 class="font-display text-4xl font-bold">{desenho.nomeReal}</h1>
					<p class="mt-4 text-white/80">{desenho.descricao || 'Nenhuma descrição disponível.'}</p>
					<div class="mt-8 rounded-lg border border-on-subtle bg-surface">
						{#if desenho.temporadas.length > 0}
							<div class="flex-shrink-0 border-b border-on-subtle p-4">
								<div class="flex flex-wrap items-center gap-2">
									{#each desenho.temporadas as temporada, index}
										<button
											on:click={() => (activeSeasonIndex = index)}
											class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors {activeSeasonIndex ===
											index
												? 'bg-primary text-white'
												: 'bg-on-subtle/50 text-subtle hover:bg-on-subtle hover:text-white'}"
										>
											{temporada.nome.replace('-', ' ')}
										</button>
									{/each}
								</div>
							</div>

							<ul class="flex-1 space-y-1 overflow-y-auto p-4 max-h-[50vh]">
								{#each desenho.temporadas[activeSeasonIndex].episodios as episodio (episodio.arquivo)}
									{@const downloadState = $downloads[episodio.path]}
									<li class="group flex items-center gap-2 rounded-lg p-3 transition-colors hover:bg-primary/20">
										{#if $onlineStatus}
											<a href="/player?play={episodio.path}&showCode={$page.params.code}" class="flex flex-1 items-center gap-4 text-left">
												<span
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-on-subtle/50 font-mono text-sm font-bold text-subtle group-hover:bg-primary group-hover:text-white"
												>
													{parseInt(episodio.arquivo.match(/E(\d+)/)?.[1] || '0')}
												</span>
												<span class="flex-1 font-medium group-hover:text-white">
													{formatEpisodeName(episodio.arquivo)}
												</span>
											</a>
										{:else}
											<div class="flex flex-1 items-center gap-4 text-left text-subtle">
												<span
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-on-subtle/50 font-mono text-sm font-bold"
												>
													{parseInt(episodio.arquivo.match(/E(\d+)/)?.[1] || '0')}
												</span>
												<span class="flex-1 font-medium">
													{formatEpisodeName(episodio.arquivo)} (Offline)
												</span>
											</div>
										{/if}
										
										<button
                                            aria-label="Baixar Episódio"
											class="flex-shrink-0 p-2 -mr-2 rounded-full transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
											disabled={!!downloadState && downloadState.status !== 'error'}
                                            on:click={() => desenho && downloads.startDownload(currentServerUrl, desenho, episodio)}
										>
											{#if !downloadState}
												<Download class="h-5 w-5 text-subtle group-hover:text-white" />
											{:else if downloadState.status === 'completed'}
												<CheckCircle class="h-5 w-5 text-primary" />
											{:else if downloadState.status === 'downloading'}
												<LoaderCircle class="h-5 w-5 animate-spin text-subtle" />
                                            {:else if downloadState.status === 'error'}
                                                <AlertCircleIcon class="h-5 w-5 text-red-500" />
											{/if}
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<div class="flex h-full min-h-48 items-center justify-center text-center text-subtle">
								<p>Nenhum episódio encontrado para este desenho.</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</main>
