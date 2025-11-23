#!/usr/bin/env bash
set -euo pipefail

# scripts/apply-ui-fixes.sh
# Aplica ajustes no layout: menu safe area, mobile-nav, melhorias no catálogo.
# Faz backup dos arquivos modificados.

ROOT_DIR="$(pwd)"
TARGETS=(
  "src/app.css"
  "src/routes/+layout.svelte"
  "src/routes/catalogo/+page.svelte"
)
TS=$(date +%s)
BACKUP_DIR="backup_ui_fixes_$TS"
mkdir -p "$BACKUP_DIR"

echo "Rodando em: $ROOT_DIR"
echo "Backups serão salvos em: $BACKUP_DIR"
echo

# Verifica existência e faz backup
for f in "${TARGETS[@]}"; do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP_DIR/$(basename "$f")"
    echo "Backup: $f -> $BACKUP_DIR/$(basename "$f")"
  else
    echo "AVISO: $f não encontrado — algumas etapas podem pular (verifique)."
  fi
done

############################
# 1) Atualizar/Inserir LAYOUT-FIX-TOOL no src/app.css
############################
APP_CSS="src/app.css"
if [ -f "$APP_CSS" ]; then
  MARKER_START='/* LAYOUT-FIX-TOOL: START */'
  if grep -qF "$MARKER_START" "$APP_CSS"; then
    echo "Atualizando bloco LAYOUT-FIX-TOOL em $APP_CSS..."
    perl -0777 -pe 's#/\* LAYOUT-FIX-TOOL: START \*/.*?/\* LAYOUT-FIX-TOOL: END \*/#/* LAYOUT-FIX-TOOL: START */\n:root {\n  --app-bottom-nav-height: 88px; /* aumentado para garantir distância do menu do SO */\n}\n\n/* safe-area fallback */\n:root { --safe-bottom: 0px; }\n@supports(env(safe-area-inset-bottom)) {\n  :root { --safe-bottom: env(safe-area-inset-bottom); }\n}\n\n/* main recebe padding extra para não ficar atrás do menu */\n.app-main { padding-bottom: calc(var(--safe-bottom, 0px) + var(--app-bottom-nav-height) + 8px); }\n\n/* mobile nav seguro */\nnav.fixed.bottom-0, .mobile-nav {\n  position: fixed !important;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  height: calc(var(--app-bottom-nav-height) + var(--safe-bottom, 0px));\n  padding-bottom: var(--safe-bottom, 0px);\n  z-index: 60; /* sempre acima do conteúdo */\n}\n\nnav.fixed.bottom-0 a { padding-top: 12px; padding-bottom: calc(8px + var(--safe-bottom, 0px)); }\n\n/* vídeos: garantimos que não fiquem atrás do menu */\n.player-container video { max-height: calc(100vh - (var(--app-bottom-nav-height) + 140px)); height: auto; }\n\n/* imagens responsivas */\nimg { max-width: 100%; height: auto; }\n\n/* modais: limitar altura e permitir scroll interno */\n.fixed.inset-0 > div, .fixed.inset-0 .max-w-2xl {\n  max-height: calc(100vh - 96px);\n  overflow: auto;\n}\n\n/* suaviza scrolls horizontais para mobile */\n.overflow-x-auto { -webkit-overflow-scrolling: touch; scroll-padding: 1rem; }\n\na, button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }\n\n/* margens para modais */\n.fixed[role=\"dialog\"] .max-w-2xl, .fixed[role=\"dialog\"] > div { margin: 1rem; }\n/* LAYOUT-FIX-TOOL: END */#s' -i "$APP_CSS"
  else
    echo "Inserindo novo bloco LAYOUT-FIX-TOOL em $APP_CSS..."
    cat >> "$APP_CSS" <<'CSS'

/* LAYOUT-FIX-TOOL: START */
:root {
  --app-bottom-nav-height: 88px; /* aumentado para garantir distância do menu do SO */
}

/* safe-area fallback */
:root { --safe-bottom: 0px; }
@supports(env(safe-area-inset-bottom)) {
  :root { --safe-bottom: env(safe-area-inset-bottom); }
}

/* main recebe padding extra para não ficar atrás do menu */
.app-main { padding-bottom: calc(var(--safe-bottom, 0px) + var(--app-bottom-nav-height) + 8px); }

