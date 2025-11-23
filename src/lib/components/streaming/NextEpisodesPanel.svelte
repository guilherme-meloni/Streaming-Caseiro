<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { X } from 'lucide-svelte';
  import type { PlaylistItem } from '$lib/types';

  export let episodes: PlaylistItem[] = [];
  export let currentItemIndex: number = 0;

  const dispatch = createEventDispatcher();
  function emit(name: string, detail?: any) {
    try { dispatch(name, detail); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('player:' + name, { detail })); } catch (e) {}
  }

  function episodeSort(a: PlaylistItem, b: PlaylistItem) {
    const getNum = (ep: PlaylistItem) => {
      const n = ep.meta?.episodio || ep.meta?.numero || (ep.meta?.tituloEpisodio || ep.nome).match(/E(\d+)/i)?.[1];
      const v = n ? parseInt(n, 10) : NaN;
      return Number.isFinite(v) ? v : Infinity;
    };
    const na = getNum(a);
    const nb = getNum(b);
    return (Number.isFinite(na) && Number.isFinite(nb)) ? na - nb : 0;
  }

  $: seasons = (function (eps) {
    const map = new Map<string, PlaylistItem[]>();
    for (const ep of eps) {
      const s = (ep.meta?.temporada || ep.meta?.season || 'Temporada Única').toString();
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(ep);
    }
    const arr = Array.from(map.entries()).map(([title, items]) => ({
      title,
      items: items.slice().sort(episodeSort)
    }));
    return arr;
  })(episodes);

  let selectedSeason = 0;

  function selectSeason(i: number) { selectedSeason = i; }
  function selectEpisodeByIndex(idx: number) {
    emit('select', idx);
    emit('playEpisode', { index: idx });
  }

  function absoluteIndexFor(ep: PlaylistItem) {
    return episodes.findIndex(e => e.meta?.path === ep.meta?.path);
  }

  function close() { emit('close'); }

  let startX: number | null = null;
  let startY: number | null = null;
  let panelEl: HTMLDivElement;
  const CLOSE_THRESHOLD = 180;
  const DIRECTION_THRESHOLD = 40;
  let currentTranslate = 0;
  let dragDirection: 'none' | 'horizontal' | 'vertical' = 'none';
  let isDragging = false;
  let isScrolling = false;

  function onTouchStart(e: TouchEvent) {
    const target = e.target as HTMLElement;
    
    if (target && (
      target.closest('.episodes-row') || 
      target.closest('.seasons') || 
      target.closest('.card') || 
      target.closest('.season') ||
      target.closest('button')
    )) {
      startX = null;
      startY = null;
      isScrolling = true;
      return;
    }
    
    if (e.touches.length !== 1) return;
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentTranslate = 0;
    dragDirection = 'none';
    isDragging = false;
    isScrolling = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (isScrolling || startY === null || startX === null) return;
    
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (dragDirection === 'none') {
      if (Math.abs(dx) > DIRECTION_THRESHOLD || Math.abs(dy) > DIRECTION_THRESHOLD) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dragDirection = 'horizontal';
        } else {
          dragDirection = 'vertical';
        }
      }
    }

    if (dragDirection === 'horizontal') {
      return;
    }

    if (dragDirection === 'vertical' && dy > 0) {
      isDragging = true;
      currentTranslate = dy;
      
      const resistance = Math.min(1, 1 - (currentTranslate / (window.innerHeight * 0.6)));
      const finalTranslate = currentTranslate * resistance;
      
      if (panelEl) {
        panelEl.style.transform = `translateY(${finalTranslate}px)`;
      }
      
      if (currentTranslate > 15) {
        e.preventDefault();
      }
    }
  }

  function onTouchEnd() {
    if (isScrolling) {
      startX = null;
      startY = null;
      isScrolling = false;
      return;
    }

    if (startY === null) {
      startX = null;
      return;
    }

    if (dragDirection === 'horizontal') {
      if (panelEl) {
        panelEl.style.transition = 'transform 0.2s ease';
        panelEl.style.transform = 'translateY(0px)';
        setTimeout(() => {
          if (panelEl) panelEl.style.transition = '';
        }, 220);
      }
    } 
    else if (dragDirection === 'vertical' && isDragging) {
      if (currentTranslate > CLOSE_THRESHOLD) {
        emit('close');
      } else {
        if (panelEl) {
          panelEl.style.transition = 'transform 0.2s ease';
          panelEl.style.transform = 'translateY(0px)';
          setTimeout(() => {
            if (panelEl) panelEl.style.transition = '';
          }, 220);
        }
      }
    }

    startX = null;
    startY = null;
    currentTranslate = 0;
    dragDirection = 'none';
    isDragging = false;
    isScrolling = false;
  }

  function backdropKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function onBackdropClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('backdrop')) {
      close();
    }
  }
</script>

