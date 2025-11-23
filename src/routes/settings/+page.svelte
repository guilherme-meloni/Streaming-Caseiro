<!-- ESTA ALTERAÇÃO É VISUAL -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { serverUrl } from '$lib/stores/settings';
	import { browser } from '$app/environment';
	import { profile, updateProfilePicture } from '$lib/stores/profile'; // Import profile store and update function
	import { UserCircle } from 'lucide-svelte'; // Import UserCircle for placeholder

	// --- ESTADO LOCAL ---
	let cpuLoad = 0;
	let memUsed = 0;
	let memTotal = 1;
	let cpuTemp: number | null = null;
	let connectionStatus = 'Aguardando conexão...';
	let isRescanning = false;
	let rescanStatusMessage = '';

	let socket: WebSocket;
	let unsubscribeStore: () => void;

	// --- PROFILE PICTURE STATE ---
	let selectedFile: File | null = null;
	let isUploading = false;
	let uploadMessage = '';

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
			uploadMessage = `Arquivo selecionado: ${selectedFile.name}`;
		} else {
			selectedFile = null;
			uploadMessage = '';
		}
	}

	async function handleUpload() {
		if (!selectedFile) {
			uploadMessage = 'Por favor, selecione uma imagem primeiro.';
			return;
		}
		isUploading = true;
		uploadMessage = 'Enviando...';
		const success = await updateProfilePicture(selectedFile);
		if (success) {
			uploadMessage = 'Foto de perfil atualizada com sucesso!';
			selectedFile = null; // Clear selected file after successful upload
		} else {
			uploadMessage = 'Falha ao atualizar foto de perfil.';
		}
		isUploading = false;
	}

	// --- LÓGICA DOS MEDIDORES ---
	const radius = 45;
	const circumference = 2 * Math.PI * radius;
	$: cpuOffset = circumference - (Math.min(100, cpuLoad) / 100) * circumference;
	$: ramPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
	$: ramOffset = circumference - (Math.min(100, ramPercentage) / 100) * circumference;
	$: tempOffset = circumference - (Math.min(100, cpuTemp ?? 0) / 100) * circumference;

	// --- AÇÕES ---
	function handleRescanCatalog() {
		if (socket && socket.readyState === WebSocket.OPEN) {
			isRescanning = true;
			rescanStatusMessage = 'Enviando comando de atualização...';
			socket.send(JSON.stringify({ type: 'COMMAND', command: 'RESCAN_CATALOG' }));
		} else {
			rescanStatusMessage = 'Erro: Conexão WebSocket não está aberta.';
		}
	}

	// --- CICLO DE VIDA ---
	onMount(() => {
		if (!browser) return;

		unsubscribeStore = serverUrl.subscribe((url) => {
			if (socket) socket.close();
			if (url) {
				const domain = url.replace(/^https?:?\/\//, '');
				const WS_URL = `ws://${domain}`;
				socket = new WebSocket(WS_URL);

				socket.onopen = () => (connectionStatus = 'Conectado');
				socket.onerror = () => (connectionStatus = 'Erro de conexão');
				socket.onclose = () => (connectionStatus = 'Desconectado');
				socket.onmessage = (event) => {
					const message = JSON.parse(event.data);
					if (message.type === 'STATS_UPDATE') {
						const { payload } = message;
						cpuLoad = parseFloat(payload.cpuLoad) || 0;
						memUsed = parseInt(payload.memUsed, 10) || 0;
						memTotal = parseInt(payload.memTotal, 10) || 1;
						cpuTemp = payload.cpuTemp;
					} else if (message.type === 'SYSTEM_MESSAGE') {
						rescanStatusMessage = message.payload.message;
						if (message.payload.message.includes('completa') || message.payload.message.includes('Erro')) {
							isRescanning = false;
						}
					}
				};
			}
		});

		return () => {
			if (unsubscribeStore) unsubscribeStore();
			if (socket) socket.close();
		};
	});
</script>

<!-- ESTA ALTERAÇÃO É VISUAL: Estilos para os medidores SVG -->
<style>
	.gauge-circle {
		fill: none;
		stroke-width: 8;
		stroke: #0f1724;
	}
	.gauge-arc {
		fill: none;
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.5s ease-out;
	}
</style>

<!-- ESTA ALTERAÇÃO É VISUAL: Layout principal da página de configurações -->
<div class="p-4 pt-8 md:p-8">
	<div class="mx-auto max-w-4xl">
		<h1 class="text-3xl font-bold md:text-4xl">Configurações</h1>
		<p class="mt-1 text-muted">Status e informações do servidor.</p>

		<!-- PROFILE PICTURE SECTION -->
		<div class="mt-8 rounded-2xl bg-surface p-6 shadow-lg">
			<h2 class="text-xl font-semibold mb-4">Foto de Perfil</h2>
			<div class="flex items-center gap-4">
				{#if $profile.profilePictureUrl}
					<img src={$profile.profilePictureUrl} alt="Foto de Perfil" class="h-24 w-24 rounded-full object-cover border-2 border-accent-blue" style="object-fit: cover; border-radius: 50%;" />
				{:else}
					<UserCircle class="h-24 w-24 text-muted" />
				{/if}
				<div>
					<input type="file" accept="image/*" on:change={handleFileChange} class="block w-full text-sm text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/90" />
					<button on:click={handleUpload} disabled={!selectedFile || isUploading} class="mt-4 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
						{#if isUploading} Enviando... {:else} Salvar Foto {/if}
					</button>
					{#if uploadMessage}
						<p class="mt-2 text-sm text-muted">{uploadMessage}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- ESTA ALTERAÇÃO É VISUAL: Card de Status do Servidor -->
		<div class="mt-8 rounded-2xl bg-surface p-6 shadow-lg">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">Status do Servidor</h2>
				<div class="flex items-center gap-2 text-sm text-muted">
					<div class="h-2 w-2 rounded-full {connectionStatus === 'Conectado' ? 'bg-green-500' : 'bg-red-500'}"></div>
					{connectionStatus}
				</div>
			</div>
			{#if connectionStatus !== 'Conectado'}
				<div class="mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
					Servidor desconectado. Por favor, contate o suporte.
				</div>
			{/if}

			<div class="mt-6 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
				<!-- Medidor de CPU -->
				<div class="flex flex-col items-center justify-center rounded-xl bg-background/50 p-6">
					<h3 class="mb-4 text-lg font-semibold">Uso de CPU</h3>
					<div class="relative h-32 w-32">
						<svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
							<circle class="gauge-circle" cx="50" cy="50" r={radius}></circle>
							<circle class="gauge-arc" cx="50" cy="50" r={radius} stroke="#1E90FF" stroke-dasharray={circumference} stroke-dashoffset={cpuOffset}></circle>
						</svg>
						<span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">{cpuLoad.toFixed(0)}%</span>
					</div>
				</div>
				<!-- Medidor de RAM -->
				<div class="flex flex-col items-center justify-center rounded-xl bg-background/50 p-6">
					<h3 class="mb-4 text-lg font-semibold">Uso de RAM</h3>
					<div class="relative h-32 w-32">
						<svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
							<circle class="gauge-circle" cx="50" cy="50" r={radius}></circle>
							<circle class="gauge-arc" cx="50" cy="50" r={radius} stroke="#6B21A8" stroke-dasharray={circumference} stroke-dashoffset={ramOffset}></circle>
						</svg>
						<span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">{ramPercentage.toFixed(0)}%</span>
					</div>
					<span class="mt-2 text-xs text-muted">{memUsed} MB / {memTotal} MB</span>
				</div>
				<!-- Medidor de Temperatura -->
				{#if cpuTemp !== null}
				<div class="flex flex-col items-center justify-center rounded-xl bg-background/50 p-6">
					<h3 class="mb-4 text-lg font-semibold">Temperatura</h3>
					<div class="relative h-32 w-32">
						<svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
							<circle class="gauge-circle" cx="50" cy="50" r={radius}></circle>
							<circle class="gauge-arc" cx="50" cy="50" r={radius} stroke="#f59e0b" stroke-dasharray={circumference} stroke-dashoffset={tempOffset}></circle>
						</svg>
						<span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">{(cpuTemp ?? 0).toFixed(0)}°C</span>
					</div>
				</div>
				{/if}
			</div>
		</div>

		<!-- ESTA ALTERAÇÃO É VISUAL: Card de Ações do Administrador -->
		<div class="mt-8 rounded-2xl bg-surface p-6 shadow-lg">
			<h2 class="text-xl font-semibold">Ações do Administrador</h2>
			<div class="mt-4 flex flex-col items-start gap-4">
				<button
					on:click={handleRescanCatalog}
					class="rounded-lg bg-accent-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={isRescanning}
				>
					{#if isRescanning} Atualizando... {:else} Atualizar Catálogo de Mídia {/if}
				</button>
				{#if rescanStatusMessage}
					<p class="text-sm text-muted">{rescanStatusMessage}</p>
				{/if}
			</div>
		</div>
	</div>
</div>