/* mobile nav seguro */
nav.fixed.bottom-0, .mobile-nav {
  position: fixed !important;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(var(--app-bottom-nav-height) + var(--safe-bottom, 0px));
  padding-bottom: var(--safe-bottom, 0px);
  z-index: 60; /* sempre acima do conteúdo */
}

nav.fixed.bottom-0 a { padding-top: 12px; padding-bottom: calc(8px + var(--safe-bottom, 0px)); }

/* vídeos: garantimos que não fiquem atrás do menu */
.player-container video { max-height: calc(100vh - (var(--app-bottom-nav-height) + 140px)); height: auto; }

/* imagens responsivas */
img { max-width: 100%; height: auto; }

/* modais: limitar altura e permitir scroll interno */
.fixed.inset-0 > div, .fixed.inset-0 .max-w-2xl {
  max-height: calc(100vh - 96px);
  overflow: auto;
}

/* suaviza scrolls horizontais para mobile */
.overflow-x-auto { -webkit-overflow-scrolling: touch; scroll-padding: 1rem; }

a, button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }

/* margens para modais */
.fixed[role="dialog"] .max-w-2xl, .fixed[role="dialog"] > div { margin: 1rem; }
/* LAYOUT-FIX-TOOL: END */

CSS
  fi
else
  echo "Pulei LAYOUT-FIX-TOOL: $APP_CSS não existe."
fi

############################
# 2) Adicionar classe mobile-nav ao nav móvel em +layout.svelte
############################
LAYOUT="src/routes/+layout.svelte"
if [ -f "$LAYOUT" ]; then
  echo "Adicionando 'mobile-nav' ao nav móvel (se aplicável) em $LAYOUT..."
  # adiciona mobile-nav na primeira ocorrência de nav com 'fixed' e 'bottom-0'
  perl -0777 -pe 's/(<nav\s+class="([^"]*?\bfixed\b[^"]*?\bbottom-0\b[^"]*)")/$1 =~ /mobile-nav/ ? $& : $1 . " mobile-nav"/ge' -i "$LAYOUT"
  echo "Pronto."
else
  echo "Pulei adição mobile-nav: $LAYOUT não existe."
fi

