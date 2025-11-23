/**
 * @file Gerencia o estado de conectividade da aplicação (online/offline).
 *
 * Este módulo fornece uma store Svelte reativa que permite que os componentes
 * saibam em tempo real se a aplicação tem acesso à rede.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @description
 * Store reativa que indica se o navegador está online.
 *
 * - `true`: O navegador acredita ter uma conexão de rede.
 * - `false`: O navegador não tem uma conexão de rede.
 *
 * @remarks
 * A store é inicializada com o valor de `navigator.onLine`.
 * Ela é atualizada automaticamente ao escutar os eventos globais `online` e `offline`
 * do objeto `window`, garantindo que o estado de conectividade esteja sempre sincronizado.
 *
 * @example
 * import isOnline from '$lib/stores/onlineStatus';
 *
 * $: if ($isOnline) {
 *   console.log("Estamos online!");
 * } else {
 *   console.log("Conexão perdida.");
 * }
 */
const isOnline = writable<boolean>(browser ? navigator.onLine : true);

// Adiciona os listeners apenas no ambiente do navegador.
if (browser) {
  window.addEventListener('online', () => isOnline.set(true));
  window.addEventListener('offline', () => isOnline.set(false));
}

export default isOnline;
