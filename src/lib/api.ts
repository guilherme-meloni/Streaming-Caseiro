// src/lib/api.ts
import { get } from 'svelte/store';
import { serverUrl } from '$lib/stores/settings';

/**
 * @typedef {object} ProgressData
 * @property {number} currentTime - O tempo de reprodução atual em segundos.
 * @property {number} duration - A duração total da mídia em segundos.
 * @property {number} updatedAt - O timestamp de quando o progresso foi salvo.
 */

/**
 * @typedef {({ok: true, progress: ProgressData | null} | {ok: false, error: string})} ProgressResp
 */

/**
 * Verifica se um caminho de arquivo é absoluto.
 * @param p - O caminho do arquivo.
 * @returns {boolean} - True se o caminho for absoluto.
 * @private
 */
function isAbsolutePath(p: string) {
  // Trata caminhos como /home/..., C:\... e //host/...
  return /^([A-Za-z]:\\|\/{1,2}|\/home\/|\/mnt\/|\/media\/)/.test(p);
}

/**
 * Realiza uma requisição `fetch` para a API do servidor, adicionando automaticamente
 * a URL base do servidor e os cabeçalhos padrão.
 * Lida com erros de HTTP, transformando-os em exceções (`Error`).
 *
 * @template T - O tipo de dado esperado na resposta.
 * @param {string} path - O caminho do endpoint da API (ex: '/api/progress').
 * @param {RequestInit} [init] - Opções adicionais para a requisição `fetch`.
 * @returns {Promise<T>} Uma promessa que resolve para os dados da resposta.
 * @throws {Error} - Lança um erro se a URL do servidor não estiver configurada ou se a resposta da rede não for 'ok'.
 */
export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const base = get(serverUrl);
  if (!base) throw new Error('A URL do servidor não está configurada.');

  const url = path.startsWith('http') ? path : `${base}${path}`;

  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!resp.ok) {
    let errorText = await resp.text().catch(() => `HTTP ${resp.status}`);
    try {
      // Tenta extrair uma mensagem de erro do JSON, se houver.
      const jsonError = JSON.parse(errorText);
      throw new Error(jsonError?.error || `Erro HTTP ${resp.status}`);
    } catch {
      // Se não for JSON, usa o texto do erro ou o status.
      throw new Error(errorText || `Erro HTTP ${resp.status}`);
    }
  }

  // Tenta decodificar a resposta como JSON. Se falhar, retorna como texto puro.
  // Útil para endpoints que podem retornar tipos de conteúdo diferentes.
  const responseText = await resp.text();
  try {
    return JSON.parse(responseText) as T;
  } catch {
    return responseText as unknown as T;
  }
}

/**
 * Busca o progresso de reprodução de uma mídia no servidor.
 *
 * @param {string} filePathOrRelative - O caminho do arquivo, que pode ser absoluto (ex: '/media/shows/ep1.mp4') ou relativo à pasta de mídia (ex: 'shows/ep1.mp4').
 * @returns {Promise<number>} Uma promessa que resolve para o tempo de reprodução salvo em segundos. Retorna 0 se não houver progresso.
 */
export async function getProgress(filePathOrRelative: string): Promise<number> {
  const q = isAbsolutePath(filePathOrRelative)
    ? `?filePath=${encodeURIComponent(filePathOrRelative)}`
    : `?relativePath=${encodeURIComponent(filePathOrRelative)}`;

  const data = await apiFetch<ProgressResp>(`/api/progress${q}`);
  if (data.ok && data.progress) {
    return data.progress.currentTime || 0;
  }
  return 0;
}

/**
 * Salva o progresso de reprodução de uma mídia no servidor.
 *
 * @param {string} filePathOrRelative - O caminho do arquivo (absoluto ou relativo).
 * @param {number} currentTime - O tempo de reprodução atual em segundos.
 * @param {number} duration - A duração total da mídia em segundos.
 * @returns {Promise<void>} Uma promessa que resolve quando o progresso é salvo.
 */
export async function updateProgress(filePathOrRelative: string, currentTime: number, duration: number): Promise<void> {
  const body = isAbsolutePath(filePathOrRelative)
    ? { filePath: filePathOrRelative, currentTime, duration }
    : { relativePath: filePathOrRelative, currentTime, duration };

  await apiFetch(`/api/progress`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * @typedef {object} AudioTrack
 * @property {number} index - O índice da faixa de áudio.
 * @property {string} [language] - O código do idioma da faixa (ex: 'eng', 'por').
 */

/**
 * @typedef {object} MediaMetadata
 * @property {AudioTrack[]} audioTracks - Uma lista de faixas de áudio disponíveis.
 */

/**
 * Busca metadados de uma mídia, como faixas de áudio e legendas disponíveis.
 *
 * @param {string} mediaPath - O caminho da mídia relativo à pasta principal de mídias do servidor.
 * @returns {Promise<MediaMetadata>} Uma promessa que resolve com os metadados da mídia.
 */
export async function getMediaMetadata(mediaPath: string): Promise<MediaMetadata> {
  const q = `?path=${encodeURIComponent(mediaPath)}`;
  const data = await apiFetch<MediaMetadata>(`/api/media/metadata${q}`);
  return data;
}
