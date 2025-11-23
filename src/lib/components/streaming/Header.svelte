<!-- src/lib/components/streaming/Header.svelte -->
<script lang="ts">
    import { Search, UserCircle, Download } from 'lucide-svelte'; // Adicione Download
</script>

<header class="p-4 sm:p-6 flex justify-between items-center fixed top-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-transparent z-10" style="padding-top: var(--safe-top);">
    <h1 class="text-2xl sm:text-3xl font-bold text-primary">Catatau Filmes</h1>
    <div class="flex items-center space-x-4">
        <a href="/catalogo" aria-label="Buscar">
            <Search class="h-6 w-6 text-text-main hover:text-primary transition-colors" />
        </a>
        <a href="/downloads" aria-label="Meus Downloads"> 
            <Download class="h-6 w-6 text-text-main hover:text-primary transition-colors" />
        </a>
        <a href="/perfil" aria-label="Perfil do Usuário">
            <UserCircle class="h-8 w-8 text-subtle hover:text-text-main transition-colors" />
        </a>
    </div>
</header>