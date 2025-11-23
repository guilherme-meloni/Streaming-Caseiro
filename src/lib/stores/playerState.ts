/**
 * @file Gerencia estados globais da UI relacionados ao player de vídeo.
 *
 * Este módulo fornece stores para controlar aspectos da interface do player
 * que precisam ser acessíveis em diferentes partes da aplicação.
 */

import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

const INTERACTION_KEY = 'userHasInteracted';

/**
 * Cria uma store Svelte (`writable`) que sincroniza seu estado automaticamente
 * com o `localStorage` do navegador.
 *
 * Ao ser criada, a store tenta ler o valor do `localStorage` usando a chave fornecida.
 * A cada atualização, o novo valor é salvo no `localStorage`.
 *
 * @template T - O tipo de dado que a store irá conter.
 * @param {string} key - A chave a ser usada para salvar o valor no `localStorage`.
 * @param {T} initialValue - O valor inicial a ser usado se nada for encontrado no `localStorage`.
 * @returns {Writable<T>} Uma store Svelte `writable` com persistência.
 * @private
 */
function createPersistentStore<T>(key: string, initialValue: T): Writable<T> {
	let initialData = initialValue;
	// Acessa o localStorage apenas no ambiente do navegador.
	if (browser) {
		const storedValue = window.localStorage.getItem(key);
		if (storedValue) {
			try {
				initialData = JSON.parse(storedValue);
			} catch {
				// Se o valor armazenado estiver corrompido, usa o valor inicial.
				initialData = initialValue;
			}
		}
	}

	const store = writable<T>(initialData);

	// Inscreve-se às mudanças da store para salvar no localStorage.
	store.subscribe((value) => {
		if (browser) {
			window.localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return store;
}

/**
 * @description
 * Store que rastreia se o usuário já interagiu com a página (ex: clicou ou tocou).
 *
 * @remarks
 * É crucial para a funcionalidade de autoplay de vídeos. Navegadores modernos
 * bloqueiam a reprodução de mídia com som até que o usuário realize uma ação na página.
 * Esta store permite que a UI (como o player de vídeo) saiba quando pode
 * tentar iniciar a reprodução com som.
 */
export const userHasInteracted = createPersistentStore<boolean>(INTERACTION_KEY, false);
