<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Play, SkipForward } from 'lucide-svelte';
  import type { PlaylistItem } from '$lib/types';

  export let title: string | undefined = 'Título';
  export let synopsis: string | undefined = '';
  export let nextEpisodes: PlaylistItem[] = [];
  export let currentItemIndex: number = 0;

  const dispatch = createEventDispatcher();

  function emit(name:string, detail?:any){
    try{ dispatch(name, detail); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('player:' + name, { detail })); }catch(e){}
  }

  function onContinue(event?: Event){
    event?.stopPropagation?.();
    emit('continue');
  }

  function onNext(event?: Event){
    event?.stopPropagation?.();
    // apenas emite o evento 'next' — o handler no player fará a navegação
    emit('next');
  }

  function onKey(e:KeyboardEvent){
    if (e.key === 'Escape') emit('close');
    if (e.key === ' ' || e.key === 'Enter') onContinue();
  }
</script>

<style>
  .overlay{
    position:absolute;
    inset:0;
    z-index:50;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background:rgba(0,0,0,0.85);
    padding:24px;
    box-sizing:border-box;
    backdrop-filter: blur(5px);
  }
  .main-controls{
    display:flex;
    align-items:center;
    gap:20px;
    margin-bottom:20px;
  }
  .play-button{
    background:rgba(255,255,255,0.1);
    border:2px solid rgba(255,255,255,0.3);
    color:white;
    padding:18px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition:all 0.2s ease;
  }
  .play-button:hover{
    background:rgba(255,255,255,0.2);
    border-color:rgba(255,255,255,0.5);
    transform: scale(1.05);
  }
  .play-button:active{ transform: scale(0.95); }
  .info-section{ text-align:center; max-width:600px; color:#f6f6f6; }
  .title{ font-weight:800; font-size:24px; margin-bottom:8px; line-height: 1.3; }
  .synopsis{
    font-size:14px; color:#dcdcdc; line-height:1.6; max-height:100px; overflow:hidden; text-overflow:ellipsis; margin-bottom:20px; opacity: 0.9;
  }
  .buttons{ display:flex; gap:12px; margin-top:16px; justify-content: center; }
  .btn-primary{ background:#fff; color:#000; padding:12px 20px; border-radius:12px; font-weight:700; border:none; display:flex; align-items:center; gap:8px; cursor: pointer; transition: all 0.2s ease; }
  .btn-primary:hover{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,255,255,0.3); }
  .btn-primary:active{ transform: translateY(0); }
  .btn-ghost{ background:transparent; color:#fff; padding:12px 20px; border-radius:12px; font-weight:600; border:2px solid rgba(255,255,255,0.3); display:flex; align-items:center; gap:8px; cursor: pointer; transition: all 0.2s ease; }
  .btn-ghost:hover{ background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.5); }
  .btn-ghost:active{ transform: scale(0.98); }
</style>

<div
  class="overlay"
  transition:fade={{duration:160}}
  role="dialog"
  aria-modal="true"
  tabindex="0"
  on:keydown={onKey}
  on:click|stopPropagation
>
  <div class="main-controls">
    <button
      type="button"
      class="play-button"
      on:click|stopPropagation={onContinue}
      aria-label="Continuar"
    >
      <Play class="h-12 w-12"/>
    </button>
  </div>

  <div class="info-section">
    <div class="title">{title}</div>

    <div class="synopsis">
      {#if synopsis}
        {@html synopsis.replace(/\n/g,'<br/>')}
      {:else}
        <span style="opacity: 0.6;">Sem sinopse disponível.</span>
      {/if}
    </div>

    <div class="buttons">
      <button
        type="button"
        class="btn-primary"
        on:click|stopPropagation={onContinue}
        aria-label="Continuar assistindo"
      >
        <Play class="h-5 w-5"/> Continuar
      </button>

      <button
        type="button"
        class="btn-ghost"
        on:click|stopPropagation={onNext}
        aria-label="Próximo episódio"
      >
        <SkipForward class="h-5 w-5"/> Próximo
      </button>
    </div>
  </div>
</div>
