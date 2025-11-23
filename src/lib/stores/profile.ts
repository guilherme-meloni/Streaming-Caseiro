/**
 * @file Gerencia os dados de perfil do usuário, como a foto de avatar.
 *
 * Este módulo fornece uma store para os dados do perfil do usuário e
 * persiste essas informações no `localStorage` do navegador.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * @interface UserProfile
 * @description Define a estrutura dos dados de perfil do usuário.
 * @property {string | null} profilePictureUrl - A URL da foto de perfil, armazenada como uma string Base64 (DataURL).
 */
interface UserProfile {
    profilePictureUrl: string | null;
}

/**
 * Define o estado inicial do perfil.
 * Se estiver no navegador, tenta carregar os dados salvos do `localStorage`.
 * @private
 */
const initialProfile: UserProfile = {
    profilePictureUrl: null,
};

// Bloco de inicialização que carrega o perfil do localStorage ao iniciar no navegador.
if (browser) {
    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) {
        try {
            const parsedProfile = JSON.parse(storedProfile);
            initialProfile.profilePictureUrl = parsedProfile.profilePictureUrl || null;
        } catch (e) {
            console.error("Falha ao analisar o perfil salvo:", e);
            localStorage.removeItem('user_profile');
        }
    }
}

/**
 * @description
 * Store Svelte reativa que contém os dados do perfil do usuário.
 *
 * @remarks
 * O conteúdo desta store é automaticamente salvo no `localStorage` sempre que
 * é alterado, garantindo a persistência da foto de perfil entre as sessões.
 */
export const profile = writable<UserProfile>(initialProfile);

// Inscreve-se a mudanças na store para salvar automaticamente no localStorage.
profile.subscribe(currentProfile => {
    if (browser) {
        localStorage.setItem('user_profile', JSON.stringify(currentProfile));
    }
});

/**
 * Atualiza a foto de perfil do usuário a partir de um arquivo de imagem.
 * A função lê o arquivo, converte-o para uma string Base64 (DataURL) e
 * atualiza a store do perfil.
 *
 * @param {File} file - O arquivo de imagem selecionado pelo usuário.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se a imagem
 * foi lida e atualizada com sucesso, ou `false` em caso de erro.
 */
export async function updateProfilePicture(file: File): Promise<boolean> {
    if (!browser) return false;

    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            profile.update(p => ({ ...p, profilePictureUrl: base64Image }));
            resolve(true);
        };

        reader.onerror = (e) => {
            console.error('Erro ao ler o arquivo de imagem:', e);
            alert('Erro ao processar a imagem.');
            resolve(false);
        };

        // Inicia a leitura do arquivo, que irá disparar 'onload' ou 'onerror'.
        reader.readAsDataURL(file);
    });
}
