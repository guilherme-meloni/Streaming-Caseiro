#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TS=$(date +%s)
BACKUP_NOW="backup_restore_before_revert_$TS"
mkdir -p "$BACKUP_NOW"

echo "1) Salvando cópias atuais (por segurança) em: $BACKUP_NOW"
FILES_TO_SAVE=(
  "src/app.css"
  "src/routes/+layout.svelte"
  "src/routes/catalogo/+page.svelte"
  "src/routes/player/+page.svelte"
  "src/routes/controle/+page.svelte"
)
for f in "${FILES_TO_SAVE[@]}"; do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP_NOW/$(basename "$f").current"
    echo "  - backed up $f -> $BACKUP_NOW/$(basename "$f").current"
  fi
done

# 2) localizar o backup mais antigo que contenha app.css
echo
echo "2) Procurando o backup mais antigo que contenha app.css..."
restore_dir=""
# list only directories named backup_* in current dir
for d in $(ls -1d backup_* 2>/dev/null | sort -n); do
  if [ -f "$d/app.css" ]; then
    restore_dir="$d"
    break
  fi
done

if [ -z "$restore_dir" ]; then
  echo "Nenhum backup contendo app.css encontrado em backup_*. Tentando outros backups..."
  for d in $(ls -1d backup_* 2>/dev/null | sort -n); do
    # check other names inside (some scripts used different filenames)
    if ls "$d"/*.css 1>/dev/null 2>&1 || ls "$d"/*app.css 1>/dev/null 2>&1; then
      restore_dir="$d"
      break
    fi
  done
fi

if [ -z "$restore_dir" ]; then
  echo "ERRO: nenhum backup encontrado (backup_* não contém app.css). Cancelo para não sobrescrever nada."
  echo "Verifique manualmente a pasta. Lista de backups disponíveis:"
  ls -1d backup_* 2>/dev/null || echo "(não há backups)"
  exit 1
fi

echo "-> restore_dir escolhida: $restore_dir"

# 3) restaurar arquivos se presentes no backup selecionado
echo
echo "3) Restaurando arquivos a partir de $restore_dir ..."
RESTORED=()
if [ -f "$restore_dir/app.css" ]; then
  cp -a "$restore_dir/app.css" "src/app.css"
  RESTORED+=("src/app.css")
  echo "  - restaurado src/app.css"
fi

# some backups used different basenames (e.g. app.css, +layout.svelte, page.svelte)
# restore any of the target files if present in the backup
for name in "+layout.svelte" "catalogo/+page.svelte" "player/+page.svelte" "controle/+page.svelte"; do
  srcpath="$restore_dir/$(basename "$name")"
  # try full path inside backup (some backups have basename different)
  if [ -f "$restore_dir/$(basename "$name")" ]; then
    tgt="src/routes/$(basename "$name")"
    # decide mapping: if basename is +layout.svelte -> restore to src/routes/+layout.svelte
    if [ "$(basename "$name")" = "+layout.svelte" ]; then
      cp -a "$restore_dir/+layout.svelte" "src/routes/+layout.svelte"
      RESTORED+=("src/routes/+layout.svelte")
      echo "  - restaurado src/routes/+layout.svelte"
    fi
  fi
done

# also attempt to restore player/controle/catalogo page backups by exact names in the backup dir
for b in "+page.svelte" "page.svelte"; do
  # try to find files inside backup dir with these basenames and map by folder names
  find "$restore_dir" -type f -name "$b" | while read -r file; do
    # determine if file path contains 'catalogo', 'player', 'controle' to map correctly
    if echo "$file" | grep -q "catalogo"; then
      cp -a "$file" "src/routes/catalogo/+page.svelte"
      RESTORED+=("src/routes/catalogo/+page.svelte")
      echo "  - restaurado src/routes/catalogo/+page.svelte (from $file)"
    elif echo "$file" | grep -q "player"; then
      cp -a "$file" "src/routes/player/+page.svelte"
      RESTORED+=("src/routes/player/+page.svelte")
      echo "  - restaurado src/routes/player/+page.svelte (from $file)"
    elif echo "$file" | grep -q "controle"; then
      cp -a "$file" "src/routes/controle/+page.svelte"
      RESTORED+=("src/routes/controle/+page.svelte (from $file)")
      echo "  - restaurado src/routes/controle/+page.svelte (from $file)"
    fi
  done
done

# 4) se nenhum dos arquivos foi restaurado via heurística, tente restaurar genericamente os arquivos esperados por nome
if [ "${#RESTORED[@]}" -eq 0 ]; then
  echo "Nenhum dos arquivos alvo foi encontrado com heurística. Verificando arquivos diretamente por nome no backup..."
  for f in "app.css" "+layout.svelte" "+page.svelte"; do
    if [ -f "$restore_dir/$f" ]; then
      case "$f" in
        app.css) cp -a "$restore_dir/$f" "src/app.css" && RESTORED+=("src/app.css"); echo "  - restaurado src/app.css" ;;
        +layout.svelte) cp -a "$restore_dir/$f" "src/routes/+layout.svelte" && RESTORED+=("src/routes/+layout.svelte"); echo "  - restaurado src/routes/+layout.svelte" ;;
      esac
    fi
  done
fi

# 5) cleanup: remove any custom marker blocks if accidentally remaining (safe removal between markers)
echo
echo "4) Limpando blocos inseridos (se existirem) de src/app.css (remover entre marcadores conhecidos)..."
if [ -f "src/app.css" ]; then
  awk '
  BEGIN {rec=0}
  {
    if ($0 ~ /\/\* LAYOUT-FIX-TOOL: START \*\//) { rec=1; next }
    if ($0 ~ /\/\* LAYOUT-FIX-TOOL: END \*\//) { rec=0; next }
    if ($0 ~ /\/\* LAYOUT-FIX-TUNE: START \*\//) { rec=1; next }
    if ($0 ~ /\/\* LAYOUT-FIX-TUNE: END \*\//) { rec=0; next }
    if ($0 ~ /\/\* CATALOGO-FIX: tornar prateleira mais amigável/) { rec=1; next }
    if ($0 ~ /HOTFIX-CSS: END/) { rec=0; next }
    if (!rec) print $0
  }' src/app.css > src/app.css.cleaned.tmp && mv src/app.css.cleaned.tmp src/app.css && echo "  - blocos removidos (se existiam)"
else
  echo "  - src/app.css não existe após restauração, pulei limpeza."
fi

# 6) report and run build
echo
echo "Arquivos restaurados: ${RESTORED[*]:-none}"
echo "Arquivos atuais (quick view):"
for f in "src/app.css" "src/routes/+layout.svelte"; do
  if [ -f "$f" ]; then
    echo "---- $f (first 30 lines) ----"
    sed -n '1,30p' "$f"
    echo "-----------------------------"
  fi
done

echo
echo "5) Executando build (pnpm run build)..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm run build
else
  echo "pnpm não encontrado no PATH. Rode 'pnpm run build' manualmente."
fi

echo
echo "Restauração concluída. Se algo ainda falhar, cole o log do build aqui."
