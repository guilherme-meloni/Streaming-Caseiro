/**
 * @file Gestão das configurações globais da aplicação.
 *
 * Este módulo centraliza as configurações que são utilizadas em várias partes
 * do frontend, como a URL do servidor backend.
 */

import { readable } from 'svelte/store';
import { PUBLIC_SERVER_URL } from '$env/static/public';

/**
 * @description
 * Store somente leitura (`readable`) que contém a URL base do servidor backend.
 *
 * @remarks
 * O valor é lido da variável de ambiente pública `PUBLIC_SERVER_URL`
 * (definida no arquivo `.env`) durante o processo de build da aplicação.
 * Isso garante que a URL do servidor seja configurada de forma segura e centralizada.
 *
 * @example
 * import { serverUrl } from '$lib/stores/settings';
 *
 * const url = get(serverUrl);
 * const apiUrl = `${url}/api/data`;
 */
export const serverUrl = readable<string>(PUBLIC_SERVER_URL || '');
