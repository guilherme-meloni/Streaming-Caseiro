<script lang="ts">
    import { goto } from '$app/navigation';
    import { serverUrl } from '$lib/stores/settings';
    import { auth } from '$lib/stores/auth';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let username = '';
    let password = '';
    let error = '';
    let isLoading = false;
    let currentServerUrl = '';
    let unsubscribeStore: () => void;

    onMount(() => {
        if (!browser) return;
        unsubscribeStore = serverUrl.subscribe((value) => (currentServerUrl = value));
    });

    async function handleLogin() {
        isLoading = true;
        error = '';
        try {
            console.log('[LOGIN] Enviando requisição para:', `${currentServerUrl}/api/login`);
            
            const response = await fetch(`${currentServerUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            console.log('[LOGIN] Resposta recebida:', data);
            
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido');

            if (!data.sessionToken) {
                throw new Error('Token de sessão não recebido do servidor');
            }

            console.log('[LOGIN] Token recebido:', data.sessionToken.substring(0, 20) + '...');
            auth.login({ id: data.user.id, username: data.user.username }, data.sessionToken);
            console.log('[LOGIN] Login bem-sucedido, redirecionando...');
            goto('/hub');
        } catch (e: any) {
            console.error('[LOGIN] Erro:', e);
            error = e.message;
        } finally {
            isLoading = false;
        }
    }
</script>

<main class="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
    <div class="w-full max-w-sm text-center">
        <div class="mb-6 text-6xl">📼</div>
        <h1 class="font-display mb-2 text-3xl font-bold text-white">Canal Nostalgia</h1>
        <p class="mb-8 text-subtle">Sua central de desenhos 24h.</p>

        <form on:submit|preventDefault={handleLogin} class="flex flex-col gap-4">
            <input
                bind:value={username}
                type="text"
                placeholder="Nome de usuário"
                required
                class="rounded-lg border-2 border-transparent bg-surface px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
            />
            <input
                bind:value={password}
                type="password"
                placeholder="Senha"
                required
                class="rounded-lg border-2 border-transparent bg-surface px-4 py-3 text-center text-lg text-white transition-colors focus:border-primary focus:outline-none"
            />

            {#if error}
                <p class="text-sm text-red-400">{error}</p>
            {/if}

            <button
                type="submit"
                disabled={isLoading}
                class="mt-2 rounded-lg bg-primary py-3 font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>

        <p class="mt-6 text-sm text-subtle">
            Não tem uma conta? <a href="/registro" class="font-semibold text-primary hover:underline">Registre-se</a>
        </p>
    </div>
</main>