############################
# 3) Melhorias no catálogo: editar src/routes/catalogo/+page.svelte
############################
CATALOG="src/routes/catalogo/+page.svelte"
if [ -f "$CATALOG" ]; then
  echo "Modificando catálogo: adicionando busca e adaptando agrupamento..."

  # 3A: inserir variáveis searchQuery e filteredCatalogo logo após a declaração de catalogo
  # procura a linha 'let catalogo: CatalogoItem[] = [];' e insere o bloco abaixo somente se searchQuery não existir
  if ! grep -q "let searchQuery" "$CATALOG"; then
    perl -0777 -pe 's/(let\s+catalogo:\s*CatalogoItem\[\]\s*=\s*\[\s*\]\s*;)/$1\n\n\/\/ Busca simples para mobile\nlet searchQuery = \x27\x27;\n\n\/\/ filtra o catálogo antes de agrupar por gênero\n$: filteredCatalogo = catalogo.filter((item) => {\n\tif (!searchQuery) return true;\n\tconst q = searchQuery.toLowerCase();\n\treturn (\n\t\t(item.nome && item.nome.toLowerCase().includes(q)) ||\n\t\t(item.genero && item.genero.toLowerCase().includes(q)) ||\n\t\t(item.nomeReal && item.nomeReal.toLowerCase().includes(q))\n\t);\n});/s' -i "$CATALOG"
    echo "Inserido searchQuery + filteredCatalogo."
  else
    echo "searchQuery já presente — pulando inserção."
  fi

  # 3B: substituir o bloco que reduz catalogo por género para usar filteredCatalogo
  if grep -q "\$: catalogoPorGenero = catalogo.reduce" "$CATALOG"; then
    perl -0777 -pe 's/\$:\s*catalogoPorGenero\s*=\s*catalogo\.reduce\(\s*\(acc,\s*item\)\s*=>\s*{.*?}\s*,\s*{}\s*as\s*Record<string,\s*CatalogoItem\[\]>\s*\)\s*;/\$: catalogoPorGenero = (filteredCatalogo || []).reduce((acc, item) => {\n\tconst generos = item.genero ? item.genero.split(\x27,\x27).map(g => g.trim()) : [\x27Outros\x27];\n\tconst generoPrincipal = generos[0];\n\tif (!acc[generoPrincipal]) acc[generoPrincipal] = [];\n\tacc[generoPrincipal].push(item);\n\treturn acc;\n}, {} as Record<string, CatalogoItem[]>);/s' -i "$CATALOG"
    echo "Atualizado agrupamento para usar filteredCatalogo."
  else
    echo "Pulo substituição do agrupamento — padrão não encontrado ou já atualizado."
  fi

  # 3C: inserir campo de busca no topo (após o bloco header .mb-8)
  if ! grep -q "placeholder=\"Pesquisar por nome, gênero ou título" "$CATALOG"; then
    # Substitui a primeira ocorrência do bloco de header que contém <div class="mb-8"> ... </div>
    perl -0777 -pe 's#(<div\s+class="mb-8">.*?</div>)# $1\n\n<div class="mb-6 flex w-full max-w-7xl items-center gap-3">\n  <input\n    class="w-full rounded-lg border border-on-subtle/30 bg-background/60 px-4 py-3 text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"\n    type="search"\n    placeholder="Pesquisar por nome, gênero ou título..."\n    bind:value={searchQuery}\n  />\n  <button\n    class="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-on-subtle/10 active:scale-95"\n    on:click={() => (searchQuery = \'\')}\n    aria-label="Limpar busca"\n  >\n    Limpar\n  </button>\n</div>\n\n#s' -i "$CATALOG"
    echo "Campo de busca inserido (UI)."
  else
    echo "Campo de busca já presente — pulando."
  fi

  # 3D: adicionar classe catalog-shelf ao container da prateleira (substitui a primeira ocorrência)
  if ! grep -q "class=\"[^\"]*catalog-shelf" "$CATALOG"; then
    perl -0777 -pe 's#(<div\s+class=")(relative\s+overflow-hidden\s+rounded-xl\s+border\s+border-on-subtle/20\s+bg-gradient-to-b\s+from-surface/30\s+to-background/30\s+p-6\s+backdrop-blur-sm)(")#${1}catalog-shelf $2$3#s' -i "$CATALOG" || true
    echo "Tentativa de adicionar classe 'catalog-shelf' ao container da prateleira (verifique manualmente se não encontrada automaticamente)."
  else
    echo "catalog-shelf já presente — pulando."
  fi

else
  echo "Pulei mudanças no catálogo: $CATALOG não existe."
fi

############################
# 4) Adicionar CSS para catálogo em grade no mobile (append se não existir)
############################
if [ -f "$APP_CSS" ]; then
  if ! grep -q "CATALOGO-FIX: tornar prateleira mais amigável" "$APP_CSS"; then
    echo "Adicionando CSS de catálogo (mobile grid) em $APP_CSS..."
    cat >> "$APP_CSS" <<'CSS'

/* CATALOGO-FIX: tornar prateleira mais amigável no mobile */
.catalog-shelf .overflow-x-auto {
  display: flex;
  gap: 1rem;
}

/* mobile: grade 2 colunas */
@media (max-width: 768px) {
  .catalog-shelf .overflow-x-auto {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    overflow-x: visible;
    padding-bottom: 0;
  }

  /* cards se ajustam para ocupar a coluna */
  .catalog-shelf .group.relative { width: 100% !important; }
  .catalog-shelf .w-44, .catalog-shelf .md\:w-52 { width: 100% !important; max-width: none !important; }
  .catalog-shelf img { height: auto; aspect-ratio: 2/3; object-fit: cover; }
  .catalog-shelf .space-y-1 { text-align: center; }
}
CSS
  else
    echo "CSS de catálogo já presente — pulando adição."
  fi
fi

echo
echo "Tudo aplicado. Backups em: $BACKUP_DIR"
echo
echo "Próximos passos:"
echo "1) rode: pnpm run dev"
echo "2) teste no celular (ou emulador). Se o menu ainda ficar parcialmente coberto, aumente a variável --app-bottom-nav-height em src/app.css (por exemplo para 96px ou 104px)."
echo "Comando exemplo para aumentar para 96px:"
echo "  perl -0777 -pe 's/--app-bottom-nav-height:\\s*\\d+px/--app-bottom-nav-height: 96px/' -i src/app.css"
echo
echo "Se quiser reverter, restaure os arquivos do diretório $BACKUP_DIR (copie de volta para src/...)"
