import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const files = [
  'src/lib/components/streaming/NextEpisodesPanel.svelte',
  'src/routes/player/+page.svelte',
  'src/lib/components/streaming/PauseOverlay.svelte'
];

async function backup(filePath, content) {
  const bak = filePath + '.bak';
  await fs.writeFile(bak, content, 'utf8');
  console.log('Backup criado:', bak);
}

async function patchNextEpisodesPanel(src) {
  let out = src;

  // Replace selectEpisodeByIndex()
  out = out.replace(
    /function\s+selectEpisodeByIndex[\s\S]*?\}\n/,
    `function selectEpisodeByIndex(idx) {
    emit('select', idx);
  }\n`
  );

  // Remove any emit("playEpisode")
  out = out.replace(/emit\(['"]playEpisode['"][\s\S]*?\);?/g, '');

  return out;
}

async function patchPauseOverlay(src) {
  let out = src;

  // add preventDefault to buttons
  out = out.replace(/on:click\|stopPropagation=\{onContinue\}/g, 'on:click|preventDefault|stopPropagation={onContinue}');
  out = out.replace(/on:click\|stopPropagation=\{onNext\}/g, 'on:click|preventDefault|stopPropagation={onNext}');

  return out;
}

async function patchPlayerPage(src) {
  let out = src;

  // --- ensure import { tick } from 'svelte' ---
  if (!/import\s*\{\s*tick\s*\}\s*from\s*['"]svelte['"]/.test(out)) {
    out = out.replace(
      /import\s*\{\s*onMount,\s*onDestroy\s*\}\s*from\s*['"]svelte['"];/,
      m => m + `\nimport { tick } from 'svelte';`
    );
  }

  // --- patch performNextEpisode ---
  out = out.replace(
    /function performNextEpisode[\s\S]*?\n  \}/,
    `function performNextEpisode(targetIndex) {
    try { videoPlayer.pause(); } catch {}
    const nextIndex = targetIndex !== undefined ? targetIndex : currentItemIndex + 1;
    if (nextIndex >= 0 && nextIndex < playlist.length) {
      currentItemIndex = nextIndex;
      selectedAudioTrack = undefined;
      audioTracks = [];
      playCurrentVodItem();
    }
    showEndOverlay = false;
    if (endCountdownTimer) clearInterval(endCountdownTimer);
  }`
  );

  // --- patch handlePauseOverlayNext ---
  out = out.replace(
    /function handlePauseOverlayNext[\s\S]*?}\n\s*function handlePauseOverlaySelect/,
    `async function handlePauseOverlayNext(e) {
    e?.stopPropagation?.();
    showNextEpisodes = false;
    await tick();
    try { videoPlayer?.pause(); } catch {}
    performNextEpisode();
  }

  function handlePauseOverlaySelect`
  );

  // --- patch handlePauseOverlaySelect ---
  out = out.replace(
    /function handlePauseOverlaySelect[\s\S]*?}\n\n\s*function handleOpenEpisodesFromOverlay/,
    `async function handlePauseOverlaySelect(e) {
    if (e?.detail === undefined) return;
    const idx = Number(e.detail);
    e.stopPropagation?.();
    showNextEpisodes = false;
    await tick();
    try { videoPlayer?.pause(); } catch {}
    performNextEpisode(idx);
  }

  function handleOpenEpisodesFromOverlay`
  );

  return out;
}

async function run() {
  console.log('— AUTO FIX PLAYER —');

  for (const relPath of files) {
    const filePath = path.join(repoRoot, relPath);

    try {
      let src = await fs.readFile(filePath, 'utf8');
      await backup(filePath, src);

      let out = src;

      if (relPath.includes('NextEpisodesPanel')) out = await patchNextEpisodesPanel(out);
      if (relPath.includes('PauseOverlay')) out = await patchPauseOverlay(out);
      if (relPath.includes('+page.svelte')) out = await patchPlayerPage(out);

      if (out !== src) {
        await fs.writeFile(filePath, out, 'utf8');
        console.log('✔ Arquivo atualizado:', relPath);
      } else {
        console.log('• Sem mudanças:', relPath);
      }

    } catch (err) {
      console.error('Erro ao processar', relPath, err);
    }
  }

  console.log('\nFinalizado. Verifique as mudanças com `git diff`.');
}

run();
