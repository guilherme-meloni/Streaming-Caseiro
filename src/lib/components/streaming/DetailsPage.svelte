<!-- src/lib/components/streaming/DetailsPage.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { ShowDetails } from '$lib/types';
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import EpisodeDetailsModal from './EpisodeDetailsModal.svelte';
    import { addToFavorites, favorites } from '$lib/stores/favorites'; // Import favorites store and addToFavorites
    import { Plus } from 'lucide-svelte'; // Import Plus icon
    import { watchHistory, getEpisodeProgress } from '$lib/stores/watchHistory'; // Import watchHistory store and getEpisodeProgress

    // Capacitor (dinâmico no onMount)
    let FileTransfer: any;
    let Filesystem: any;
    let Directory: any;

    export let details: ShowDetails;
    export let serverUrl: string; // usado p/ montar URLs absolutas de imagem

    let activeSeasonIndex = 0;
    let showFullDescription = false;
    const MAX_DESCRIPTION_LENGTH = 250;

    // Modal de detalhes do episódio
    let isModalOpen = false;
    let selectedEpisode: (typeof details.temporadas)[0]['episodios'][0] | null = null;
    let pressTimer: number | null = null;
    let longPressTriggered = false;

    const dispatch = createEventDispatcher();
    function goBack() { dispatch('back'); }

    // --- Helpers de UI/URLs ---
    function getPosterUrl(detailsInfo: ShowDetails) {
        if (detailsInfo.poster && (detailsInfo.poster.startsWith('http://') || detailsInfo.poster.startsWith('https://'))) {
            return detailsInfo.poster;
        }
        if (detailsInfo.poster) return `${serverUrl}/midia/${detailsInfo.poster}`;
        return (detailsInfo as any).posterUrl || `https://placehold.co/400x600/1a2923/8f9e98?text=${encodeURIComponent(detailsInfo.nomeReal)}`;
    }

    function formatEpisodeName(filename: string): string {
        const match = filename?.match(/E(\d+)/i);
        return match ? `Episódio ${parseInt(match[1], 10)}` : (filename || '').replace('.mp4', '');
    }

    function truncate(text: string | undefined, length: number): string {
        if (!text || text.length <= length) return text || 'Sem sinopse.';
        return text.substring(0, length) + '...';
    }

    function handlePressStart(episode: any) {
        longPressTriggered = false;
        pressTimer = window.setTimeout(() => {
            longPressTriggered = true;
            openModal(episode);
        }, 500);
    }
    function handlePressEnd() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }
    function handleClick(event: MouseEvent) {
        if (longPressTriggered) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
    function openModal(episode: any) {
        selectedEpisode = episode;
        isModalOpen = true;
    }
    function closeModal() {
        isModalOpen = false;
        selectedEpisode = null;
    }

    // Descrição truncada
    $: displayDescription = showFullDescription || (details.descricao?.length || 0) <= MAX_DESCRIPTION_LENGTH
        ? details.descricao
        : details.descricao?.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
    $: needsTruncation = (details.descricao?.length || 0) > MAX_DESCRIPTION_LENGTH;

    // Detecta FILME:
    $: hasSeasons = Array.isArray(details.temporadas) && details.temporadas.length > 0 && Array.isArray(details.temporadas[0]?.episodios);
    $: isMovie =
        !!(details as any).videoPath ||
        (typeof (details as any).tipo === 'string' && (details as any).tipo.toLowerCase() === 'filme') ||
        !hasSeasons;

    // Path do filme (o backend não envia videoPath; vem em temporadas[0].episodios[0].path)
    function getMovieRelativePath(): string | null {
        // 1) se algum dia vier videoPath, usa:
        const vp = (details as any)?.videoPath;
        if (typeof vp === 'string' && vp.length > 0) return vp;

        // 2) tenta extrair do bloco de temporadas/episódios:
        if (hasSeasons) {
            const t0 = details.temporadas[0];
            if (t0 && Array.isArray(t0.episodios) && t0.episodios.length > 0) {
                const ep0 = t0.episodios[0];
                if (ep0?.path) return ep0.path;
            }
        }
        return null;
    }
    $: moviePath = isMovie ? getMovieRelativePath() : null;

    onMount(async () => {
        if (browser) {
            try {
                const [fileTransferModule, filesystemModule] = await Promise.all([
                    import('@capacitor/file-transfer'),
                    import('@capacitor/filesystem')
                ]);
                FileTransfer = fileTransferModule.FileTransfer;
                Filesystem = filesystemModule.Filesystem;
                Directory = filesystemModule.Directory;
            } catch (e) {
                console.error('DetailsPage: erro ao carregar FileTransfer/Filesystem:', e);
            }
        }
    });

    onDestroy(() => {
        handlePressEnd();
    });

    async function handleDownload(filePath: string, fileName: string) {
        if (!serverUrl) {
            alert('Erro: URL do servidor não configurada.');
            return;
        }
        if (!browser) {
            alert('Funcionalidade de download não disponível fora do navegador.');
            return;
        }
        if (!FileTransfer || !Filesystem || !Directory) {
            alert('Erro: Plugin de download não carregado. Tente novamente.');
            return;
        }

        const downloadUrl = `${serverUrl}/midia/${filePath}`;
        const targetFileName = (fileName || 'vídeo') + '.mp4';

        try {
            const permissionStatus = await Filesystem.checkPermissions();
            if (permissionStatus.publicStorage !== 'granted') {
                const requestResult = await Filesystem.requestPermissions();
                if (requestResult.publicStorage !== 'granted') {
                    alert('Permissão de armazenamento negada.');
                    return;
                }
            }

            const fileInfo = await Filesystem.getUri({
                directory: Directory.Documents,
                path: targetFileName
            });

            const { path } = await FileTransfer.downloadFile({
                url: downloadUrl,
                path: fileInfo.uri,
            });

            alert(`Download de "${fileName}" concluído! Salvo em: ${path}`);
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Falha ao baixar "${fileName}". Veja o console para mais detalhes.`);
        }
    }
</script>

<style>
    .safe-bottom {
        padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 6rem);
    }
    .details-gradient {
        background: linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%);
    }
    .btn {
        border-radius: 0.75rem;
        padding: 0.9rem 1.25rem;
        font-weight: 600;
        transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        white-space: nowrap;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary {
        background: linear-gradient(135deg, #2ea0ff, #1462ff);
        color: white;
        box-shadow: 0 10px 24px rgba(20,98,255,0.28);
    }
    .btn-primary:hover { box-shadow: 0 12px 28px rgba(20,98,255,0.36); }
    .btn-outline {
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.18);
        backdrop-filter: blur(6px);
    }
    .pill {
        border: 1px solid rgba(255,255,255,0.16);
        padding: 0.1rem 0.5rem;
        border-radius: 0.5rem;
        font-size: 0.85rem;
    }
</style>

<div in:fly={{ y: 200, duration: 300 }}>
    <!-- Banner -->
    <section class="relative h-[50vh] sm:h-[70vh] w-full flex items-end">
        <div class="absolute inset-0 overflow-hidden">
            <img src={getPosterUrl(details)} alt="Banner de fundo" class="w-full h-full object-cover scale-110 blur-md brightness-75">
            <div class="absolute inset-0 details-gradient"></div>
        </div>

        <button on:click={goBack} aria-label="Voltar" class="absolute top-6 left-6 z-20 bg-surface/50 rounded-full p-2 hover:bg-surface/80 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        <div class="relative z-10 p-4 sm:p-8 flex items-end space-x-6">
            <img src={getPosterUrl(details)} alt="Pôster do Título" class="w-32 sm:w-48 rounded-lg -mb-16 shadow-2xl">
            <div>
                <h2 class="text-3xl sm:text-5xl font-bold text-text-main">{details.nomeReal}</h2>
                <div class="flex items-center space-x-4 mt-2 text-text-secondary">
                    <span>{details.ano || 'N/A'}</span>
                    <span class="pill">{details.genero || 'N/A'}</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Descrição e ações -->
    <div class="p-4 sm:p-8 pt-20">
        <p class="max-w-3xl text-text-secondary overflow-hidden text-wrap">
            {displayDescription || 'Nenhuma descrição disponível.'}
        </p>
        {#if needsTruncation}
            <button on:click={() => (showFullDescription = !showFullDescription)} class="text-primary hover:underline mt-2 text-sm">
                {showFullDescription ? 'Mostrar Menos' : 'Ler Mais'}
            </button>
        {/if}

        <!-- FILME -->
        {#if isMovie}
            <div class="mt-6 flex items-center gap-3">
                {#if moviePath}
                    <a
                        href={`/player?play=${encodeURIComponent(moviePath)}&showCode=${encodeURIComponent(details.code)}`}
                        class="btn btn-primary"
                        aria-label="Assistir filme"
                    >
                        <!-- Ícone play -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M7.5 5.4c0-.9.98-1.45 1.75-.95l8.25 5.25c.71.45.71 1.45 0 1.9L9.25 16.9c-.77.49-1.75-.05-1.75-.95V5.4z"></path>
                        </svg>
                        Assistir filme
                    </a>
                    <a
                        href={`/player?play=${encodeURIComponent(moviePath)}&showCode=${encodeURIComponent(details.code)}#download`}
                        class="btn btn-outline"
                        aria-label="Baixar filme"
                    >
                        <!-- Ícone download -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L7.279 11.707a1 1 0 011.414-1.414L11 12.586V4a1 1 0 011-1z"></path>
                            <path d="M5 18a2 2 0 012-2h10a2 2 0 012 2v1H5v-1z"></path>
                        </svg>
                        Baixar
                    </a>
                {:else}
                    <button class="btn btn-primary opacity-60 cursor-not-allowed" disabled>
                        Indisponível — sem path do filme
                    </button>
                {/if}
                <button
                    on:click={() => addToFavorites({ code: details.code, nome: details.nomeReal, poster: details.poster })}
                    class="btn btn-outline"
                    aria-label="Adicionar aos favoritos"
                >
                    <Plus class="h-5 w-5" />
                    Adicionar aos Favoritos
                </button>
            </div>
        {/if}
    </div>

    <!-- Episódios (para séries) -->
    {#if !isMovie && hasSeasons}
        <div class="mt-6 flex items-center gap-3">
            <button
                on:click={() => addToFavorites({ code: details.code, nome: details.nomeReal, poster: details.poster })}
                class="btn btn-outline"
                aria-label="Adicionar aos favoritos"
            >
                <Plus class="h-5 w-5" />
                Adicionar aos Favoritos
            </button>
        </div>
        <div class="p-4 sm:p-8 safe-bottom">
            <div class="border-b border-on-subtle mb-4">
                <nav class="-mb-px flex space-x-6 overflow-x-auto scroll-container px-4" aria-label="Tabs">
                    {#each details.temporadas as temporada, index}
                        <button
                            on:click={() => activeSeasonIndex = index}
                            class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeSeasonIndex === index ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-subtle'}"
                        >
                            {temporada.nome.replace('-', ' ')}
                        </button>
                    {/each}
                </nav>
            </div>

            <div class="space-y-3 pb-32">
                {#each details.temporadas[activeSeasonIndex].episodios as episode (episode.path)}
                    {@const episodeCode = episode.path}
                    {@const progress = $watchHistory.get(episodeCode)}
                    <div class="flex items-center space-x-4 p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors group">
                        <a
                            href={`/player?play=${encodeURIComponent(episode.path)}&showCode=${encodeURIComponent(details.code)}`}
                            class="flex flex-1 items-center space-x-4 cursor-pointer overflow-hidden"
                            on:mousedown={() => handlePressStart(episode)}                            on:touchstart={() => handlePressStart(episode)}
                            on:mouseup={handlePressEnd}
                            on:mouseleave={handlePressEnd}
                            on:touchend={handlePressEnd}
                            on:click|capture={handleClick}
                        >
                            <img
                                src={episode.thumbnail || `https://placehold.co/160x90/1a2923/ffffff?text=${encodeURIComponent((episode.arquivo || '').replace('.mp4', ''))}`}
                                alt="Thumbnail do episódio"
                                class="h-16 w-28 flex-shrink-0 rounded-md bg-surface object-cover"
                                loading="lazy"
                            />
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-text-main overflow-hidden whitespace-nowrap text-ellipsis">
                                    {episode.titulo || formatEpisodeName(episode.arquivo)}
                                </h4>
                                <p class="mt-1 text-sm text-text-secondary text-wrap">
                                    {truncate(episode.sinopse, 100)}
                                    {#if episode.sinopse && episode.sinopse.length > 100}
                                        <span class="text-primary/80 font-medium"> (segure para detalhes)</span>
                                    {/if}
                                </p>
                                {#if progress && progress.isComplete}
                                    <span class="text-xs text-green-500 font-medium mt-1">Assistido</span>
                                {:else if progress && progress.progress > 0}
                                    <span class="text-xs text-yellow-500 font-medium mt-1">Continuar ({Math.round(progress.progress * 100)}%)</span>
                                {/if}
                            </div>
                        </a>
                        <!-- Botão de download opcional
                        <button
                            class="flex-shrink-0 p-2 rounded-full transition-colors hover:bg-white/10"
                            on:click={() => handleDownload(episode.path, episode.titulo || episode.arquivo)}
                            aria-label="Baixar episódio"
                        >
                            ⬇
                        </button>
                        -->
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if isModalOpen && selectedEpisode}
        <EpisodeDetailsModal
            episode={selectedEpisode}
            showCode={details.code}
            serverUrl={serverUrl}
            on:close={closeModal}
            handleDownload={handleDownload}
        />
    {/if}
</div>
