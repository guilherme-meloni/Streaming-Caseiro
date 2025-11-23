<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { serverUrl } from '$lib/stores/settings';
    import { fade, fly } from 'svelte/transition';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { LoaderCircle, Search } from 'lucide-svelte'; // Import Search icon
    import type { CatalogoItem, ShowDetails } from '$lib/types';

    // Componentes da UI de Streaming
    import Header from '$lib/components/streaming/Header.svelte';
    import ContentCarousel from '$lib/components/streaming/ContentCarousel.svelte'; // Still useful for results
    import DetailsPage from '$lib/components/streaming/DetailsPage.svelte';

    // --- Estado da Página ---
    let isLoading = true;
    let connectionStatus = 'Buscando catálogo no servidor...';
    let catalogo: CatalogoItem[] = []; // Full catalog for searching
    let unsubscribeStore: () => void;
    let currentServerUrl = '';

    // --- Estado de Interação ---
    let searchTerm = ''; // Search input model
    let selectedItem: CatalogoItem | null = null;
    let selectedItemDetails: ShowDetails | null = null;
    let detailsLoading = false;

    // --- Lógica de Ciclo de Vida ---
    onMount(() => {
        if (!browser) return;
        unsubscribeStore = serverUrl.subscribe((url) => {
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
    });

    // --- Lógica de Dados ---
    async function fetchCatalogo(url: string) {
        isLoading = true;
        connectionStatus = `Conectando a ${url}...`;
        try {
            const response = await fetch(`${url}/api/catalogo`);
            if (!response.ok) throw new Error('Falha na comunicação com o servidor.');
            const data = await response.json();
            if (data.ok) {
                catalogo = data.catalogo.map(item => ({
                    ...item,
                    type: item.videoPath ? 'episode' : 'show', // Infer type based on videoPath presence
                    videoPath: item.videoPath || undefined, // Add videoPath if present
                    // Aplica a lógica de fallback para posterUrl
                    posterUrl: item.poster || item.posterUrl || `https://placehold.co/400x600/1a2923/8f9e98?text=${encodeURIComponent(item.nome)}`
                }));
            } else {
                throw new Error(data.error || 'Servidor retornou um erro.');
            }
        } catch (e: any) {
            connectionStatus = `Erro: ${e.message}`;
        } finally {
            isLoading = false;
        }
    }

    async function fetchDetails(item: CatalogoItem) {
        if (!currentServerUrl) return;
        detailsLoading = true;
        selectedItem = item; // Mostra a view de detalhes imediatamente
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
            console.error(e);
            // Se falhar, volta para a home
            selectedItem = null;
        } finally {
            detailsLoading = false;
        }
    }

    // --- Lógica de Filtro e Exibição ---
    $: filteredCatalogo = searchTerm.trim() === ''
        ? [] // No search term, no results displayed by default
        : catalogo.filter(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- Lógica de Navegação ---
    function handleSelect(event: CustomEvent<CatalogoItem>) {
        const item = event.detail;
        if (item.type === 'episode' && item.videoPath) {
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

<div class="bg-background min-h-screen text-text-main">
    {#if !selectedItem}
        <!-- VISÃO PRINCIPAL: BUSCA DE CATÁLOGO -->
        <div in:fade={{ duration: 300 }}>
            <Header />
            <main class="px-4 sm:px-8 pb-10 space-y-8">
                <div class="relative mt-20">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-subtle" />
                    <input
                        type="text"
                        placeholder="Buscar desenhos, filmes..."
                        class="w-full pl-10 pr-4 py-2 rounded-lg bg-surface border border-on-subtle focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                        bind:value={searchTerm}
                    />
                </div>

                {#if isLoading}
                    <div class="flex flex-col items-center justify-center h-48">
                        <LoaderCircle class="h-12 w-12 animate-spin text-primary" />
                        <p class="mt-4 font-semibold text-text-main">Carregando detalhes...</p>
                    </div>
                {:else if searchTerm.trim() !== '' && filteredCatalogo.length === 0}
                    <div class="text-center text-subtle mt-8">
                        <p>Nenhum resultado encontrado para "{searchTerm}".</p>
                    </div>
                {:else}
                    <div class="text-center text-subtle mt-8">
                        <p>Digite algo para começar a buscar.</p>
                    </div>
                {/if}
            </main>
        </div>
    {:else}
        <!-- VISÃO DE DETALHES -->
        {#if detailsLoading && !selectedItemDetails}
             <div class="flex h-screen flex-col items-center justify-center">
                <LoaderCircle class="h-12 w-12 animate-spin text-primary" />
                <p class="mt-4 font-semibold text-text-main">Carregando detalhes...</p>
            </div>
        {:else if selectedItemDetails}
            <DetailsPage
                details={selectedItemDetails}
                serverUrl={currentServerUrl}
                on:back={handleBack}
            />
        {/if}
    {/if}
</div>