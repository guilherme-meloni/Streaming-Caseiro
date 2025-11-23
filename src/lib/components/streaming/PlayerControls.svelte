<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { Play, Pause, Settings2, ListVideo, Expand, Minimize2, Volume, Volume1, Volume2, VolumeX } from 'lucide-svelte';

  export let isPlaying = false;
  export let currentTime = 0;
  export let duration = 0;
  export let volume = 0.7;
  export let isMuted = false;
  export let playbackRate = 1;
  export let isFillScreen = false;
  export let audioTracks: any[] = [];
  export let selectedAudioTrack: any = undefined;

  const dispatch = createEventDispatcher();
  function emit(name: string, detail?: any) {
    try { dispatch(name, detail); } catch (e) {}
  }

  let showSettings = false;
  let showQuality = false;
  let showAudio = false;
  let showSubtitles = false;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  let menuCoords = { top: 0, left: 0 };
  let settingsButtonRef: HTMLElement | null = null;

  function closeAllMenus() {
    showSettings = false;
    showQuality = false;
    showAudio = false;
    showSubtitles = false;
  }

  function chooseRate(r: number) { 
    playbackRate = r; 
    emit('setPlaybackRate', r); 
    closeAllMenus(); 
  }
  
  function chooseAudio(i: any) { 
    selectedAudioTrack = i; 
    emit('changeAudioTrack', i); 
    showAudio = false; 
  }

  function calculateMenuPosition(anchorEl: HTMLElement) {
    const rect = anchorEl.getBoundingClientRect();
    const menuHeight = 280;
    const menuWidth = 240;
    
    let top = rect.top - menuHeight - 10;
    if (top < 8) {
      top = Math.max(8, rect.bottom + 10);
    }
    if (top + menuHeight > window.innerHeight - 8) {
      top = window.innerHeight - menuHeight - 8;
    }
    
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    
    return { top, left };
  }

  function toggleSettings(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    settingsButtonRef = target;
    
    if (showSettings) {
      closeAllMenus();
    } else {
      const pos = calculateMenuPosition(target);
      menuCoords = pos;
      showSettings = true;
    }
  }

  function openSubMenu(menuType: 'audio' | 'subtitles') {
    if (menuType === 'audio') {
      showAudio = true;
      showSettings = false;
    } else if (menuType === 'subtitles') {
      showSubtitles = true;
      showSettings = false;
    }
  }

  function backToSettings() {
    showQuality = false;
    showAudio = false;
    showSubtitles = false;
    showSettings = true;
  }

  function enterMini() {
    emit('enterMini', true);
    closeAllMenus();
  }

  onMount(() => {
    const onKey = (ev: KeyboardEvent) => { 
      if (ev.key === 'Escape') closeAllMenus(); 
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  function handleBackdropClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('menu-backdrop')) {
      closeAllMenus();
    }
  }
</script>

<style>
  .bar{
    position:relative;
    display:flex;
    justify-content:space-between;
    align-items:center;
    z-index:100;
    padding:0 16px 8px;
    background:linear-gradient(to top,rgba(0,0,0,0.7)0%,rgba(0,0,0,0)100%);
    pointer-events:auto;
  }
  .controls-left,.controls-right{
    display:flex;
    align-items:center;
    gap:8px;
    pointer-events:auto;
  }
  .button-icon{
    background:transparent;
    border:none;
    color:white;
    padding:8px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition: background 0.2s ease;
  }
  .button-icon:hover{
    background:rgba(255,255,255,0.08);
  }
  .button-icon:active{
    background:rgba(255,255,255,0.15);
  }
  .progress-container{
    flex-grow:1;
    height:4px;
    background:rgba(255,255,255,0.12);
    border-radius:2px;
    position:relative;
    cursor:pointer;
    margin:0 10px;
    pointer-events:auto;
  }
  .progress-bar{
    height:100%;
    width:0%;
    background:var(--accent, #ff3b30);
    border-radius:2px;
    transition: width 0.1s ease;
  }
  .progress-handle{
    position:absolute;
    top:50%;
    transform:translate(-50%,-50%);
    width:12px;
    height:12px;
    background:var(--accent, #ff3b30);
    border-radius:50%;
    display:none;
  }
  .progress-container:hover .progress-handle{
    display:block;
  }
  .time-display{
    font-size:13px;
    color:white;
    white-space:nowrap;
    pointer-events:auto;
    min-width: 80px;
    text-align: center;
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: transparent;
  }

  .menu.fixed{
    position:fixed;
    z-index:250;
    min-width:240px;
    max-width:340px;
    max-height:60vh;
    overflow:auto;
    background:rgba(20,20,20,0.98);
    padding:14px;
    border-radius:14px;
    box-shadow:0 12px 40px rgba(0,0,0,0.9);
    border:1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(12px);
  }
  .menu h4{
    margin:0 0 12px 0;
    font-weight:700;
    font-size:15px;
    color:white;
    padding-bottom:10px;
    border-bottom:1px solid rgba(255,255,255,0.08);
  }
  .menu .row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px 0;
    color:white;
    font-size:14px;
  }
  .menu button.opt{
    display:block;
    width:100%;
    text-align:left;
    padding:11px 14px;
    border-radius:10px;
    background:transparent;
    border:none;
    color:white;
    font-size:14px;
    cursor:pointer;
    transition: background 0.2s ease;
  }
  .menu button.opt:hover{
    background:rgba(255,255,255,0.1);
  }
  .menu button.opt:active{
    background:rgba(255,255,255,0.15);
  }
  .menu button.opt[aria-pressed="true"]{
    background:rgba(255,255,255,0.16);
    font-weight:700;
  }
  input[type=range]{
    -webkit-appearance:none;
    width:100%;
    height:4px;
    background:transparent;
    outline:none;
    margin:0;
    padding:0;
  }
  input[type=range]::-webkit-slider-runnable-track{
    width:100%;
    height:4px;
    background:rgba(255,255,255,0.12);
    border-radius:2px;
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;
    height:12px;
    width:12px;
    border-radius:50%;
    background:var(--accent,#ff3b30);
    cursor:pointer;
    margin-top:-4px;
  }
  .volume-control{
    display:flex;
    align-items:center;
    gap:6px;
    width:110px;
  }
  .rates-list{
    display:block;
    padding:0;
    margin:0;
    list-style:none;
  }
  .rates-list button.opt{
    display:block;
    width:100%;
    text-align:left;
    padding:9px 12px;
    border-radius:8px;
    font-size:14px;
  }

  .menu::-webkit-scrollbar {
    width: 8px;
  }
  .menu::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.02);
    border-radius: 4px;
  }
  .menu::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 4px;
  }
  .menu::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.18);
  }
