#!/usr/bin/env bash
set -euo pipefail

# scripts/tune-ui-fixes.sh
# Pequenos ajustes para:
#  - aumentar safe padding do menu móvel (se ainda cobrir)
#  - garantir nav móvel com z-index/pointer-events
#  - melhorar visual do catálogo em mobile (capas maiores, grid consistente)
#
# Faz backup dos arquivos alterados em backup_ui_tweak_<timestamp>/

ROOT="$(pwd)"
TS=$(date +%s)
BACKUP="backup_ui_tweak_$TS"
mkdir -p "$BACKUP"

FILES=(
  "src/app.css"
  "src/routes/+layout.svelte"
  "src/routes/catalogo/+page.svelte"
)

echo "Rodando em: $ROOT"
echo "Backups -> $BACKUP"
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP/$(basename "$f")"
    echo "Backup: $f -> $BACKUP/$(basename "$f")"
  else
    echo "Aviso: $f não existe (pulei)."
  fi
done

APP_CSS="src/app.css"

# 1) Aumentar --app-bottom-nav-height para 104px (mais seguro para barras do SO)
if [ -f "$APP_CSS" ]; then
  echo "Atualizando --app-bottom-nav-height para 104px (se existir)..."
  perl -0777 -pe 's/--app-bottom-nav-height:\s*\d+px/--app-bottom-nav-height: 104px/g' -i "$APP_CSS" || true

  # Adiciona/atualiza um bloco de tune se não existir (marca TUNE-FIX)
  if ! grep -q "/* LAYOUT-FIX-TUNE: START */" "$APP_CSS"; then
    cat >> "$APP_CSS" <<'CSS'

/* LAYOUT-FIX-TUNE: START */
/* Ajustes extras para nav móvel e catálogo */
:root { --app-bottom-nav-height: 104px; }

/* força nav móvel acima e clicável */
nav.fixed.bottom-0,
.mobile-nav {
  z-index: 90 !important;
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: auto !important;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  backface-visibility: hidden;
}

/* empurra o conteúdo mais ainda para cima, evitando sobreposição */
.app-main {
  padding-bottom: calc(var(--safe-bottom, 0px) + var(--app-bottom-nav-height) + 12px) !important;
  min-height: calc(100vh - (var(--app-bottom-nav-height) + var(--safe-bottom, 0px)));
}

/* se o sistema ainda esconder algo, adiciona uma margem extra interna aos links */
nav.mobile-nav a {
  padding-bottom: calc(10px + var(--safe-bottom, 0px)) !important;
}

/* suaviza e garante que o player não vá para baixo do menu */
.player-container video { max-height: calc(100vh - (var(--app-bottom-nav-height) + 160px)) !important; }

/* CATALOGO: melhorar grade e visual das capas no mobile */
.catalog-shelf .overflow-x-auto { gap: 1rem; }

/* mobile: grade responsiva com colunas mínimas e capas maiores */
@media (max-width: 768px) {
  .catalog-shelf .overflow-x-auto {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.9rem;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .catalog-shelf .group.relative {
    width: 100% !important;
    min-height: 260px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .catalog-shelf img {
    width: 100%;
    height: auto;
    aspect-ratio: 2/3;
    object-fit: cover;
    border-radius: 0.5rem;
    box-shadow: 0 8px 30px rgba(0,0,0,0.35);
  }

  .catalog-shelf .space-y-1 { text-align: center; padding-top: 0.5rem; }
  .catalog-shelf .space-y-1 p.line-clamp-2 { font-size: 0.95rem; }
}

/* tablet/desktop: grade mais ampla */
@media (min-width: 769px) and (max-width: 1024px) {
  .catalog-shelf .overflow-x-auto {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(160px, 1fr));
    gap: 1rem;
    overflow-x: visible;
  }
}

@media (min-width: 1025px) {
  .catalog-shelf .overflow-x-auto {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    overflow-x: visible;
  }
}

/* garante área de toque nos botões da nav (aumenta hit area) */
nav.mobile-nav a { padding-top: 8px; padding-bottom: calc(10px + var(--safe-bottom, 0px)); }

/* LAYOUT-FIX-TUNE: END */

CSS
    echo "Bloco LAYOUT-FIX-TUNE adicionado em $APP_CSS"
  else
    echo "Bloco LAYOUT-FIX-TUNE já existe — atualizando apenas valores."
  fi
else
  echo "Pulei CSS: $APP_CSS não encontrado."
fi

# 2) Reforçar mobile-nav no +layout.svelte (caso ainda não tenha)
LAYOUT="src/routes/+layout.svelte"
if [ -f "$LAYOUT" ]; then
  if ! grep -q "mobile-nav" "$LAYOUT"; then
    echo "Adicionando mobile-nav em +layout.svelte..."
    # adiciona mobile-nav à nav móvel (segunda nav)
    perl -0777 -pe 's{(<nav\s+class=")([^"]*?\bfixed\b[^"]*?\bbottom-0\b[^"]*)"}{ (index($2,"mobile-nav")!=-1) ? qq{$1$2"} : qq{$1$2 mobile-nav"} }ge' -i "$LAYOUT" || true
    echo "Feito."
  else
    echo "mobile-nav já presente em +layout.svelte."
  fi
fi

# 3) Ajuste fino: se quiser testar um valor maior rápido (opcional)
echo
echo "Se o menu ainda sobrepor, você pode aumentar para 120px com (opcional):"
echo "perl -0777 -pe 's/--app-bottom-nav-height:\\s*\\d+px/--app-bottom-nav-height: 120px/g' -i src/app.css"

echo
echo "Pronto. Backups em: $BACKUP"
echo "Rode: pnpm run dev e teste no dispositivo. Se precisar, ajuste para 120px."
