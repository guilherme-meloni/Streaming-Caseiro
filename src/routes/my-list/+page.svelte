<script lang="ts">
    import { Trash2, Play } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';
    import { serverUrl } from '$lib/stores/settings';
    import { favorites, removeFromFavorites, fetchFavorites } from '$lib/stores/favorites';
    import type { FavoriteItem } from '$lib/stores/favorites';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // New function to play favorite item
    function playFavorite(item: FavoriteItem) {
        const currentServer = get(serverUrl);
        if (currentServer && item.code) {
            goto(`/catalogo/${item.code}`); // Navigate to DetailsPage
        } else {
            alert('Não foi possível reproduzir. Servidor ou código do item ausente.');
        }
    }

    // Lifecycle
    onMount(() => {
        if (browser) {
            fetchFavorites(); // Fetch favorites on mount
        }
    });
</script>

<div class="w-full max-w-4xl p-4 py-10 md:mx-auto">
    <h1 class="font-display text-4xl font-bold text-white">Meus Favoritos</h1>
    <p class="mt-1 text-subtle">Seus filmes e séries favoritos para acesso rápido.</p>

    <div class="mt-10">
    <h2 class="font-display text-2xl font-bold text-white">Sua Lista de Favoritos</h2>
    {#if $favorites.length > 0}
        <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {#each $favorites as item (item.code)}
                <div class="bg-surface rounded-lg shadow-md overflow-hidden relative">
                    <img
                        src={item.poster ? `${get(serverUrl)}/midia/${item.code}/${item.poster}` : `https://placehold.co/200x300/1a2923/ffffff?text=${encodeURIComponent(item.name)}`}
                        alt={item.name}
                        class="w-full h-auto object-cover"
                        on:error={(e) => {
                            console.error('[IMG] Erro ao carregar:', item.name);
                            e.currentTarget.src = `https://placehold.co/200x300/1a2923/ffffff?text=${encodeURIComponent(item.name)}`;
                        }}
                    />
                    <div class="p-3">
                        <h3 class="font-semibold text-text-main text-sm truncate">{item.name}</h3>
                        <div class="mt-2 flex items-center justify-between">
                            <button
                                on:click={() => playFavorite(item)}
                                class="flex items-center text-primary hover:text-primary/80 text-xs font-medium"
                            >
                                <Play class="h-4 w-4 mr-1" /> Assistir
                            </button>
                        </div>
                        <button
                            on:click={() => removeFromFavorites(item.code)}
                            class="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                            aria-label="Remover da lista"
                        >
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="mt-4 text-subtle">Sua lista de favoritos está vazia. Adicione itens do Hub!</p>
    {/if}
    </div>
</div>
