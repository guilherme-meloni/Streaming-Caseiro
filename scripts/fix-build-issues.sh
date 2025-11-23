#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TS=$(date +%s)
BACKUP_DIR="backup_build_fix_$TS"
mkdir -p "$BACKUP_DIR"

CSS_FILE="src/app.css"
SVELTE_CONTROL="src/routes/controle/+page.svelte"
SVELTE_PLAYER="src/routes/player/+page.svelte"

echo "Backup e attempt to fix build issues"
for f in "$CSS_FILE" "$SVELTE_CONTROL" "$SVELTE_PLAYER"; do
  if [ -f "$f" ]; then
    cp -a "$f" "$BACKUP_DIR/$(basename "$f")"
    echo "Backup: $f -> $BACKUP_DIR/$(basename "$f")"
  fi
done

# 1) Corrigir CSS: remover '}' excedentes por linha, e ao final fechar aberturas restantes.
if [ -f "$CSS_FILE" ]; then
  echo "Corrigindo $CSS_FILE (removendo } excedentes e fechando aberturas restantes)..."
  awk '
  BEGIN { depth = 0; lineno=0; }
  {
    lineno++;
    line = $0;
    # conta ocorrencias sem modificar linha (gsub retorna count e altera $0, por isso usamos copia)
    tmp = line;
    open = gsub(/\{/, "&", tmp);
    tmp2 = line;
    closec = gsub(/\}/, "&", tmp2);
    # se fecharia abaixo de zero, removemos somente o numero extra de "}" do começo da linha (left-to-right)
    if (depth - closec < 0) {
      need_remove = closec - depth;
      new = line;
      # remove need_remove primeiras ocorrencias de '}' na linha
      while (need_remove > 0) {
        if (sub(/\}/, "", new) == 0) break;
        need_remove--;
      }
      # reconta no new
      tmpa=new;
      oa = gsub(/\{/, "&", tmpa);
      tmpb=new;
      cb = gsub(/\}/, "&", tmpb);
      depth += oa - cb;
      print new > "'"$CSS_FILE"'.fixed.tmp";
    } else {
      depth += open - closec;
      print line > "'"$CSS_FILE"'.fixed.tmp";
    }
  }
  END {
    # se ainda há aberturas sem fechar, fecha-as ao final do arquivo
    while (depth > 0) { print "}" > "'"$CSS_FILE"'.fixed.tmp"; depth--; }
  }' "$CSS_FILE"

  # substituir arquivo por versão corrigida (somente se gerou)
  if [ -f "${CSS_FILE}.fixed.tmp" ]; then
    mv "${CSS_FILE}.fixed.tmp" "$CSS_FILE"
    echo "Arquivo $CSS_FILE processado. (backup em $BACKUP_DIR)"
  else
    echo "Nenhuma alteração gerada para $CSS_FILE"
  fi
else
  echo "Arquivo $CSS_FILE não encontrado — pulei correção CSS."
fi

# 2) Substituir tags não-void auto-fechadas como <div /> -> <div></div>
# aplica para div, section, article, header, footer, nav, main, p (evita elementos void como img,input)
echo "Corrigindo tags auto-fechadas de elementos não-void (ex: <div /> -> <div></div>)..."
FILES_TO_FIX=()
if [ -f "$SVELTE_CONTROL" ]; then FILES_TO_FIX+=("$SVELTE_CONTROL"); fi
if [ -f "$SVELTE_PLAYER" ]; then FILES_TO_FIX+=("$SVELTE_PLAYER"); fi

for f in "${FILES_TO_FIX[@]}"; do
  echo "Processando $f ..."
  # faz substituição segura para vários tipos
  perl -0777 -pe '
    s{<\s*(div|section|article|header|footer|nav|main|p)([^>/]*?)\s*/>}{"<". $1 . $2 . "></". $1 . ">"}gse;
  ' -i "$f"
done

# 3) Relatório simples: exibe linhas problemáticas recentes (primeiras 200 lins)
echo
echo "=== preview dos primeiros 200 linhas de $CSS_FILE ==="
sed -n '1,200p' "$CSS_FILE" || true
echo
echo "=== encontrou <div /> (depois da correção) nos arquivos listados? ==="
for f in "${FILES_TO_FIX[@]}"; do
  echo "-> $f"
  grep -n "<div\s*/>" "$f" || echo "  ok: não encontrado"
done

echo
echo "Correções automáticas concluídas (backups em $BACKUP_DIR)."
echo "Agora rode: pnpm run build"
echo "Se o build ainda falhar, cole aqui o novo erro (faça copy/paste)."
