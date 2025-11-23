<script lang="ts">
	// ESTA ALTERAÇÃO É VISUAL
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { Home, Download, UserCircle, LogOut, Tv, List } from 'lucide-svelte';
	import { uiHealth, checkBackendStatus } from '$lib/ui/health-check'; // ESTA ALTERAÇÃO É VISUAL
	import OfflineBanner from '$lib/ui/fallback/OfflineBanner.svelte'; // ESTA ALTERAÇÃO É VISUAL
	import OfflineSkeletonHub from '$lib/ui/fallback/OfflineSkeletonHub.svelte'; // ESTA ALTERAÇÃO É VISUAL
	import FallbackPlayer from '$lib/ui/fallback/FallbackPlayer.svelte'; // ESTA ALTERAÇÃO É VISUAL
	import { profile } from '$lib/stores/profile'; // Re-enable profile store import

	// ESTA ALTERAÇÃO É VISUAL: Definição dos links de navegação com ícones.
	const navLinks = [
		{ href: '/hub', label: 'Início', icon: Home },
		{ href: '/canal-24h', label: 'Ao Vivo', icon: Tv },
		{ href: '/my-list', label: 'Meus Favoritos', icon: List }, // Re-enable and update label
		{ href: '/downloads', label: 'Downloads', icon: Download },
		{ href: '/perfil', label: 'Perfil', icon: UserCircle } // UserCircle is still the default icon
	];

	// ESTA ALTERAÇÃO É VISUAL: Rotas que não devem exibir a barra de navegação principal.
	const noNavRoutes = ['/login', '/registro', '/player'];
	$: showNav = $page.route.id && !noNavRoutes.some(route => $page.route.id?.startsWith(route));

	function handleLogout() {
		auth.logout();
		window.location.href = '/login';
	}

	// ESTA ALTERAÇÃO É VISUAL: Executa a checagem de saúde ao montar o componente.
	onMount(() => {
		checkBackendStatus();
	});

	// ESTA ALTERAÇÃO É VISUAL: Determina se a página atual é a do player.
	$: isPlayerPage = $page.route.id?.startsWith('/player');
</script>

<!-- ESTA ALTERAÇÃO É VISUAL -->
<svelte:head>
	<title>Canal Local</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- ESTA ALTERAÇÃO É VISUAL: Layout principal com novas cores e fontes. -->
<div class="flex h-screen w-screen bg-background font-sans text-text-main">
	<!-- ESTA ALTERAÇÃO É VISUAL: Renderiza o banner offline se o backend estiver instável. -->
	{#if $uiHealth === 'offline'}
		<OfflineBanner />
	{/if}

	<!-- ESTA ALTERAÇÃO É VISUAL: Navegação lateral para desktop. -->
	{#if showNav}
		<nav
			class="hidden h-full w-20 flex-col items-center gap-4 border-r border-surface bg-background p-4 shadow-lg md:flex"
		>
			<a href="/hub" class="mb-4 h-10 w-10 rounded-full bg-brand-purple">
				<!-- Logo Placeholder -->
			</a>
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-colors {
						$page.url.pathname.startsWith(link.href)
							? 'bg-surface text-accent-blue'
							: 'text-muted hover:text-text-main'
					}"
					aria-label={link.label}
				>
					{#if link.href === '/perfil' && $profile.profilePictureUrl}
						<img src={$profile.profilePictureUrl} alt="Perfil" class="h-7 w-7 rounded-full object-cover" style="object-fit: cover; border-radius: 50%;" />
					{:else}
						<svelte:component this={link.icon} class="h-7 w-7" />
					{/if}
				</a>
			{/each}
			<div class="mt-auto">
				<button
					on:click={handleLogout}
					class="flex flex-col items-center justify-center gap-1 rounded-lg p-3 text-muted transition-colors hover:text-text-main"
					aria-label="Sair"
				>
					<LogOut class="h-7 w-7" />
				</button>
			</div>
		</nav>
	{/if}

	<main class="flex-1 overflow-y-auto overflow-x-hidden">
		<!-- ESTA ALTERAÇÃO É VISUAL: Renderiza o fallback apropriado ou o conteúdo normal. -->
		{#if $uiHealth === 'offline'}
			{#if isPlayerPage}
				<FallbackPlayer />
			{:else}
				<OfflineSkeletonHub />
			{/if}
		{:else}
			<slot />
		{/if}
	</main>

	<!-- ESTA ALTERAÇÃO É VISUAL: Navegação inferior para mobile. -->
	{#if showNav}
		<nav
			class="fixed bottom-0 left-0 right-0 z-50 border-t border-surface bg-background/80 backdrop-blur-lg md:hidden"
		>
			<div class="grid h-full grid-cols-5">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						class="flex flex-col items-center justify-center gap-1 p-2 transition-colors {
							$page.url.pathname.startsWith(link.href)
								? 'text-accent-blue'
								: 'text-muted hover:text-text-main'
						}"
					>
						{#if link.href === '/perfil' && $profile.profilePictureUrl}
							<img src={$profile.profilePictureUrl} alt="Perfil" class="h-6 w-6 rounded-full object-cover" style="object-fit: cover; border-radius: 50%;" />
						{:else}
							<svelte:component this={link.icon} class="h-6 w-6" />
						{/if}
						<span class="text-[10px] font-medium">{link.label}</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</div>
