<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tick } from 'svelte';
  import { browser } from '$app/environment';
  import { page as pageStore } from '$app/stores';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { serverUrl } from '$lib/stores/settings';
  import { userHasInteracted } from '$lib/stores/playerState';
  import type { PlaylistItem, ShowDetails, AudioTrack } from '$lib/types';
  import { getProgress, updateProgress, getMediaMetadata } from '$lib/api';

  import { createEventDispatcher } from 'svelte';
  import { PlayCircle, ArrowLeft } from 'lucide-svelte';

  import PlayerControls from '$lib/components/streaming/PlayerControls.svelte';
  import PauseOverlay from '$lib/components/streaming/PauseOverlay.svelte';
  import NextEpisodesPanel from '$lib/components/streaming/NextEpisodesPanel.svelte';

  const dispatch = createEventDispatcher();

  // --- ESTADO DO PLAYER ---
  let videoPlayer: HTMLVideoElement;
  let backgroundVideoPlayer: HTMLVideoElement;
  let playerContainer: HTMLDivElement;
  let currentItem: PlaylistItem | null = null;
  let playlist: PlaylistItem[] = [];
  let currentItemIndex = -1;
  let audioTracks: AudioTrack[] = [];
  let selectedAudioTrack: number | undefined = undefined;

  // --- ESTADO DA UI ---
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 0.7;
  let isMuted = false;
  let isFullscreen = false;
  let playbackRate = 1;
  let isFillScreen = false;
  let isLoading = true;
  let showControls = true;
  let showNextEpisodes = false;
  let controlsHideTimer: ReturnType<typeof setTimeout>;

  // --- Overlay de Fim de Vídeo ---
  let showEndOverlay = false;
  let endCountdown = 10;
  let endCountdownTimer: ReturnType<typeof setInterval> | null = null;

  // --- Mini-Player ---
  let inAppMini = false;
  let miniPosition = { x: 12, y: 12 };

  // --- Feedback Visual ---
  let skipFlash: { dir: 'back' | 'forward'; visible: boolean } = { dir: 'forward', visible: false };
  let skipFlashTimer: ReturnType<typeof setTimeout>;

  // --- Controles por Gestos ---
  let lastTapLeft = 0;
  let lastTapRight = 0;
  const DOUBLE_TAP_MS = 300;

  // --- CONEXÃO (CANAL 24h) ---
  let isVodMode = false;
  let socket: WebSocket | null = null;
  let connectionStatus = 'Aguardando configuração...';
  let reconnectAttempts = 0;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Progresso VOD ---
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let currentMediaId: string | null = null;

  $: page = $pageStore;

  // 🔥 MANTÉM A ATUALIZAÇÃO REATIVA DE currentItem (para UI)
  $: if (isVodMode && currentItemIndex !== -1 && playlist[currentItemIndex]) {
    currentItem = playlist[currentItemIndex];
    currentMediaId = currentItem.meta?.path || null;
  }

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const formatEpisodeName = (filename: string): string => {
    const match = filename?.match(/E(\d+)/i);
    return match ? `Episódio ${parseInt(match[1], 10)}` : (filename?.replace?.('.mp4', '') ?? 'Episódio');
  };

  function toWsUrl(baseHttpUrl: string, wsPath: string): string {
    const base = new URL(baseHttpUrl);
    const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    const cleanPath = wsPath.startsWith('/') ? wsPath : `/${wsPath}`;
    return `${protocol}//${base.host}${cleanPath}`;
  }

  function resolveWsUrl(baseHttpUrl: string): string {
    const abs = (import.meta as any).env?.VITE_WS_ABSOLUTE as string | undefined;
    if (abs) return abs;
    const path = ((import.meta as any).env?.VITE_WS_PATH as string) || '/ws/emissora';
    return toWsUrl(baseHttpUrl, path);
  }

  onMount(async () => {
    if (!browser) return;

    const fsHandler = () => (isFullscreen = !!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsHandler);

    const vodPathParam = page.url.searchParams.get('play');
    const showCode = page.url.searchParams.get('showCode');
    const currentServer = get(serverUrl);

    if (!currentServer && !vodPathParam) {
      goto('/login');
      return;
    }

    userHasInteracted.set(true);

    try { await lockLandscape(); } catch(e) {}

    setTimeout(() => {
      if (playerContainer && playerContainer.requestFullscreen) {
        playerContainer.requestFullscreen().catch(e => console.warn("Falha ao entrar em tela cheia automaticamente:", e));
      }
    }, 500);

    if (vodPathParam) {
      isVodMode = true;
      isLoading = true;
      try {
        await loadVodPlaylist(currentServer!, vodPathParam, showCode);
        playCurrentVodItem();
        isLoading = false;
      } catch (e) {
        console.error('[VOD] Falha ao montar playlist:', e);
        const finalVodPath = `${currentServer}/midia/${vodPathParam}`;
        playlist = [{
          src: finalVodPath,
          nome: 'Episódio',
          tipo: 'desenho',
          duration: 0,
          meta: { path: vodPathParam }
        }];
        currentItemIndex = 0;
        currentItem = playlist[currentItemIndex];
        currentMediaId = vodPathParam;
        playCurrentVodItem();
        isLoading = false;
      }
    } else {
      isVodMode = false;
      connectToEmissora(currentServer!);
      isLoading = false;
    }

    const beforeUnload = () => {
      trySaveProgressNow();
      unlockOrientation();
    };
    window.addEventListener('beforeunload', beforeUnload);

    onDestroy(() => {
      if (socket) socket.close();
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      if (saveTimer) clearTimeout(saveTimer);
      if (endCountdownTimer) clearInterval(endCountdownTimer);
      document.removeEventListener('fullscreenchange', fsHandler);
      window.removeEventListener('beforeunload', beforeUnload);
      unlockOrientation();
    });
  });

  async function loadVodPlaylist(baseUrl: string, currentPath: string, showCode: string | null) {
    if (!showCode || showCode === 'undefined') {
      const finalVodPath = `${baseUrl}/midia/${currentPath}`;
      playlist = [{
        src: finalVodPath,
        nome: formatEpisodeName(currentPath),
        tipo: 'desenho',
        duration: 0,
        meta: { path: currentPath, poster: null, showName: null, descricao: null }
      }];
      currentItemIndex = 0;
      return;
    }

    const resp = await fetch(`${baseUrl}/api/catalogo/${showCode}`);
    if (!resp.ok) throw new Error(`Falha ao buscar detalhes para o show ${showCode}`);

    const data = await resp.json();
    if (!data.ok || !data.desenho) throw new Error(data.error || 'Resposta da API inválida.');

    const details: ShowDetails = data.desenho;
    const isMovie = !details.temporadas || details.temporadas.length === 0;

    if (isMovie) {
      const metaPath = details.path || (details.temporadas && details.temporadas[0]?.episodios?.[0]?.path) || currentPath;
      playlist = [{
        src: `${baseUrl}/midia/${metaPath}`,
        nome: details.nomeReal || 'Filme',
        tipo: 'desenho',
        duration: 0,
        meta: {
          path: metaPath,
          poster: details.poster || details.posterUrl || null,
          showName: details.nomeReal || details.name || null,
          descricao: details.descricao || details.overview || null
        }
      }];
    } else {
      const episodesFlat = details.temporadas.flatMap(t => (t.episodios || []).map(ep => ({
        ...ep,
        temporada: t.nome || t.name || `Temporada ${t.seasonNumber || ''}`
      })));

      playlist = episodesFlat.map(ep => ({
        src: `${baseUrl}/midia/${ep.path || ep.arquivo || ep.file}`,
        nome: ep.titulo || ep.title || formatEpisodeName(ep.arquivo || ep.file || ep.path),
        tipo: 'desenho',
        duration: 0,
        meta: {
          path: ep.path || ep.arquivo || ep.file,
          tituloEpisodio: ep.titulo || ep.title || null,
          temporada: ep.temporada || null,
          poster: ep.thumbnail || details.poster || details.posterUrl || null,
          showName: details.nomeReal || details.name || null,
          descricao: ep.sinopse || ep.synopsis || ep.overview || details.descricao || details.overview || null
        }
      }));
    }

    let idx = playlist.findIndex(p => p.meta?.path === currentPath);

    if (idx === -1) {
      const targetBase = (currentPath || '').split('/').pop();
      idx = playlist.findIndex(p => {
        const mp = p.meta?.path || '';
        return mp === currentPath || (mp && mp.split('/').pop() === targetBase);
      });
    }

    currentItemIndex = idx >= 0 ? idx : 0;

    if (!playlist[currentItemIndex]) {
      throw new Error("Não foi possível encontrar o item atual na playlist montada.");
    }
  }

  function scheduleSaveProgress() {
    if (!isVodMode || !currentMediaId) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await updateProgress(currentMediaId!, Math.floor(videoPlayer?.currentTime || 0), Math.floor(videoPlayer?.duration || duration || 0));
      } catch (e) {
        console.warn('[VOD] Falha ao salvar progresso:', e);
      }
    }, 5000);
  }

  async function trySaveProgressNow() {
    if (!isVodMode || !currentMediaId) return;
    try {
      await updateProgress(currentMediaId!, Math.floor(videoPlayer?.currentTime || 0), Math.floor(videoPlayer?.duration || duration || 0));
    } catch {}
  }

  function showControlsAndResetTimer() {
    showControls = true;
    clearTimeout(controlsHideTimer);
    controlsHideTimer = setTimeout(() => (showControls = false), 3000);
  }

  const onPlay = async () => {
    isPlaying = true;
    showControlsAndResetTimer();
    showEndOverlay = false;
    if (endCountdownTimer) { clearInterval(endCountdownTimer); endCountdownTimer = null; }
    if (backgroundVideoPlayer) {
      try { backgroundVideoPlayer.play(); } catch(e){}
    }
  };

  const onPause = () => {
    isPlaying = false;
    trySaveProgressNow();
    showControls = true;
    clearTimeout(controlsHideTimer);
    if (backgroundVideoPlayer) {
      try { backgroundVideoPlayer.pause(); } catch(e){}
    }
  };

  const onTimeUpdate = () => {
    currentTime = videoPlayer.currentTime;
    duration = Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : duration;
    scheduleSaveProgress();
    if (backgroundVideoPlayer) {
      try { backgroundVideoPlayer.currentTime = videoPlayer.currentTime; } catch(e){}
    }
  };

  const onVolumeChange = () => {
    volume = videoPlayer.volume;
    isMuted = videoPlayer.muted;
  };

  const onLoadedMetadata = async () => {
    duration = Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : duration;
    videoPlayer.volume = volume;
    videoPlayer.muted = isMuted;

    if (backgroundVideoPlayer) {
      try {
        backgroundVideoPlayer.src = videoPlayer.src;
        backgroundVideoPlayer.playbackRate = videoPlayer.playbackRate;
        backgroundVideoPlayer.load();
        await backgroundVideoPlayer.play().catch(()=>{});
      } catch(e){}
    }

    if (isVodMode && currentMediaId) {
      try {
        const savedPosition = await getProgress(currentMediaId);
        if (savedPosition > 5 && savedPosition < duration) {
          videoPlayer.currentTime = savedPosition;
        }
      } catch (e) {
        console.warn('[VOD] getProgress falhou:', e);
      }
    }

    if ('mediaSession' in navigator) {
      try {
        (navigator as any).mediaSession.metadata = new MediaMetadata({
          title: currentItem?.nome || 'Canal Local',
          artist: currentItem?.meta?.temporada || '',
          album: currentItem?.meta?.showName || '',
          artwork: [{ src: currentItem?.meta?.poster || '', sizes: '512x512', type: 'image/jpeg' }]
        });
        (navigator as any).mediaSession.setActionHandler('play', playPause);
        (navigator as any).mediaSession.setActionHandler('pause', playPause);
        (navigator as any).mediaSession.setActionHandler('seekbackward', () => nudge(-10));
        (navigator as any).mediaSession.setActionHandler('seekforward', () => nudge(10));
        if (playlist.length > 1) {
          (navigator as any).mediaSession.setActionHandler('previoustrack', () => performNextEpisode(currentItemIndex - 1));
          (navigator as any).mediaSession.setActionHandler('nexttrack', () => performNextEpisode(currentItemIndex + 1));
        }
      } catch(e){}
    }
  };

  const playPause = () => {
    if (!videoPlayer) return;
    videoPlayer.paused ? videoPlayer.play().catch(e => console.error("Erro ao tocar vídeo:", e)) : videoPlayer.pause();
  };
  const seek = (time: number) => {
    const d = Number.isFinite(duration) ? duration : (Number.isFinite(videoPlayer?.duration) ? videoPlayer.duration : 0);
    videoPlayer.currentTime = Math.max(0, Math.min(d || Infinity, time));
  };
  const nudge = (delta: number) => {
    seek((videoPlayer?.currentTime || 0) + delta);
    showSkipFlash(delta);
  };
  const setVolume = (vol: number) => (videoPlayer.volume = vol);
  const toggleMute = () => (videoPlayer.muted = !videoPlayer.muted);
  const setPlaybackRate = (rate: number) => {
    if (!videoPlayer) return;
    videoPlayer.playbackRate = rate;
    playbackRate = rate;
    if (backgroundVideoPlayer) {
      try { backgroundVideoPlayer.playbackRate = rate; } catch(e){}
    }
  };
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try { await lockLandscape(); } catch(e){}
      try {
        if (playerContainer?.requestFullscreen) await playerContainer.requestFullscreen();
      } catch(e){ console.warn('toggleFullscreen falhou', e); }
    } else {
      try { await unlockOrientation(); } catch(e){}
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch(e){}
    }
  };
  const goBack = () => history.back();

  async function changeAudioTrack(trackIndex: number) {
    if (!videoPlayer || !currentItem?.meta?.path) return;

    const wasPlaying = isPlaying;
    const savedTime = videoPlayer.currentTime;
    videoPlayer.pause();

    selectedAudioTrack = trackIndex;
    const originalSrc = currentItem.src.split('?')[0];
    const newSrc = `${originalSrc}?audioIndex=${trackIndex}`;

    videoPlayer.src = newSrc;
    try { videoPlayer.load(); } catch(e){}
    videoPlayer.currentTime = savedTime;
    if (wasPlaying) {
      videoPlayer.play().catch((e) => console.error('Erro ao retomar após troca de áudio:', e));
    }
  }

  // 🔥 CORRIGIDO: Agora usa playlist[currentItemIndex] diretamente
  function playCurrentVodItem() {
    if (!isVodMode || currentItemIndex === -1 || !playlist[currentItemIndex]) {
      console.warn('[playCurrentVodItem] Condições inválidas:', { isVodMode, currentItemIndex, hasItem: !!playlist[currentItemIndex] });
      return;
    }

    const item = playlist[currentItemIndex]; // 🔥 USAR DIRETAMENTE DA PLAYLIST
    const mediaId = item.meta?.path || null;

    console.log(`[playCurrentVodItem] Tocando índice ${currentItemIndex}:`, item.nome);

    selectedAudioTrack = undefined;
    audioTracks = [];

    if (mediaId) {
      currentMediaId = mediaId; // Atualizar aqui também
      getMediaMetadata(mediaId)
        .then(metadata => {
          if (metadata.audioTracks && metadata.audioTracks.length > 1) {
            audioTracks = metadata.audioTracks;
          }
        })
        .catch(e => console.warn('[Player] Falha ao buscar metadados de áudio:', e));
    }

    videoPlayer.src = item.src; // 🔥 USAR item.src DIRETAMENTE
    if (backgroundVideoPlayer) backgroundVideoPlayer.src = item.src;
    
    videoPlayer.play().catch(async () => {
      await sleep(300);
      videoPlayer.play().catch(e => console.error('Erro ao iniciar VOD:', e));
    });
  }

  function startHeartbeat() {
    stopHeartbeat();
    const tick = () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      }
      heartbeatTimer = setTimeout(tick, 15000);
    };
    heartbeatTimer = setTimeout(tick, 15000);
  }
  function stopHeartbeat() {
    if (heartbeatTimer) clearTimeout(heartbeatTimer);
  }

  function scheduleReconnect(baseUrl: string) {
    reconnectAttempts++;
    const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
    setTimeout(() => connectToEmissora(baseUrl), delay);
  }

  function connectToEmissora(baseUrl: string) {
    const wsUrl = resolveWsUrl(baseUrl);
    connectionStatus = 'Conectando à emissora...';

    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      connectionStatus = 'Falha ao criar conexão WebSocket.';
      scheduleReconnect(baseUrl);
      return;
    }

    socket.onopen = () => {
      connectionStatus = 'Conectado à emissora.';
      reconnectAttempts = 0;
      startHeartbeat();
      socket?.send(JSON.stringify({ type: 'hello', client: 'pwa', ts: Date.now() }));
      socket?.send(JSON.stringify({ type: 'COMMAND', command: 'SWITCH_CHANNEL', channel: 'main' }));
    };

    socket.onmessage = (ev) => {
      let data: any = null;
      try { data = JSON.parse(ev.data); } catch {}
      if (data) handleWsMessage(data);
    };

    socket.onerror = () => connectionStatus = 'Erro na conexão com a emissora.';
    socket.onclose = () => {
      connectionStatus = 'Desconectado. Tentando reconectar...';
      stopHeartbeat();
      scheduleReconnect(baseUrl);
    };
  }

  function handleWsMessage(msg: any) {
    switch (msg?.type) {
      case 'stream':
        if (typeof msg.url === 'string' && msg.url && videoPlayer.src !== msg.url) {
          videoPlayer.src = msg.url;
          if (backgroundVideoPlayer) backgroundVideoPlayer.src = msg.url;
          videoPlayer.play().catch(e => console.error('Erro ao iniciar stream:', e));
          isLoading = false;
        }
        break;
      case 'playlist':
        if (Array.isArray(msg.items)) playlist = msg.items;
        break;
      case 'nowPlaying':
        if (msg.meta) {
          currentItem = { src: videoPlayer.src, nome: msg.meta.titulo || 'Ao vivo', tipo: 'canal', duration: 0, meta: msg.meta };
        }
        break;
      case 'ping':
        socket?.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        break;
    }
  }

  $: proximosDesenhos = isVodMode ? playlist.slice(currentItemIndex + 1, currentItemIndex + 13) : [];
  $: hasNextEpisode = isVodMode && currentItemIndex < playlist.length - 1;

  function showSkipFlash(delta: number) {
    clearTimeout(skipFlashTimer);
    skipFlash.dir = delta >= 0 ? 'forward' : 'back';
    skipFlash.visible = true;
    skipFlashTimer = setTimeout(() => (skipFlash.visible = false), 350);
  }

  function handleLeftDblClick() { nudge(-5); }
  function handleRightDblClick() { nudge(+5); }
  function onTouchEndLeft() {
    const now = Date.now();
    if (now - lastTapLeft < DOUBLE_TAP_MS) { nudge(-5); lastTapLeft = 0; }
    else { lastTapLeft = now; }
  }
  function onTouchEndRight() {
    const now = Date.now();
    if (now - lastTapRight < DOUBLE_TAP_MS) { nudge(+5); lastTapRight = 0; }
    else { lastTapRight = now; }
  }

  import { onMount as __doubleTap_onMount } from 'svelte';
  __doubleTap_onMount(() => {
    try {
      let lastTapTime = 0;
      let lastTapX = 0;
      const EDGE_ZONE_RATIO = 0.25;

      function handleTapEvent(clientX, clientY) {
        const now = Date.now();
        const isDouble = (now - lastTapTime) <= DOUBLE_TAP_MS && Math.abs(clientX - lastTapX) < 140;
        lastTapTime = now;
        lastTapX = clientX;

        const rect = playerContainer?.getBoundingClientRect?.();
        const width = rect?.width || window.innerWidth;
        const leftZone = width * EDGE_ZONE_RATIO;
        const rightZone = width * (1 - EDGE_ZONE_RATIO);

        if (isDouble) {
          if (clientX <= leftZone) {
            nudge(-5);
          } else if (clientX >= rightZone) {
            nudge(5);
          } else {
            playPause();
          }
        } else {
          showControls = !showControls;
        }
      }

      function attachHandlers() {
        if (!playerContainer) return;
        playerContainer.addEventListener('touchend', (ev) => {
          if (!ev.changedTouches || ev.changedTouches.length === 0) return;
          handleTapEvent(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY);
        }, { passive: true });

        playerContainer.addEventListener('dblclick', (ev) => {
          handleTapEvent(ev.clientX, ev.clientY);
        });
      }

      setTimeout(attachHandlers, 800);
    } catch(e) {
      console.warn('Falha ao injetar lógica de double-tap:', e);
    }
  });

  function onEnded() {
    if (!hasNextEpisode) {
      showEndOverlay = true;
      endCountdown = 0;
      isPlaying = false;
      return;
    }
    showEndOverlay = true;
    endCountdown = 10;
    isPlaying = false;
    if (endCountdownTimer) clearInterval(endCountdownTimer);
    endCountdownTimer = setInterval(() => {
      endCountdown -= 1;
      if (endCountdown <= 0) {
        if (endCountdownTimer) clearInterval(endCountdownTimer);
        performNextEpisode();
      }
    }, 1000);
  }

  function cancelEndCountdown() {
    if (endCountdownTimer) clearInterval(endCountdownTimer);
    showEndOverlay = false;
    endCountdown = 0;
  }

  // 🔥 CORRIGIDO: Agora funciona corretamente
  function performNextEpisode(targetIndex?: number) {
    console.log('[performNextEpisode] Chamado com targetIndex:', targetIndex, 'currentItemIndex:', currentItemIndex);
    
    try { videoPlayer.pause(); } catch {}
    
    const nextIndex = targetIndex !== undefined ? targetIndex : currentItemIndex + 1;
    console.log('[performNextEpisode] Calculado nextIndex:', nextIndex);
    
    if (nextIndex >= 0 && nextIndex < playlist.length) {
      currentItemIndex = nextIndex; // Atualiza o índice
      selectedAudioTrack = undefined;
      audioTracks = [];
      
      console.log('[performNextEpisode] Chamando playCurrentVodItem() com índice:', currentItemIndex);
      playCurrentVodItem(); // Agora usa playlist[currentItemIndex] diretamente
    } else {
      console.warn('[performNextEpisode] Índice fora dos limites:', nextIndex, 'playlist.length:', playlist.length);
    }
    
    showEndOverlay = false;
    if (endCountdownTimer) clearInterval(endCountdownTimer);
  }

  async function lockLandscape() {
    try {
      if (screen?.orientation?.lock) {
        await screen.orientation.lock('landscape');
      } else {
        const cap = (window as any).Capacitor;
        if (cap?.Plugins?.ScreenOrientation?.lock) {
          await cap.Plugins.ScreenOrientation.lock({ orientation: 'landscape' });
        }
      }
    } catch(e){}
  }

  async function unlockOrientation() {
    try {
      if (screen?.orientation?.unlock) {
        screen.orientation.unlock();
      } else {
        const cap = (window as any).Capacitor;
        if (cap?.Plugins?.ScreenOrientation?.unlock) {
          await cap.Plugins.ScreenOrientation.unlock();
        }
      }
    } catch(e){}
  }

  async function enterMiniMode() {
    try {
      if (videoPlayer && (videoPlayer as any).requestPictureInPicture) {
        await (videoPlayer as any).requestPictureInPicture();
        return;
      }
    } catch(e) {
      console.warn('PiP nativo falhou, usando fallback:', e);
    }
    inAppMini = true;
    videoPlayer?.classList?.add('mini-video');
    attachMiniDragHandlers();
    showControls = true;
  }

  function exitMiniMode() {
    try {
      if (document?.exitPictureInPicture) {
        document.exitPictureInPicture().catch(()=>{});
      }
    } catch(e) {}
    inAppMini = false;
    videoPlayer?.classList?.remove('mini-video');
    detachMiniDragHandlers();
  }

  let dragging = false;
  let startX = 0, startY = 0, baseX = 12, baseY = 12;

  function attachMiniDragHandlers() { /* ... */ }
  function detachMiniDragHandlers() { /* ... */ }
  function miniDragStart(ev: any) { /* ... */ }
  function miniDragMove(ev: any) { /* ... */ }
  function miniDragEnd() { /* ... */ }

  function onKeydownGlobal(e: KeyboardEvent) {
    if (!videoPlayer) return;
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); playPause(); }
    if (e.key === 'ArrowRight') nudge(5);
    if (e.key === 'ArrowLeft') nudge(-5);
    if (e.key === 'f') toggleFullscreen();
  }
  window.addEventListener('keydown', onKeydownGlobal);
  onDestroy(() => {
    window.removeEventListener('keydown', onKeydownGlobal);
    try { if ('mediaSession' in navigator) (navigator as any).mediaSession.metadata = null; } catch(e){}
  });

  // 🔥 CORRIGIDO: Handlers agora passam índice corretamente
  async function handlePauseOverlayNext(e) {
    e?.stopPropagation?.();
    console.log('[handlePauseOverlayNext] Chamado. currentItemIndex:', currentItemIndex);
    showNextEpisodes = false;
    await tick();
    try { videoPlayer?.pause(); } catch {}
    performNextEpisode(currentItemIndex + 1); // 🔥 PASSA O ÍNDICE EXPLICITAMENTE
  }

  async function handlePauseOverlaySelect(e) {
    if (e?.detail === undefined) return;
    const idx = Number(e.detail);
    console.log('[handlePauseOverlaySelect] Selecionado índice:', idx);
    e.stopPropagation?.();
    showNextEpisodes = false;
    await tick();
    try { videoPlayer?.pause(); } catch {}
    performNextEpisode(idx);
  }

  function handleOpenEpisodesFromOverlay(e: Event) {
    e?.stopPropagation?.();
    showNextEpisodes = true;
  }

