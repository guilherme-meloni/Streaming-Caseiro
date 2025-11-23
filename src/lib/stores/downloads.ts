/**
 * @file Gerencia o estado de todos os downloads de mídia.
 *
 * Este módulo define a estrutura de um item de download, cria uma store Svelte
 * reativa para manter a lista de todos os downloads e fornece funções
 * auxiliares para adicionar, atualizar e remover itens dessa lista.
 *
 * @remarks
 * O estado dos downloads é mantido apenas em memória e **não** é persistido
 * no `localStorage`. Isso significa que a lista de downloads será perdida
 * se a página for recarregada. A persistência deve ser gerenciada externamente
 * se for um requisito.
 */

import { writable } from 'svelte/store';

/**
 * @interface DownloadItem
 * @description Define a estrutura de dados para um item na lista de downloads.
 * @property {string} id - ID único para o download, gerado via `crypto.randomUUID()`.
 * @property {string} showName - Nome da série ou filme.
 * @property {string} episodeName - Nome do episódio ou do arquivo.
 * @property {string | null} posterUrl - URL do pôster para exibição na UI.
 * @property {number} progress - Progresso do download, de 0 a 100.
 * @property {'downloading' | 'completed' | 'error' | 'paused'} status - O estado atual do download.
 * @property {string} [localPath] - O caminho para o arquivo salvo no dispositivo (disponível quando o status é 'completed').
 * @property {string} [originalUrl] - A URL de onde o arquivo foi baixado.
 */
export interface DownloadItem {
	id: string;
	showName: string;
	episodeName: string;
	posterUrl: string | null;
	progress: number;
	status: 'downloading' | 'completed' | 'error' | 'paused';
	localPath?: string;
	originalUrl?: string;
}

/**
 * @description
 * Store Svelte reativa que contém um array de todos os itens de download.
 * Componentes podem se inscrever a esta store para exibir e reagir a
 * mudanças no estado dos downloads.
 */
export const downloads = writable<DownloadItem[]>([]);

/**
 * Adiciona um novo item à lista de downloads com o status 'downloading'.
 *
 * @param {string} showName - Nome da série.
 * @param {string} episodeName - Nome do episódio.
 * @param {string | null} posterUrl - URL do pôster.
 * @param {string} originalUrl - URL de origem do download.
 * @returns {string} O ID único gerado para o novo item de download.
 */
export function addDownload(
    showName: string,
    episodeName: string,
    posterUrl: string | null,
    originalUrl: string
): string {
	const downloadItem: DownloadItem = {
		id: crypto.randomUUID(),
		showName,
		episodeName,
		posterUrl,
		progress: 0,
		status: 'downloading',
		originalUrl
	};
	
	downloads.update(items => [...items, downloadItem]);
	return downloadItem.id;
}

/**
 * Atualiza o progresso de um item de download específico.
 *
 * @param {string} id - O ID do download a ser atualizado.
 * @param {number} progress - O novo valor de progresso (0-100).
 */
export function updateDownloadProgress(id: string, progress: number) {
	downloads.update(items => 
		items.map(item => 
			item.id === id ? { ...item, progress } : item
		)
	);
}

/**
 * Marca um download como concluído.
 * Define o status como 'completed', o progresso como 100 e armazena o caminho local do arquivo.
 *
 * @param {string} id - O ID do download a ser finalizado.
 * @param {string} localPath - O caminho onde o arquivo foi salvo no dispositivo.
 */
export function completeDownload(id: string, localPath: string) {
	downloads.update(items => 
		items.map(item => 
			item.id === id 
				? { ...item, status: 'completed' as const, progress: 100, localPath }
				: item
		)
	);
}

/**
 * Remove um item da lista de downloads.
 *
 * @param {string} id - O ID do download a ser removido.
 */
export function removeDownload(id: string) {
	downloads.update(items => items.filter(item => item.id !== id));
}
