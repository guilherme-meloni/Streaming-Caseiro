/**
 * @file Implementação alternativa e possivelmente obsoleta de um gerenciador de downloads.
 *
 * @deprecated Este arquivo parece ser uma versão antiga ou alternativa da lógica de download.
 *
 * @remarks
 * A implementação principal e atualmente em uso para downloads está em `src/lib/downloadManager.ts`,
 * que utiliza o plugin `@capacitor/file-transfer`.
 * Este arquivo utiliza um plugin `CapacitorHttp` não-padrão e não deve ser usado
 * para novos desenvolvimentos sem uma análise aprofundada de sua origem e propósito.
 * Foi mantido e documentado para fins de referência histórica.
 */

import { writable, get } from 'svelte/store';
import { Capacitor } from '@capacitor/core';
import type { DownloadItem } from './downloads';
import { downloads, addDownload, updateDownloadProgress, completeDownload } from './downloads';

let HTTP: any;
let Filesystem: any;
let Directory: any;

/**
 * Inicializa dinamicamente os plugins do Capacitor necessários para esta implementação.
 * @private
 */
async function initPlugins() {
    if (Capacitor.isNativePlatform()) {
        HTTP = (window as any).Capacitor.Plugins.CapacitorHttp;
        Filesystem = (window as any).Capacitor.Plugins.Filesystem;
        Directory = Filesystem.Directory;
    }
}

initPlugins();

/**
 * Tenta baixar um vídeo usando o plugin `CapacitorHttp`.
 *
 * @deprecated Prefira usar a função `startDownload` de `src/lib/downloadManager.ts`.
 *
 * @param {string} url - A URL do vídeo a ser baixado.
 * @param {string} showName - O nome da série.
 * @param {string} episodeName - O nome do episódio.
 * @param {string | null} posterUrl - A URL do pôster.
 * @throws {Error} Lança um erro se os plugins não estiverem disponíveis ou se o download falhar.
 */
export async function downloadVideo(
    url: string,
    showName: string,
    episodeName: string,
    posterUrl: string | null
) {
    if (!HTTP || !Filesystem) {
        throw new Error('Plugins (CapacitorHttp, Filesystem) não disponíveis para esta função.');
    }

    const downloadId = addDownload(showName, episodeName, posterUrl, url);
    
    try {
        const fileName = `${showName}-${episodeName}.mp4`.replace(/[^a-z0-un]/gi, '_');
        console.log('[DOWNLOAD-DEPRECATED] Iniciando:', fileName);
        
        const response = await HTTP.downloadFile({
            url,
            filePath: fileName,
            fileDirectory: Directory.Documents,
        });

        if (response.path) {
            completeDownload(downloadId, response.path);
            console.log('[DOWNLOAD-DEPRECATED] Completo:', fileName);
            showDownloadComplete(showName, episodeName);
        } else {
            throw new Error('O caminho do arquivo não foi retornado na resposta do download.');
        }
    } catch (error) {
        console.error('[DOWNLOAD-DEPRECATED] Erro:', error);
        // Atualiza o status do item na store para 'error'.
        downloads.update(items =>
            items.map(item =>
                item.id === downloadId ? { ...item, status: 'error' as const } : item
            )
        );
        throw error;
    }
}

/**
 * Exibe uma notificação Toast nativa para informar a conclusão do download.
 * @param {string} showName - O nome da série.
 * @param {string} episodeName - O nome do episódio.
 * @private
 */
function showDownloadComplete(showName: string, episodeName: string) {
    if ((window as any).Capacitor?.Plugins?.Toast) {
        (window as any).Capacitor.Plugins.Toast.show({
            text: `Download completo: ${showName} - ${episodeName}`,
            duration: 'long'
        });
    }
}