</style>

<div class="bar" role="group" aria-label="Player controls">
  <div class="controls-left">
    <button class="button-icon" on:click={() => emit('playPause')} aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}>
      {#if isPlaying}<Pause class="h-6 w-6"/>{:else}<Play class="h-6 w-6"/>{/if}
    </button>

    <div class="volume-control">
      <button class="button-icon" on:click={() => emit('toggleMute')} aria-label={isMuted ? 'Desmutar' : 'Mutar'}>
        {#if isMuted}
          <VolumeX class="h-5 w-5"/>
        {:else if volume > 0.5}
          <Volume2 class="h-5 w-5"/>
        {:else if volume > 0}
          <Volume1 class="h-5 w-5"/>
        {:else}
          <Volume class="h-5 w-5"/>
        {/if}
      </button>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.05" 
        value={volume} 
        on:input={(e) => emit('setVolume', parseFloat((e.target as HTMLInputElement).value))} 
        aria-label="Volume" 
      />
    </div>
  </div>

  <div 
    class="progress-container" 
    on:click={(e) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left;
      const percentage = x / rect.width;
      emit('seek', percentage * duration);
    }}
  >
    <div class="progress-bar" style="width: {duration ? (currentTime / duration * 100) : 0}%"></div>
    <div class="progress-handle" style="left: {duration ? (currentTime / duration * 100) : 0}%"></div>
  </div>

  <div class="time-display" aria-live="polite">
    {Math.floor(currentTime / 60).toString().padStart(2,'0')}:{Math.floor(currentTime % 60).toString().padStart(2,'0')} / {Math.floor(duration / 60).toString().padStart(2,'0')}:{Math.floor(duration % 60).toString().padStart(2,'0')}
  </div>

  <div class="controls-right">
    <button 
      class="button-icon" 
      on:click={() => emit('openEpisodes')} 
      aria-label="Abrir episódios"
      title="Lista de Episódios"
    >
      <ListVideo class="h-6 w-6"/>
    </button>

    <button 
      class="button-icon" 
      on:click={() => emit('requestFullscreen')} 
      aria-label="Tela Cheia"
      title="Tela Cheia (F)"
    >
      <Expand class="h-6 w-6"/>
    </button>

    <button 
      class="button-icon" 
      on:click={() => emit('toggleCinematic')} 
      aria-pressed={isFillScreen} 
      aria-label="Modo Cinematográfico"
      title="Preencher Tela"
    >
      <Minimize2 class="h-6 w-6"/>
    </button>

    <div style="position:relative">
      <button 
        class="button-icon" 
        on:click={toggleSettings} 
        aria-label="Configurações"
        aria-expanded={showSettings}
        title="Configurações"
      >
        <Settings2 class="h-6 w-6"/>
      </button>
    </div>
  </div>
</div>

{#if showSettings || showQuality || showAudio || showSubtitles}
  <div 
    class="menu-backdrop" 
    on:click={handleBackdropClick}
    on:touchstart={handleBackdropClick}
  ></div>
{/if}

{#if showSettings}
  <div 
    class="menu fixed" 
    role="menu" 
    on:click|stopPropagation 
    on:touchstart|stopPropagation
    on:touchmove|stopPropagation
    style="top: {menuCoords.top}px; left: {menuCoords.left}px;"
  >
    <h4>Velocidade</h4>

    <ul class="rates-list" style="margin-bottom:10px;">
      {#each rates as r}
        <li>
          <button 
            class="opt" 
            on:click={() => chooseRate(r)} 
            aria-pressed={playbackRate === r}
          >
            {r}x {#if playbackRate === r} ✓{/if}
          </button>
        </li>
      {/each}
    </ul>

    <div class="row">
      <div>Áudio</div>
      <div>
        <button 
          class="opt" 
          on:click={() => openSubMenu('audio')}
          style="padding: 5px 10px;"
        >
          Abrir →
        </button>
      </div>
    </div>

    <div style="margin-top:10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
      <button 
        class="opt" 
        on:click={enterMini}
        style="text-align: center; font-weight: 600;"
      >
        📺 Mini Player / PiP
      </button>
    </div>
  </div>
{/if}

{#if showAudio}
  <div 
    class="menu fixed" 
    role="menu" 
    on:click|stopPropagation 
    on:touchstart|stopPropagation
    on:touchmove|stopPropagation
    style="top: {menuCoords.top}px; left: {menuCoords.left}px;"
  >
    <h4>Faixas de Áudio</h4>
    {#if audioTracks && audioTracks.length > 0}
      {#each audioTracks as t}
        <button 
          class="opt" 
          on:click={() => chooseAudio(t.index)} 
          aria-pressed={selectedAudioTrack === t.index}
        >
          {t.language || `Faixa ${t.index}`} {#if selectedAudioTrack === t.index} ✓{/if}
        </button>
      {/each}
    {:else}
      <div class="row" style="opacity: 0.7; font-size: 13px;">Somente faixa padrão disponível</div>
    {/if}
    <div style="margin-top:14px; padding-top:10px; border-top: 1px solid rgba(255,255,255,0.08);">
      <button class="opt" on:click={backToSettings}>← Voltar</button>
    </div>
  </div>
{/if}
