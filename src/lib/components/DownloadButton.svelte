<script lang="ts">
    import { Download, Check, AlertCircle } from 'lucide-svelte';
    import { downloadVideo } from '$lib/stores/downloadManager';
    import { downloads } from '$lib/stores/downloads';
    
    export let videoUrl: string;
    export let showName: string;
    export let episodeName: string;
    export let posterUrl: string | null = null;
    
    let isDownloading = false;
    let error: string | null = null;
    
    $: existingDownload = $downloads.find(d => 
        d.showName === showName && d.episodeName === episodeName
    );
    
    async function handleDownload() {
        isDownloading = true;
        error = null;
        
        try {
            await downloadVideo(videoUrl, showName, episodeName, posterUrl);
        } catch (e: any) {
            error = e.message;
        } finally {
            isDownloading = false;
        }
    }
</script>

{#if existingDownload}
    {#if existingDownload.status === 'completed'}
        <button class="btn-success" disabled>
            <Check class="h-5 w-5" />
            Baixado
        </button>
    {:else if existingDownload.status === 'downloading'}
        <button class="btn-primary" disabled>
            <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            {existingDownload.progress}%
        </button>
    {:else if existingDownload.status === 'error'}
        <button class="btn-error" on:click={handleDownload}>
            <AlertCircle class="h-5 w-5" />
            Erro - Tentar novamente
        </button>
    {/if}
{:else}
    <button class="btn-primary" on:click={handleDownload} disabled={isDownloading}>
        {#if isDownloading}
            <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        {:else}
            <Download class="h-5 w-5" />
        {/if}
        Download
    </button>
{/if}

{#if error}
    <p class="text-red-500 text-xs mt-1">{error}</p>
{/if}

<style>
    .btn-primary, .btn-success, .btn-error {
        @scripts/apply-ui-fixes.sh flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors;
    }
    .btn-primary {
        @scripts/apply-ui-fixes.sh bg-primary text-white hover:bg-primary/90;
    }
    .btn-success {
        @scripts/apply-ui-fixes.sh bg-green-500 text-white;
    }
    .btn-error {
        @scripts/apply-ui-fixes.sh bg-red-500 text-white hover:bg-red-600;
    }
</style>