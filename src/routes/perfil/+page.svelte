<script lang="ts">
    import { auth } from '$lib/stores/auth';
	import { LogOut, User, Settings } from 'lucide-svelte';

	function handleLogout() {
		auth.logout();
		window.location.href = '/login';
	}
</script>

<main class="p-4 md:p-8">
    <div class="mx-auto max-w-xl">
        <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                <User class="h-8 w-8 text-primary" />
            </div>
            <div>
                <p class="text-subtle">Bem-vindo de volta,</p>
                <h1 class="font-display text-3xl font-bold">{$auth.user?.username || 'Usuário'}</h1>
            </div>
        </div>

        <div class="mt-8 space-y-4">
            <a href="/settings" class="flex w-full items-center gap-4 rounded-lg bg-surface p-4 transition-colors hover:bg-surface/50">
                <Settings class="h-6 w-6 text-subtle" />
                <span class="font-semibold">Configurações do App e Servidor</span>
            </a>

            <button on:click={handleLogout} class="flex w-full items-center gap-4 rounded-lg bg-surface p-4 transition-colors hover:bg-red-900/50">
                <LogOut class="h-6 w-6 text-subtle" />
                <span class="font-semibold">Sair</span>
            </button>
        </div>
    </div>
</main>
