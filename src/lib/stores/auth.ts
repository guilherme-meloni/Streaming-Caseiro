/**
 * @file Gerencia o estado de autenticação e a sessão do usuário.
 *
 * Este módulo cria uma store customizada do Svelte para lidar com o estado do usuário,
 * persistindo a sessão no `localStorage` para que o login seja mantido
 * entre as visitas à página.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @interface User
 * @description Define a estrutura do objeto de usuário autenticado.
 * @property {string} id - O ID único do usuário.
 * @property {string} username - O nome de usuário.
 */
export interface User {
    id: string;
    username: string;
}

/**
 * @interface AuthState
 * @description Define a estrutura do estado de autenticação.
 * @property {User | null} user - O objeto do usuário se estiver logado, ou `null` caso contrário.
 */
interface AuthState {
    user: User | null;
}

/**
 * Inicializa o estado de autenticação.
 * No lado do servidor, sempre retorna `null`. No navegador, tenta carregar
 * o usuário e o token do `localStorage` para restaurar a sessão.
 * @returns {AuthState} O estado de autenticação inicial.
 * @private
 */
function getInitialAuthState(): AuthState {
    if (!browser) {
        return { user: null };
    }

    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('sessionToken');

    if (userJson && token) {
        try {
            // Se houver um usuário e token, o estado é considerado logado.
            return { user: JSON.parse(userJson) };
        } catch {
            // Se o JSON do usuário estiver corrompido, reseta o estado.
            return { user: null };
        }
    }
    return { user: null };
}

/**
 * Store reativa que contém o estado de autenticação atual.
 */
const authStore = writable<AuthState>(getInitialAuthState());

/**
 * @description
 * Store customizada para gerenciamento de autenticação.
 *
 * Expõe os métodos `subscribe`, `set` e `get` de uma store Svelte,
 * além de métodos auxiliares para `login` and `logout`.
 */
export const auth = {
    /**
     * Permite que componentes Svelte se inscrevam a mudanças no estado de autenticação.
     * @param {Function} run - A função a ser executada quando o estado muda.
     * @returns {Function} Uma função para cancelar a inscrição.
     */
    subscribe: authStore.subscribe,

    /**
     * Define um novo estado de autenticação.
     * @param {AuthState} value - O novo estado.
     */
    set: authStore.set,

    /**
     * Realiza o login do usuário, atualizando a store e persistindo a sessão.
     * @param {User} user - O objeto do usuário que fez login.
     * @param {string} sessionToken - O token de sessão recebido do backend.
     */
    login: (user: User, sessionToken: string) => {
        if (browser) {
            console.log('[AUTH] Salvando usuário e token no localStorage');
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('sessionToken', sessionToken);
        }
        authStore.set({ user });
    },

    /**
     * Obtém o valor síncrono e atual da store de autenticação.
     * @returns {AuthState} O estado de autenticação atual.
     */
    get: () => get(authStore),

    /**
     * Realiza o logout do usuário, limpando a store e a sessão persistida.
     */
    logout: () => {
        if (browser) {
            console.log('[AUTH] Removendo usuário e token do localStorage');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
        }
        authStore.set({ user: null });
    }
};