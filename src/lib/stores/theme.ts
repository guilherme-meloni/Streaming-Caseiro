/**
 * @file Gerencia o tema visual da aplicação.
 *
 * Este módulo fornece uma store Svelte reativa para controlar o tema da UI,
 * persistindo a escolha do usuário no `localStorage`.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @typedef {'default' | 'nostalgia' | 'matrix'} Theme
 * @description Define os nomes dos temas visuais disponíveis na aplicação.
 */
type Theme = 'default' | 'nostalgia' | 'matrix';

/**
 * Determina o tema inicial a ser usado.
 * Se estiver no navegador, tenta carregar o tema salvo do `localStorage`.
 * Caso contrário, ou se nenhum tema estiver salvo, usa 'default'.
 * @private
 */
const initialTheme: Theme = browser 
    ? (localStorage.getItem('theme') as Theme) || 'default' 
    : 'default';

/**
 * @description
 * Store Svelte reativa que contém o nome do tema visual ativo.
 *
 * @remarks
 * A store é inicializada com o tema salvo no `localStorage` ou com 'default'.
 * Qualquer alteração na store (via `theme.set()` ou `theme.update()`) é
 * automaticamente salva no `localStorage`, garantindo que a preferência do
 * usuário persista entre as sessões.
 *
 * @example
 * import { theme } from '$lib/stores/theme';
 *
 * function switchToMatrixTheme() {
 *   theme.set('matrix');
 * }
 */
export const theme = writable<Theme>(initialTheme);

// Apenas no navegador, inscreve-se a mudanças na store para persistir o valor.
if (browser) {
    theme.subscribe((value) => {
        localStorage.setItem('theme', value);
    });
}
