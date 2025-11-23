// ESTA ALTERAÇÃO É VISUAL
import { writable } from 'svelte/store';

export type UiHealth = 'online' | 'offline' | 'checking';

// ESTA ALTERAÇÃO É VISUAL
// Store para manter o estado de saúde da UI.
export const uiHealth = writable<UiHealth>('checking');

// ESTA ALTERAÇÃO É VISUAL
// Função de timeout para a requisição de health check.
function timeout(ms: number, promise: Promise<Response>): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms} ms`));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
}

/**
 * // ESTA ALTERAÇÃO É VISUAL
 * Verifica o status do backend com um timeout de 2.5s.
 * Atualiza o store `uiHealth` para 'online' ou 'offline'.
 * Este é um mecanismo puramente visual e não afeta a lógica principal da aplicação.
 */
export async function checkBackendStatus() {
  uiHealth.set('checking');
  try {
    // Tenta fazer fetch em um endpoint que deve existir ou na raiz.
    // O timeout de 2.5s previne longas esperas.
    const response = await timeout(2500, fetch('/api/watchlist', { method: 'HEAD', cache: 'no-cache' }));

    if (response.ok) {
      uiHealth.set('online');
    } else {
      uiHealth.set('offline');
    }
  } catch (error) {
    // Se o fetch falhar (rede, timeout, etc.), consideramos offline para a UI.
    uiHealth.set('offline');
    console.info('UI health check determined status: OFFLINE');
  }
}
