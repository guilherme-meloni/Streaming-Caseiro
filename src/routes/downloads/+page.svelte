<script lang="ts">
    import { onMount } from 'svelte';
    import { downloads, removeDownload } from '$lib/stores/downloads';
    import { Play, Trash2, Download } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    
    function openVideo(localPath: string) {
        goto(`/player?playOffline=${encodeURIComponent(localPath)}`);
    }
    
    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
</script>

<div class="w-full max-w-4xl p-4 py-10 md:mx-auto">
    <h1 class="font-display text-4xl font-bold text-white">Meus Downloads</h1>
    <p class="mt-1 text-subtle">Assista offline quando quiser.</p>
    
    {#if $downloads.length === 0}
        <div class="mt-12 text-center">
            <Download class="h-24 w-24 mx-auto text-subtle mb-4" />
            <p class="text-subtle">Nenhum download ainda</p>
            <p class="text-sm text-subtle mt-2">Baixe episódios para assistir offline</p>
        </div>
    {:else}
        <div class="mt-6 space-y-4">
            {#each $downloads as download (download.id)}
                <div class="bg-surface rounded-lg p-4 flex items-center gap-4">
                    <img
                        src={download.posterUrl || 'https://placehold.co/80x120/1a2923/ffffff?text=?'}
                        alt={download.showName}
                        class="w-16 h-24 rounded object-cover flex-shrink-0"
                    />
                    
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-white truncate">{download.showName}</h3>
                        <p class="text-sm text-subtle truncate">{download.episodeName}</p>
                        
                        {#if download.status === 'downloading'}
                            <div class="mt-2">
                                <div class="flex justify-between text-xs text-subtle mb-1">
                                    <span>Baixando...</span>
                                    <span>{download.progress}%</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        class="bg-primary h-2 rounded-full transition-all"
                                        style="width: {download.progress}%"
                                    ></div>
                                </div>
                            </div>
                        {:else if download.status === 'completed'}
                            <p class="text-xs text-green-400 mt-1">✓ Download completo</p>
                        {:else if download.status === 'error'}
                            <p class="text-xs text-red-400 mt-1">✗ Erro no download</p>
                        {/if}
                    </div>
                    
                    <div class="flex gap-2">
                        {#if download.status === 'completed' && download.localPath}
                            <button
                                on:click={() => openVideo(download.localPath!)}
                                class="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                                aria-label="Assistir"
                            >
                                <Play class="h-5 w-5" />
                            </button>
                        {/if}
                        
                        <button
                            on:click={() => removeDownload(download.id)}
                            class="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            aria-label="Remover"
                        >
                            <Trash2 class="h-5 w-5" />
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>