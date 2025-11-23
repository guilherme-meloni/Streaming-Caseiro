<!-- src/lib/components/streaming/DetailsPage.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { ShowDetails } from '$lib/types';
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import EpisodeDetailsModal from './EpisodeDetailsModal.svelte';
    import { addToFavorites } from '$lib/stores/favorites';
    import { Plus } from 'lucide-svelte';
    import { watchHistory } from '$lib/stores/watchHistory';

    let FileTransfer: any;
    let Filesystem: any;
    let Directory: any;

    export let details: ShowDetails;
    export let serverUrl: string;

    let activeSeasonIndex = 0;
    let showFullDescription = false;
    const MAX_DESCRIPTION_LENGTH = 250;

    let isModalOpen = false;
    let selectedEpisode: any = null;
    let pressTimer: number | null = null;
    let longPressTriggered = false;

    // UI states
    let showSimilar = false; // <-- similares começam ocultos

    const dispatch = createEventDispatcher();
    function goBack() { dispatch('back'); }

    // Helpers
    function getPosterUrl(detailsInfo: any) {
        const posterCandidates = [detailsInfo.poster, detailsInfo.posterUrl, detailsInfo.poster_path];
        const p = posterCandidates.find(x => x);
        if (!p) return `https://placehold.co/400x600/1a2923/8f9e98?text=${encodeURIComponent(detailsInfo.nomeReal || detailsInfo.name || 'Sem Título')}`;
        if (typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))) return p;
        const rel = (p as string).replace(/^\/+/, '');
        return `${serverUrl}/midia/${rel}`;
    }

    function ensureImageUrl(src: string | undefined | null) {
        if (!src) return null;
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        return `${serverUrl}/midia/${src.replace(/^\/+/, '')}`;
    }

    function formatEpisodeNameFromAny(ep: any) {
        const filename = ep.arquivo || ep.file || ep.path || ep.name || '';
        const match = (filename || '').match(/E(\d+)/i);
        if (match) return `Episódio ${parseInt(match[1], 10)}`;
        const tit = ep.titulo || ep.title || '';
        if (tit) return tit;
        return (filename || '').replace('.mp4', '') || 'Episódio';
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
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
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
    function closeModal() { isModalOpen = false; selectedEpisode = null; }

    $: displayDescription = showFullDescription || (details?.descricao?.length || details?.overview?.length || 0) <= MAX_DESCRIPTION_LENGTH
        ? (details.descricao || details.overview || '')
        : (details.descricao || details.overview || '').substring(0, MAX_DESCRIPTION_LENGTH) + '...';

    $: needsTruncation = (details?.descricao?.length || details?.overview?.length || 0) > MAX_DESCRIPTION_LENGTH;

    $: hasSeasons = Array.isArray(details?.temporadas) && details.temporadas.length > 0 && Array.isArray(details.temporadas[0]?.episodios);

    $: isMovie =
        !!(details as any).videoPath ||
        (typeof (details as any).tipo === 'string' && (details as any).tipo.toLowerCase() === 'filme') ||
        !hasSeasons;

    function getMovieRelativePath(): string | null {
        const vp = (details as any)?.videoPath;
        if (typeof vp === 'string' && vp.length > 0) return vp;
        if (hasSeasons) {
            const t0 = details.temporadas[0];
            if (t0 && Array.isArray(t0.episodios) && t0.episodios.length > 0) {
                const ep0 = t0.episodios[0];
                if (ep0?.path) return ep0.path;
                if (ep0?.arquivo) return ep0.arquivo;
            }
        }
        if ((details as any).path) return (details as any).path;
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
                console.warn('DetailsPage: plugins de filesystem não carregados:', e);
            }
        }
    });

    onDestroy(() => handlePressEnd());

    async function handleDownload(filePath: string, fileName: string) {
        if (!serverUrl) { alert('Erro: URL do servidor não configurada.'); return; }
        if (!browser) { alert('Funcionalidade de download não disponível fora do navegador.'); return; }
        if (!FileTransfer || !Filesystem || !Directory) { alert('Erro: Plugin de download não carregado.'); return; }

        const downloadUrl = `${serverUrl}/midia/${filePath}`;
        const targetFileName = (fileName || 'vídeo') + '.mp4';
        try {
            const permissionStatus = await Filesystem.checkPermissions();
            if (permissionStatus.publicStorage !== 'granted') {
                const requestResult = await Filesystem.requestPermissions();
                if (requestResult.publicStorage !== 'granted') { alert('Permissão de armazenamento negada.'); return; }
            }
            const fileInfo = await Filesystem.getUri({ directory: Directory.Documents, path: targetFileName });
            const { path } = await FileTransfer.downloadFile({ url: downloadUrl, path: fileInfo.uri });
            alert(`Download de "${fileName}" concluído! Salvo em: ${path}`);
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Falha ao baixar "${fileName}". Veja o console para mais detalhes.`);
        }
    }
</script>

<style>
    .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 6rem); }
    .details-gradient { background: linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%); }
    .btn { border-radius: 0.75rem; padding: 0.9rem 1.25rem; font-weight:600; transition:transform 120ms; display:inline-flex; gap:0.6rem; }
    .btn-primary { background:linear-gradient(135deg,#2ea0ff,#1462ff); color:white; box-shadow:0 10px 24px rgba(20,98,255,0.28); }
    .btn-outline { background:transparent; color:white; border:1px solid rgba(255,255,255,0.12); }
    .pill { border:1px solid rgba(255,255,255,0.12); padding:0.15rem 0.5rem; border-radius:0.5rem; font-size:0.85rem; }
    .section { margin-top:1.25rem; padding:1rem; background:linear-gradient(180deg, rgba(255,255,255,0.02), transparent); border-radius:0.75rem; }
    .cast-grid { display:flex; gap:0.75rem; overflow:auto; padding-bottom:0.5rem; }
    .cast-item { min-width:84px; text-align:center; font-size:0.85rem; }
    .meta-row { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; }
    .meta-pill { background:rgba(255,255,255,0.04); padding:0.25rem 0.6rem; border-radius:0.5rem; font-size:0.85rem; }
    .similar-toggle { display:inline-flex; gap:0.5rem; align-items:center; cursor:pointer; padding:0.25rem 0.5rem; border-radius:0.5rem; border:1px solid rgba(255,255,255,0.06); }
</style>

<div in:fly={{ y: 200, duration: 300 }}>
    <!-- Banner -->
    <section class="relative h-[50vh] sm:h-[70vh] w-full flex items-end">
        <div class="absolute inset-0 overflow-hidden">
            <img src={getPosterUrl(details)} alt="Banner de fundo" class="w-full h-full object-cover scale-110 blur-md brightness-75">
            <div class="absolute inset-0 details-gradient"></div>
        </div>

        <button on:click={goBack} aria-label="Voltar" class="absolute top-6 left-6 z-20 bg-surface/50 rounded-full p-2 hover:bg-surface/80 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div class="relative z-10 p-4 sm:p-8 flex items-end space-x-6">
            <img src={getPosterUrl(details)} alt="Pôster do Título" class="w-32 sm:w-48 rounded-lg -mb-16 shadow-2xl">
            <div>
                <h2 class="text-3xl sm:text-5xl font-bold text-text-main">{details.nomeReal || details.name}</h2>
                <div class="flex items-center space-x-4 mt-2 text-text-secondary">
                    <span>{details.ano || details.year || 'N/A'}</span>
                    <span class="pill">{details.genero || details.genre || 'N/A'}</span>
                    {#if details.voteAverage || details.rating}
                        <span class="pill">⭐ {Math.round((details.voteAverage || details.rating) * 10)/10}</span>
                    {/if}
                    {#if details.popularity}
                        <span class="pill">🔥 {Math.round(details.popularity)}</span>
                    {/if}
                </div>
            </div>
        </div>
    </section>

    <!-- Descrição e ações (a sinopse principal fica AQUI / somente uma instância) -->
    <div class="p-4 sm:p-8 pt-20">
        <p class="max-w-3xl text-text-secondary overflow-hidden text-wrap">
            {displayDescription || 'Nenhuma descrição disponível.'}
        </p>
        {#if needsTruncation}
            <button on:click={() => (showFullDescription = !showFullDescription)} class="text-primary hover:underline mt-2 text-sm">
                {showFullDescription ? 'Mostrar Menos' : 'Ler Mais'}
            </button>
        {/if}

        {#if isMovie}
            <div class="mt-6 flex items-center gap-3">
                {#if moviePath}
                    <a href={`/player?play=${encodeURIComponent(moviePath)}&showCode=${encodeURIComponent(details.code)}`} class="btn btn-primary" aria-label="Assistir filme">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 5.4c0-.9.98-1.45 1.75-.95l8.25 5.25c.71.45.71 1.45 0 1.9L9.25 16.9c-.77.49-1.75-.05-1.75-.95V5.4z"></path></svg>
                        Assistir filme
                    </a>
                    <a href={`/player?play=${encodeURIComponent(moviePath)}&showCode=${encodeURIComponent(details.code)}#download`} class="btn btn-outline" aria-label="Baixar filme">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L7.279 11.707a1 1 0 011.414-1.414L11 12.586V4a1 1 0 011-1z"></path><path d="M5 18a2 2 0 012-2h10a2 2 0 012 2v1H5v-1z"></path></svg>
                        Baixar
                    </a>
                {:else}
                    <button class="btn btn-primary opacity-60 cursor-not-allowed" disabled>Indisponível — sem path do filme</button>
                {/if}
                <button on:click={() => addToFavorites({ code: details.code, nome: details.nomeReal, poster: details.poster || details.posterUrl })} class="btn btn-outline">
                    <Plus class="h-5 w-5" /> Adicionar aos Favoritos
                </button>
                {#if details.trailerUrl}
                    <a href={details.trailerUrl} target="_blank" rel="noreferrer" class="btn btn-outline">Assistir Trailer</a>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Seções extras: elenco, produção, similares (similares oculto por padrão) -->
    <div class="p-4 sm:p-8">
        {#if (details.cast && details.cast.length) || (details.productionCompanies && details.productionCompanies.length)}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Removi o card adicional "Sinopse" aqui para evitar duplicação -->
                <div class="section col-span-2">
                    <!-- deixei espaço caso queira adicionar algo aqui futuramente -->
                </div>

                <div class="section">
                    <h3 class="font-semibold text-lg mb-2">Elenco</h3>
                    {#if details.cast && details.cast.length}
                        <div class="cast-grid">
                            {#each (typeof details.cast === 'string' ? JSON.parse(details.cast) : details.cast) as person}
                                <div class="cast-item">
                                    <img src={ person.photo ? (person.photo.startsWith('http') ? person.photo : `${serverUrl}/midia/${person.photo}`) : 'https://placehold.co/120x160/0f1724/ffffff?text=?' } alt={person.name} class="w-20 h-28 object-cover rounded-md mb-1"/>
                                    <div style="font-weight:700">{person.name}</div>
                                    <div style="opacity:.8;font-size:12px">{person.character || ''}</div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-text-secondary">Nenhum elenco disponível.</div>
                    {/if}

                    <h3 class="font-semibold text-lg mt-4 mb-2">Produção</h3>
                    {#if details.productionCompanies}
                        <div class="meta-row">
                            {#each (typeof details.productionCompanies === 'string' ? JSON.parse(details.productionCompanies) : details.productionCompanies) as pc}
                                <div class="meta-pill">{pc.name}</div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-text-secondary">Dados de produção não disponíveis.</div>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Similares: hidden por padrão, togglable -->
        {#if details.similarMovies || details.similarSeries}
            <div class="section mt-4">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <h3 class="font-semibold text-lg mb-3">Similares</h3>
                    <button class="similar-toggle" on:click={() => (showSimilar = !showSimilar)} aria-expanded={showSimilar}>
                        {showSimilar ? 'Ocultar' : 'Mostrar'} similares
                    </button>
                </div>

                {#if showSimilar}
                    <div style="display:flex;gap:1rem;overflow:auto;margin-top:0.5rem;">
                        {#each (details.similarMovies ? (typeof details.similarMovies === 'string' ? JSON.parse(details.similarMovies) : details.similarMovies) : (details.similarSeries ? (typeof details.similarSeries === 'string' ? JSON.parse(details.similarSeries) : details.similarSeries) : [])) as s}
                            <a class="block min-w-[140px]">
                                <img src={s.image ? (s.image.startsWith('http') ? s.image : `${serverUrl}/midia/${s.image}`) : 'https://placehold.co/160x240/0f1724/ffffff?text=?'} alt={s.title || s.name} class="w-36 h-52 object-cover rounded-md mb-2"/>
                                <div style="font-weight:700">{s.title || s.name}</div>
                                <div style="opacity:.8;font-size:12px">{s.year || s.first_air_date}</div>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Episódios -->
    {#if !isMovie && hasSeasons}
        <div class="p-4 sm:p-8 safe-bottom">
            <div class="border-b border-on-subtle mb-4">
                <nav class="-mb-px flex space-x-6 overflow-x-auto scroll-container px-4" aria-label="Tabs">
                    {#each details.temporadas as temporada, index}
                        <button on:click={() => activeSeasonIndex = index}
                            class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeSeasonIndex === index ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-subtle'}">
                            { (temporada.nome || temporada.name || `Temporada ${temporada.seasonNumber || index+1}`).replace('-', ' ') }
                        </button>
                    {/each}
                </nav>
            </div>

            <div class="space-y-3 pb-32">
                {#each details.temporadas[activeSeasonIndex].episodios as episode (episode.path || episode.arquivo)}
                    {@const episodeKey = episode.path || episode.arquivo || episode.file}
                    {@const progress = $watchHistory.get(episodeKey)}
                    <div class="flex items-center space-x-4 p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors group">
                        <a
                            href={`/player?play=${encodeURIComponent(episode.path || episode.arquivo || episode.file)}&showCode=${encodeURIComponent(details.code)}`}
                            class="flex flex-1 items-center space-x-4 cursor-pointer overflow-hidden"
                            on:mousedown={() => handlePressStart(episode)} on:touchstart={() => handlePressStart(episode)}
                            on:mouseup={handlePressEnd} on:mouseleave={handlePressEnd} on:touchend={handlePressEnd}
                            on:click|capture={handleClick}
                        >
                            <img
                                src={ episode.thumbnail ? (episode.thumbnail.startsWith('http') ? episode.thumbnail : `${serverUrl}/midia/${episode.thumbnail}`) : `https://placehold.co/160x90/1a2923/ffffff?text=${encodeURIComponent((episode.arquivo || episode.file || '').replace('.mp4', ''))}` }
                                alt="Thumbnail do episódio"
                                class="h-16 w-28 flex-shrink-0 rounded-md bg-surface object-cover"
                                loading="lazy"
                            />
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-text-main overflow-hidden whitespace-nowrap text-ellipsis">
                                    { episode.titulo || episode.title || formatEpisodeNameFromAny(episode) }
                                </h4>
                                <p class="mt-1 text-sm text-text-secondary text-wrap">
                                    { (episode.sinopse || episode.synopsis || episode.overview) ? truncate(episode.sinopse || episode.synopsis || episode.overview, 100) : 'Sem sinopse.' }
                                    {#if (episode.sinopse || episode.synopsis || episode.overview) && ( (episode.sinopse || episode.synopsis || episode.overview).length > 100 )}
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
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if isModalOpen && selectedEpisode}
        <EpisodeDetailsModal episode={selectedEpisode} showCode={details.code} serverUrl={serverUrl} on:close={closeModal} handleDownload={handleDownload} />
    {/if}
</div>
