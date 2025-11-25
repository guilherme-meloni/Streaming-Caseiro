/**
 * scripts/auto-fix-player.js
 *
 * Aplica os patches descritos:
 *  - NextEpisodesPanel.svelte: emite apenas 'select' (remove playEpisode).
 *  - +page.svelte: adiciona import { tick } from 'svelte'; e troca handlers
 *    handlePauseOverlayNext / handlePauseOverlaySelect para versões async
 *    que aguardam tick(), fecham overlays e pausam video antes de trocar.
 *  - +page.svelte: substitui on:select inline handler no <NextEpisodesPanel ... />
 *    para versão async (fecha painel -> await tick() -> pause -> set index -> play).
 *  - +page.svelte: modifica performNextEpisode para limpar selectedAudioTrack/audioTracks.
 *  - PauseOverlay.svelte: adiciona |preventDefault aos handlers de clique (reduz cliques duplos).
 *
 * Faz backup (arquivo.bak) antes de sobrescrever.
 */

const fs = require('fs').promises;
const path = require('path');

const repoRoot = process.cwd();

const files = [
  'src/lib/components/streaming/NextEpisodesPanel.svelte',
  'src/routes/player/+page.svelte',
  'src/lib/components/streaming/PauseOverlay.svelte',
  'src/lib/components/streaming/DetailsPage.svelte' // opcional, não alterado diretamente aqui, mas mantido para referência
];

async function backup(filePath, content) {
  const bakPath = filePath + '.bak';
  try {
    await fs.writeFile(bakPath, content, 'utf8');
    console.log(`Backup criado: ${bakPath}`);
  } catch (err) {
    console.error('Erro criando backup', bakPath, err);
  }
}

async function applyPatches() {
  for (const rel of files) {
    const filePath = path.join(repoRoot, rel);
    try {
      let src = await fs.readFile(filePath, 'utf8');
      await backup(filePath, src);

      let modified = src;
      if (rel.endsWith('NextEpisodesPanel.svelte')) {
        // 1) replace selectEpisodeByIndex to emit only 'select'
        modified = modified.replace(
          /function selectEpisodeByIndex\([\s\S]*?\}\n/,
          `function selectEpisodeByIndex(idx: number) {
    // Emitimos apenas um evento 'select' — o player principal decide tocar.
    emit('select', idx);
  }\n`
        );

        // 1b) ensure there is no stray emit('playEpisode'...) elsewhere
        modified = modified.replace(/emit\(['"]playEpisode['"][\s\S]*?\);?\n/g, '');
      }

      if (rel.endsWith('+page.svelte')) {
        // add import { tick } from 'svelte'; if missing
        if (!/import\s*\{\s*tick\s*\}\s*from\s*['"]svelte['"]/.test(modified)) {
          // attempt to place after the first svelte import line (onMount,onDestroy)
          modified = modified.replace(
            /import\s*\{\s*onMount,\s*onDestroy\s*\}\s*from\s*['"]svelte['"];?/,
            (m) => m + '\nimport { tick } from \'svelte\';'
          );
        }

        // replace handlePauseOverlayNext function
        modified = modified.replace(
          /function handlePauseOverlayNext\([\s\S]*?\}\n\n\s*function handlePauseOverlaySelect/,
          `async function handlePauseOverlayNext(e: Event) {
    e?.stopPropagation?.();
    // fecha overlays / mostra menos controles antes de trocar de episódio
    showNextEpisodes = false;
    // espera a atualização de estado/DOM
    await tick();
    // garante que o player esteja pausado e pronto
    try { videoPlayer?.pause(); } catch (err) {}
    performNextEpisode();
  }

  function handlePauseOverlaySelect`
        );

        // replace handlePauseOverlaySelect function body (the old one)
        modified = modified.replace(
          /function handlePauseOverlaySelect\([\s\S]*?\}\n\n\s*function handleOpenEpisodesFromOverlay/,
          `async function handlePauseOverlaySelect(e: CustomEvent<number>) {
    if (e?.detail === undefined) return;
    e?.stopPropagation?.();
    const idx = Number(e.detail);
    if (!Number.isFinite(idx)) return;
    // fecha painéis primeiro
    showNextEpisodes = false;
    await tick();
    // garante pausa antes de trocar e tocar
    try { videoPlayer?.pause(); } catch (err) {}
    performNextEpisode(idx);
  }

  function handleOpenEpisodesFromOverlay`
        );

        // Replace inline NextEpisodesPanel on:select handler (the specific block)
        // We target the known original pattern and replace with async version.
        modified = modified.replace(
          /<NextEpisodesPanel([\s\S]*?)on:select=\{\(\s*e\s*\)\s*=>\s*\{\s*const\s+idx\s*=\s*Number\(e\.detail\);\s*if\s*\(!Number\.isFinite\(idx\)\)\s*return;\s*currentItemIndex\s*=\s*idx;\s*playCurrentVodItem\(\);\s*showNextEpisodes\s*=\s*false;\s*}\s*\}([\s\S]*?)\/>/,
          (m, p1, p2) => {
            // reconstruct with async inline handler (keeps other attributes)
            return `<NextEpisodesPanel${p1}on:select={async (e) => {
    const idx = Number(e.detail);
    if (!Number.isFinite(idx)) return;
    // fecha painel, aguarda atualização e então troca
    showNextEpisodes = false;
    await tick();
    try { videoPlayer?.pause(); } catch (err) {}
    currentItemIndex = idx;
    playCurrentVodItem();
  }}${p2}/>`;
          }
        );

        // replace performNextEpisode body to clear audio tracks
        modified = modified.replace(
          /function performNextEpisode\(targetIndex\?: number\) \{[\s\S]*?\n  \}/,
          `function performNextEpisode(targetIndex?: number) {
    try { videoPlayer.pause(); } catch(e){}
    const nextIndex = targetIndex !== undefined ? targetIndex : currentItemIndex + 1;
    if (nextIndex >= 0 && nextIndex < playlist.length) {
      // atualiza índice primeiro, limpa seleção de áudio e toca
      currentItemIndex = nextIndex;
      selectedAudioTrack = undefined;
      audioTracks = [];
      playCurrentVodItem();
    }
    showEndOverlay = false;
    if (endCountdownTimer) clearInterval(endCountdownTimer);
  }`
        );
      }

      if (rel.endsWith('PauseOverlay.svelte')) {
        // add |preventDefault to the on:click handlers for continue and next
        // two occurrences: play-button and the two control buttons
        modified = modified.replace(/on:click\|stopPropagation=\{onContinue\}/g, 'on:click|preventDefault|stopPropagation={onContinue}');
        modified = modified.replace(/on:click\|stopPropagation=\{onNext\}/g, 'on:click|preventDefault|stopPropagation={onNext}');
        modified = modified.replace(/on:click\|stopPropagation=\{onContinue\}/g, 'on:click|preventDefault|stopPropagation={onContinue}');
      }

      // If nothing changed, notify and skip write
      if (modified === src) {
        console.log(`Nenhuma mudança necessária: ${rel}`);
        continue;
      }

      await fs.writeFile(filePath, modified, 'utf8');
      console.log(`Arquivo atualizado: ${rel}`);
    } catch (err) {
      console.error(`Erro processando ${rel}:`, err.message || err);
    }
  }

  console.log('\nProcesso finalizado. Revise as mudanças (git diff) e rode seu app para testar.');
}

applyPatches().catch(err => {
  console.error('Erro fatal no script:', err);
  process.exit(1);
});
