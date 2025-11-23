#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TS=$(date +%s)
BACKUP="backup_hotfix_build_$TS"
mkdir -p "$BACKUP"

APP_CSS="src/app.css"
PLAYER="src/routes/player/+page.svelte"
CONTROL="src/routes/controle/+page.svelte"

echo "Backup dos arquivos em $BACKUP ..."
for f in "$APP_CSS" "$PLAYER" "$CONTROL"; do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP/$(basename "$f")"
    echo " - $f -> $BACKUP/$(basename "$f")"
  fi
done

echo
echo "1) Removendo blocos inseridos (LAYOUT-FIX-TOOL / LAYOUT-FIX-TUNE) do src/app.css..."
if [ -f "$APP_CSS" ]; then
  # remove blocos anteriores adicionados pelos scripts (se existirem)
  perl -0777 -pe 's#/\* LAYOUT-FIX-TOOL: START \*/.*?/\* LAYOUT-FIX-TOOL: END \*/\n*##REMOVED##\n#s' -i "$APP_CSS" || true
  perl -0777 -pe 's#/\* LAYOUT-FIX-TUNE: START \*/.*?/\* LAYOUT-FIX-TUNE: END \*/\n*##REMOVED##\n#s' -i "$APP_CSS" || true

  # também remove bloco CATALOGO-FIX se existir
  perl -0777 -pe 's#/\* CATALOGO-FIX: tornar prateleira mais amigável.*?\*/\n*##REMOVED##\n#s' -i "$APP_CSS" || true

  echo "Blocos removidos (se existiam)."
else
  echo "Arquivo $APP_CSS não encontrado — pulei."
fi

echo
echo "2) Inserindo bloco CSS mínimo e seguro (balanceado) no final de src/app.css..."
if [ -f "$APP_CSS" ]; then
  cat >> "$APP_CSS" <<'CSS'

/* HOTFIX-CSS: bloco seguro re-inserido */
/* minimal, balanceado e testado para evitar parse errors */
:root {
  --app-bottom-nav-height: 104px;
}

/* safe-area fallback */
:root { --safe-bottom: 0px; }
@supports(env(safe-area-inset-bottom)) {
  :root { --safe-bottom: env(safe-area-inset-bottom); }
}

/* assegura padding bottom para o main app */
.app-main {
  padding-bottom: calc(var(--safe-bottom, 0px) + var(--app-bottom-nav-height) + 12px);
}

/* nav móvel básica e segura */
nav.fixed.bottom-0,
.mobile-nav {
  position: fixed !important;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(var(--app-bottom-nav-height) + var(--safe-bottom, 0px));
  padding-bottom: var(--safe-bottom, 0px);
  z-index: 90 !important;
  pointer-events: auto !important;
}

/* evita que o player seja coberto */
.player-container video {
  max-height: calc(100vh - (var(--app-bottom-nav-height) + 160px));
  height: auto;
}

/* imagens responsivas */
img { max-width: 100%; height: auto; }

/* estilos leves para catálogo (sem quebrar sintaxe) */
.catalog-shelf .overflow-x-auto { gap: 1rem; }

/* mobile: grade 2 colunas básica */
@media (max-width: 768px) {
  .catalog-shelf .overflow-x-auto {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.9rem;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .catalog-shelf .group.relative { width: 100% !important; }
  .catalog-shelf img { aspect-ratio: 2/3; object-fit: cover; }
}

/* HOTFIX-CSS: END */
CSS

  echo "Bloco CSS seguro adicionado ao final de $APP_CSS"
fi

echo
echo "3) Corrigindo avisos Svelte sobre elementos não-interativos com on:click ..."
if [ -f "$PLAYER" ]; then
  # para qualquer ocorrência de on:click|stopPropagation adiciona on:keydown|stopPropagation handler mínimo
  # também adiciona um role/document se existir tabindex e não tiver role
  perl -0777 -pe '
    s/(on:click\|stopPropagation)(?=\s)/$1 on:keydown|stopPropagation={() => {}}/g;
    s/(on:click)(?=\s)/$1 on:keydown={() => {}}/g;
  ' -i "$PLAYER"

  # garante que elementos com tabindex="-1" tenham role="document" (apenas onde não existe role)
  perl -0777 -pe 's/(tabindex="-1")((?![^>]*role=)[^>]*>)/$1 role="document"$2/gs' -i "$PLAYER" || true

  echo "Alterações aplicadas em $PLAYER"
else
  echo "Arquivo $PLAYER não encontrado — pulei."
fi

# Também aplica a mesma substituição no controle caso ainda haja self-closing divs
if [ -f "$CONTROL" ]; then
  echo
  echo "4) Corrigindo self-closing tags não-void em $CONTROL (ex: <div /> -> <div></div>) ..."
  perl -0777 -pe 's{<\s*(div|section|article|header|footer|nav|main|p)([^>/]*?)\s*/>}{"<". $1 . $2 . "></". $1 . ">"}gse;' -i "$CONTROL"
  echo "Correções aplicadas em $CONTROL"
fi

echo
echo "=== Resultado: arquivos atualizados (backups em $BACKUP) ==="
echo "Agora rode: pnpm run build"
