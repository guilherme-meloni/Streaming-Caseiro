/**
 * @file Gerencia o histórico de visualização do usuário.
 *
 * Este módulo rastreia o progresso de cada filme ou episódio que o usuário assistiu,
 * persistindo esses dados no `localStorage` para que o estado seja mantido
 * entre as sessões.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @interface WatchedEpisode
 * @description Representa o estado de visualização de um único item de mídia.
 * @property {string} code - Identificador único para o episódio ou filme.
 * @property {number} watchedAt - Timestamp da última vez que foi assistido.
 * @property {number} progress - Progresso da visualização (de 0.0 a 1.0).
 * @property {number} duration - Duração total do item em segundos.
 * @property {boolean} isComplete - `true` se o item foi assistido até o final (considerado >90%).
 */
interface WatchedEpisode {
    code: string;
    watchedAt: number;
    progress: number;
    duration: number;
    isComplete: boolean;
}

// A store principal é um Map para acesso rápido e eficiente aos itens pelo seu código.
const initialWatchHistory = new Map<string, WatchedEpisode>();

// Bloco de inicialização que executa apenas no navegador.
if (browser) {
    const storedHistory = localStorage.getItem('user_watch_history');
    if (storedHistory) {
        try {
            // Converte o objeto JSON salvo de volta para um Map.
            const parsedHistory = JSON.parse(storedHistory);
            for (const key in parsedHistory) {
                initialWatchHistory.set(key, parsedHistory[key]);
            }
        } catch (e) {
            console.error("Falha ao analisar o histórico de visualização salvo:", e);
            // Se os dados estiverem corrompidos, remove a entrada inválida.
            localStorage.removeItem('user_watch_history');
        }
    }
}

/**
 * @description
 * Store Svelte reativa que contém o histórico de visualização do usuário.
 * É um `Map` onde a chave é o `episodeCode` e o valor é o objeto `WatchedEpisode`.
 */
export const watchHistory = writable(initialWatchHistory);

// Inscreve-se a qualquer mudança na store para persistir os dados no localStorage.
watchHistory.subscribe(currentHistory => {
    if (browser) {
        // Converte o Map para um objeto simples, que é serializável em JSON.
        const serializableHistory = Object.fromEntries(currentHistory);
        localStorage.setItem('user_watch_history', JSON.stringify(serializableHistory));
    }
});

/**
 * Adiciona ou atualiza o progresso de um episódio no histórico.
 *
 * @param {string} episodeCode - O código único do item de mídia.
 * @param {number} currentTime - O tempo de reprodução atual em segundos.
 * @param {number} duration - A duração total do item em segundos.
 */
export function updateWatchProgress(episodeCode: string, currentTime: number, duration: number) {
    if (!browser || !episodeCode || !duration) return;

    const progress = currentTime / duration;
    // Considera "completo" se o usuário assistiu a 90% ou mais.
    const isComplete = progress >= 0.9;

    watchHistory.update(history => {
        history.set(episodeCode, {
            code: episodeCode,
            watchedAt: Date.now(),
            progress: parseFloat(progress.toFixed(2)), // Arredonda para 2 casas decimais
            duration: parseFloat(duration.toFixed(2)),
            isComplete: isComplete,
        });
        return history; // Retorna o Map atualizado
    });
}

/**
 * Obtém os dados de progresso para um episódio específico.
 *
 * @param {string} episodeCode - O código do item de mídia.
 * @returns {WatchedEpisode | undefined} O objeto de progresso, ou `undefined` se não houver histórico para este item.
 */
export function getEpisodeProgress(episodeCode: string): WatchedEpisode | undefined {
    return get(watchHistory).get(episodeCode);
}
