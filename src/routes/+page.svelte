<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/hub', { replaceState: true });
    });
</script>

<div class="flex h-screen w-screen items-center justify-center bg-gray-900">
    <p class="text-white">Redirecionando para o catálogo...</p>
</div>
