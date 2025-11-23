/**
 * @file Gerencia a lista de favoritos do usuário.
 *
 * Este módulo é responsável por manter uma lista de séries e filmes favoritos,
 * persistindo essa lista no `localStorage` para que as preferências do usuário
 * sejam mantidas entre as sessões.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @interface FavoriteItem
 * @description Define a estrutura de um item na lista de favoritos.
 * Contém informações mínimas para exibir o item na lista de favoritos.
 * @property {string} code - O identificador único da série/filme.
 * @property {string} name - O nome para exibição.
 * @property {string} poster - A URL do pôster.
 */
interface FavoriteItem {
    code: string;
    name: string;
    poster: string;
}

/**
 * @description
 * Store Svelte reativa que contém um array com os itens favoritos do usuário.
 */
export const favorites = writable<FavoriteItem[]>([]);

/**
 * Carrega (reidrata) a lista de favoritos a partir do `localStorage`.
 * Esta função é chamada na inicialização do módulo para popular a store.
 *
 * @remarks O nome `fetch` pode ser um pouco enganoso; a função opera localmente.
 */
export function fetchFavorites() {
    if (browser) {
        const storedFavorites = localStorage.getItem('user_favorites');
        if (storedFavorites) {
            try {
                favorites.set(JSON.parse(storedFavorites));
            } catch (e) {
                console.error("Falha ao analisar os favoritos salvos:", e);
                localStorage.removeItem('user_favorites');
            }
        }
    }
}

/**
 * Adiciona um novo item à lista de favoritos.
 * A função previne a adição de duplicatas e salva a lista atualizada no `localStorage`.
 *
 * @param item - Um objeto com as informações do item a ser adicionado.
 * @returns {Promise<boolean>} Retorna `true` se a operação foi bem-sucedida no navegador.
 * @fires alert - Dispara um alerta para o usuário sobre o sucesso ou falha da operação.
 */
export async function addToFavorites(item: { code: string; nome: string; poster: string; }) {
    if (!browser) return false;

    const favoriteItem: FavoriteItem = {
        code: item.code,
        name: item.nome,
        poster: item.poster,
    };

    favorites.update(items => {
        // Previne a adição de itens duplicados.
        if (items.some(fav => fav.code === favoriteItem.code)) {
            alert(`"${favoriteItem.name}" já está na sua lista de favoritos.`);
            return items;
        }
        
        alert(`"${favoriteItem.name}" adicionado aos favoritos!`);
        const updatedItems = [...items, favoriteItem];
        
        // Salva a lista atualizada imediatamente no localStorage.
        localStorage.setItem('user_favorites', JSON.stringify(updatedItems));
        return updatedItems;
    });
    return true;
}

/**
 * Remove um item da lista de favoritos usando seu código único.
 * Salva a lista atualizada no `localStorage` após a remoção.
 *
 * @param {string} itemCode - O código do item a ser removido.
 * @returns {Promise<boolean>} Retorna `true` se a operação foi bem-sucedida no navegador.
 */
export async function removeFromFavorites(itemCode: string) {
    if (!browser) return false;

    favorites.update(items => {
        const updatedItems = items.filter(item => item.code !== itemCode);
        
        // Salva a lista atualizada imediatamente no localStorage.
        localStorage.setItem('user_favorites', JSON.stringify(updatedItems));
        return updatedItems;
    });
    return true;
}

// Carrega os favoritos do localStorage assim que o módulo é importado pela primeira vez.
fetchFavorites();