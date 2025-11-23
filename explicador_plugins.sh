#!/bin/bash

# =================================================================
# Explicador de Plugins do Capacitor
#
# Use este script para obter uma explicação rápida sobre a função
# de cada plugin do Capacitor listado.
#
# Requer: fzf (https://github.com/junegunn/fzf)
# =================================================================

# Garante que o fzf está instalado
if ! command -v fzf &> /dev/null
then
    echo "Erro: O comando 'fzf' não foi encontrado."
    echo "Por favor, instale o fzf para executar este script: https://github.com/junegunn/fzf"
    exit 1
fi

# Define um array associativo com os plugins e suas descrições
declare -A PLUGINS

PLUGINS["@capacitor/action-sheet"]="Mostra um menu de opções nativo que desliza de baixo para cima (ex: menu de compartilhamento)."
PLUGINS["@capacitor/app-launcher"]="Permite que seu app verifique se outro aplicativo está instalado e o abra."
PLUGINS["@capacitor/app"]="Gerencia o estado geral do aplicativo (se está ativo, em segundo plano), lida com links de abertura (deep links) e controla o botão 'voltar' do Android."
PLUGINS["@capacitor/background-runner"]="Permite executar código JavaScript em segundo plano, mesmo com o app fechado, para tarefas periódicas como sincronização de dados."
PLUGINS["@capacitor/barcode-scanner"]="Usa a câmera do dispositivo para escanear códigos de barras e QR codes."
PLUGINS["@capacitor/browser"]="Abre links em um navegador interno (In-App Browser), mantendo o usuário dentro do seu aplicativo. Ideal para telas de login e notícias."
PLUGINS["@capacitor/camera"]="Permite que o aplicativo tire fotos com a câmera ou escolha imagens existentes da galeria do usuário."
PLUGINS["@capacitor/clipboard"]="Adiciona a funcionalidade de 'copiar e colar' (para texto, imagens, etc.) na área de transferência do sistema."
PLUGINS["CapacitorCookies"]="Melhora o gerenciamento de cookies, tratando-os no nível nativo para garantir que funcionem de forma mais confiável, especialmente em iOS."
PLUGINS["@capacitor/device"]="Fornece informações detalhadas sobre o dispositivo do usuário: modelo, versão do SO, nível da bateria, fabricante, ID único, etc."
PLUGINS["@capacitor/dialog"]="Permite exibir caixas de diálogo nativas do sistema, como alertas (alert), confirmações (confirm) e prompts para o usuário digitar algo."
PLUGINS["@capacitor/filesystem"]="Fornece uma API para trabalhar com o sistema de arquivos do dispositivo. Permite ler, escrever, deletar e gerenciar arquivos e pastas."

# Extrai os nomes dos plugins (as chaves do array) e os passa para o fzf
# O fzf mostra a lista e retorna o item selecionado pelo usuário
CHOSEN_PLUGIN=$(for plugin in "${!PLUGINS[@]}"; do echo "$plugin"; done | sort | fzf --height="50%" --layout=reverse --border --prompt="▶ Escolha um plugin para ver a descrição: " --header="Pressione CTRL+C para sair")

# Se o usuário escolheu um plugin (e não cancelou com ESC ou CTRL+C)
if [[ -n "$CHOSEN_PLUGIN" ]]; then
    # Limpa a tela para mostrar o resultado de forma limpa
    clear
    
    # Exibe a descrição do plugin selecionado
    echo -e "\033[1;34mPlugin:\033[0m \033[1m$CHOSEN_PLUGIN\033[0m"
    echo "-------------------------------------------------"
    echo -e "\033[1;32mFunção:\033[0m ${PLUGINS[$CHOSEN_PLUGIN]}"
    echo ""
fi