<style>
  .backdrop{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.7);
    display:flex;
    align-items:flex-end;
    justify-content:center;
    z-index:200;
    backdrop-filter: blur(3px);
  }
  .sheet{
    width:100%;
    max-width:1000px;
    border-radius:18px 18px 0 0;
    background:linear-gradient(180deg,#0a0a0a,#000);
    color:#fff;
    padding:14px 12px 28px;
    box-shadow:0 -24px 50px rgba(0,0,0,0.7);
    touch-action: none;
    will-change: transform;
  }
  .handle{
    width:48px;
    height:5px;
    background:rgba(255,255,255,0.18);
    border-radius:999px;
    margin:8px auto 14px;
  }
  .seasons{
    display:flex;
    gap:10px;
    overflow-x:auto;
    padding:10px 8px 6px;
    scroll-snap-type:x proximity;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
  }
  .season{
    flex:0 0 auto;
    padding:10px 16px;
    border-radius:14px;
    background:rgba(255,255,255,0.04);
    cursor:pointer;
    white-space:nowrap;
    scroll-snap-align:start;
    transition: background 0.2s ease, transform 0.1s ease;
    user-select: none;
  }
  .season:active{
    transform: scale(0.97);
  }
  .season.active{
    background:linear-gradient(90deg,#1f2937,#111827);
    font-weight:700;
  }
  .episodes-row{
    display:flex;
    gap:12px;
    overflow-x:auto;
    padding:14px 8px;
    scroll-snap-type:x mandatory;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
  }
  .card{
    width:160px;
    border-radius:12px;
    background:rgba(255,255,255,0.04);
    overflow:hidden;
    cursor:pointer;
    flex:0 0 auto;
    scroll-snap-align:center;
    transition: transform 0.2s ease, background 0.2s ease;
    user-select: none;
  }
  .card:hover{
    background:rgba(255,255,255,0.08);
  }
  .card:active{
    transform: scale(0.96);
  }
  .thumb{
    width:100%;
    height:95px;
    object-fit:cover;
    background:#0a0a0a;
    pointer-events: none;
  }
  .meta{
    padding:10px;
    font-size:13px;
    pointer-events: none;
  }
  .close{
    position:absolute;
    right:12px;
    top:10px;
    background:rgba(0,0,0,0.6);
    border:none;
    color:#fff;
    padding:9px;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    z-index: 10;
  }
  .close:hover{
    background:rgba(0,0,0,0.8);
  }
  .close:active{
    transform: scale(0.94);
  }
  .seasons::-webkit-scrollbar, .episodes-row::-webkit-scrollbar { 
    height:8px; 
  }
  .seasons::-webkit-scrollbar-thumb, .episodes-row::-webkit-scrollbar-thumb { 
    background: rgba(255,255,255,0.12); 
    border-radius:999px; 
  }
  .seasons::-webkit-scrollbar-thumb:hover, .episodes-row::-webkit-scrollbar-thumb:hover { 
    background: rgba(255,255,255,0.18); 
  }
  .seasons::-webkit-scrollbar-track, .episodes-row::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.03);
    border-radius: 999px;
  }
</style>

<div 
  class="backdrop" 
  transition:fade={{duration:180}} 
  role="presentation" 
  tabindex="0" 
  on:keydown={backdropKey} 
  on:click={onBackdropClick}
>
  <div 
    bind:this={panelEl} 
    class="sheet" 
    transition:slide={{duration:260, axis:'y'}} 
    on:click|stopPropagation 
    on:touchstart={onTouchStart} 
    on:touchmove={onTouchMove} 
    on:touchend={onTouchEnd} 
    role="dialog" 
    aria-modal="true" 
    aria-label="Próximos episódios" 
    tabindex="0"
  >
    <div class="handle"></div>
    
    <button 
      class="close" 
      on:click|stopPropagation={close} 
      aria-label="Fechar"
    >
      <X class="h-5 w-5"/>
    </button>

    <div class="seasons" role="tablist" aria-label="Temporadas">
      {#each seasons as s, i}
        <div 
          class="season {i === selectedSeason ? 'active' : ''}" 
          role="tab" 
          tabindex="0" 
          on:click|stopPropagation={() => selectSeason(i)} 
          on:keydown={(e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
              selectSeason(i); 
              e.preventDefault(); 
            } 
          }}
        >
          {s.title} <span style="margin-left:10px;opacity:.7">({s.items.length})</span>
        </div>
      {/each}
    </div>

    <div class="episodes-row" role="list">
      {#each seasons[selectedSeason]?.items || [] as ep}
        {@const idx = absoluteIndexFor(ep)}
        <div 
          class="card" 
          role="button" 
          tabindex="0" 
          on:click|stopPropagation={() => selectEpisodeByIndex(idx)} 
          on:keydown={(e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
              selectEpisodeByIndex(idx); 
              e.preventDefault(); 
            } 
          }}
        >
          <img 
            class="thumb" 
            src={ep.meta?.poster || ep.meta?.thumbnail || 'https://placehold.co/320x180/0f1724/ffffff?text=?'} 
            alt={ep.meta?.tituloEpisodio || ep.nome} 
            loading="lazy"
            draggable="false"
          />
          <div class="meta">
            <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              {ep.meta?.tituloEpisodio || ep.nome}
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:7px">
              {ep.meta?.temporada || ''}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