</script>

<div
  bind:this={playerContainer}
  role="application"
  tabindex="0"
  class="relative flex h-screen w-screen select-none flex-col items-center justify-center overflow-hidden bg-black text-white touch-manipulation"
  on:mousemove={showControlsAndResetTimer}
  on:keydown={showControlsAndResetTimer}
>

  {#if !$userHasInteracted && !isVodMode}
    <div
      class="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 p-4 text-center"
      on:click={() => userHasInteracted.set(true)}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && userHasInteracted.set(true)}
      role="button"
      tabindex="0"
    >
      <PlayCircle class="h-24 w-24 text-white drop-shadow-2xl" />
      <h1 class="text-4xl font-bold drop-shadow-lg">Tocar para Iniciar</h1>
    </div>
  {/if}

  <video
    bind:this={backgroundVideoPlayer}
    class="cinematic-background"
    autoplay
    playsinline
    muted
    loop
    on:ended={() => backgroundVideoPlayer.play()}
    on:error={(e) => console.error('Background video error:', e)}
  ></video>

  <video
    bind:this={videoPlayer}
    on:play={onPlay}
    on:pause={onPause}
    on:timeupdate={onTimeUpdate}
    on:volumechange={onVolumeChange}
    on:loadedmetadata={onLoadedMetadata}
    on:ended={onEnded}
    class="{inAppMini ? 'mini-video' : ''} h-full w-full {isFillScreen ? 'object-cover' : 'object-contain'} {(!$userHasInteracted && !isVodMode) ? 'blur-sm' : ''} relative z-0"
    autoplay
    playsinline
    muted={!$userHasInteracted && !isVodMode}
  ></video>

  {#if $userHasInteracted || isVodMode}
    <div class="pointer-events-auto absolute inset-0 z-10">
      <div
        class="absolute inset-y-0 left-0 w-1/2"
        role="button"
        aria-label="Voltar 5 segundos"
        on:dblclick|stopPropagation={handleLeftDblClick}
        on:touchend|stopPropagation={onTouchEndLeft}
        tabindex="0"
      ></div>
      <div
        class="absolute inset-y-0 right-0 w-1/2"
        role="button"
        aria-label="Avançar 5 segundos"
        on:dblclick|stopPropagation={handleRightDblClick}
        on:touchend|stopPropagation={onTouchEndRight}
        tabindex="0"
      ></div>
    </div>

    {#if skipFlash.visible}
      <div class="pointer-events-none absolute inset-0 z-20">
        {#if skipFlash.dir === 'back'}
          <div class="absolute left-6 top-1/2 -translate-y-1/2 rounded-xl bg-black/60 px-4 py-3 text-2xl font-bold backdrop-blur-md animate-pulse">-5s</div>
        {:else}
          <div class="absolute right-6 top-1/2 -translate-y-1/2 rounded-xl bg-black/60 px-4 py-3 text-2xl font-bold backdrop-blur-md animate-pulse">+5s</div>
        {/if}
      </div>
    {/if}

    <div class="absolute inset-0 z-30 pointer-events-none">
      <button
        on:click={goBack}
        class="absolute left-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/75 pointer-events-auto {showControls ? 'opacity-100' : 'opacity-0'}"
      >
        <ArrowLeft class="h-6 w-6" />
      </button>

      <div class="absolute bottom-0 inset-x-0 pointer-events-auto {showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300">
        <PlayerControls
          {isPlaying}
          {currentTime}
          {duration}
          {volume}
          {isMuted}
          {isFullscreen}
          {playbackRate}
          {isFillScreen}
          {audioTracks}
          {selectedAudioTrack}
          on:playPause={playPause}
          on:seek={(e) => seek(e.detail)}
          on:setVolume={(e) => setVolume(e.detail)}
          on:toggleMute={toggleMute}
          on:setPlaybackRate={(e) => setPlaybackRate(e.detail)}
          on:requestFullscreen={toggleFullscreen}
          on:toggleCinematic={() => { isFillScreen = !isFillScreen; }}
          on:openEpisodes={() => (showNextEpisodes = true)}
          on:changeAudioTrack={(e) => changeAudioTrack(e.detail)}
          on:enterMini={() => enterMiniMode()}
        />
      </div>

      {#if !isPlaying && !showEndOverlay}
        <div class="absolute inset-0 pointer-events-auto">
          <PauseOverlay
            title={currentItem?.nome}
            synopsis={currentItem?.meta?.descricao}
            nextEpisodes={proximosDesenhos}
            currentItemIndex={currentItemIndex}
            on:continue={playPause}
            on:next={handlePauseOverlayNext}
            on:selectEpisode={handlePauseOverlaySelect}
            on:openEpisodes={handleOpenEpisodesFromOverlay}
          />
        </div>
      {/if}

      <div class="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 pb-2 {showControls ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none" aria-hidden="true">
        <div class="mx-auto h-1.5 w-16 rounded-full bg-white/70"></div>
      </div>
    </div>

    {#if showNextEpisodes}
      <NextEpisodesPanel
        episodes={playlist}
        currentItemIndex={currentItemIndex}
        on:close={() => (showNextEpisodes = false)}
        on:select={(e) => {
          const idx = Number(e.detail);
          console.log('[NextEpisodesPanel] Selecionado índice:', idx);
          if (!Number.isFinite(idx)) return;
          performNextEpisode(idx); // 🔥 USA performNextEpisode
          showNextEpisodes = false;
        }}
      />
    {/if}
  {/if}

  {#if showEndOverlay}
    <div class="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto">
      <div class="w-full max-w-3xl mb-12 bg-gradient-to-b from-black/70 to-neutral-900/95 rounded-xl p-4 text-white" role="dialog" tabindex="0" on:click|stopPropagation>
        {#if hasNextEpisode}
          <div class="flex items-center gap-4">
            <img src={playlist[currentItemIndex + 1]?.meta?.poster || playlist[currentItemIndex + 1]?.meta?.thumbnail || 'https://placehold.co/320x180/0f1724/ffffff?text=?'} alt="Próximo" class="w-28 h-16 object-cover rounded"/>
            <div style="flex:1">
              <div style="font-weight:800">{playlist[currentItemIndex + 1]?.meta?.tituloEpisodio || playlist[currentItemIndex + 1]?.nome}</div>
              <div style="font-size:13px;opacity:.8">{playlist[currentItemIndex + 1]?.meta?.temporada || ''}</div>
            </div>
            <div style="text-align:center">
              <div style="font-weight:700;font-size:22px">{endCountdown}s</div>
              <button class="mt-2 px-3 py-2 rounded bg-white text-black font-semibold" on:click|stopPropagation={() => performNextEpisode(currentItemIndex + 1)}>Pular agora</button>
              <button class="mt-2 ml-2 px-3 py-2 rounded bg-transparent border border-white text-white" on:click|stopPropagation={cancelEndCountdown}>Cancelar</button>
            </div>
          </div>
        {:else}
          <div class="text-center">
            <span style="font-weight:800">Fim do conteúdo</span>
            <div style="margin-top:6px;opacity:.9">Obrigado por assistir</div>
            <button class="mt-4 px-4 py-2 rounded bg-white text-black font-semibold" on:click|stopPropagation={() => { trySaveProgressNow(); }}>Fechar</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if inAppMini}
    <div
      class="fixed z-60 rounded overflow-hidden shadow-lg"
      role="button"
      tabindex="0"
      style="width:220px;height:124px;right:12px;bottom:12px;touch-action:none;cursor:grab;"
      on:touchstart|preventDefault={(ev)=> miniDragStart(ev)}
      on:mousedown|preventDefault={(ev)=> miniDragStart(ev)}
      on:click|stopPropagation={() => { /* keep watching */ }}
    >
    </div>
  {/if}

</div>

<style>
  .mini-video {
    position: fixed !important;
    width: 220px !important;
    height: 124px !important;
    right: 12px !important;
    bottom: 12px !important;
    z-index: 9999 !important;
    border-radius: 10px !important;
    object-fit: cover !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
    touch-action: none !important;
  }

  .cinematic-background {
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
    z-index: -1;
    transform: translate(-50%, -50%) scale(1.2);
    filter: blur(50px) brightness(0.6);
    object-fit: cover;
  }

  :global(html), :global(body) { height: 100%; margin: 0; }
  :global(body) > :global(#svelte) { height: 100%; }
</style>
