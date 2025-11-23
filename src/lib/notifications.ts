import { LocalNotifications } from '@capacitor/local-notifications';
import type { Channel, Notification } from '@capacitor/local-notifications';

const CHANNEL_ID = 'downloads';
const CHANNEL_NAME = 'Downloads';

/**
 * Cria o canal de notificação para downloads, se ainda não existir.
 * No Android, as notificações precisam pertencer a um canal.
 */
async function createDownloadsChannel() {
	try {
		const channels = await LocalNotifications.listChannels();
		if (!channels.channels.some(c => c.id === CHANNEL_ID)) {
			await LocalNotifications.createChannel({
				id: CHANNEL_ID,
				name: CHANNEL_NAME,
				description: 'Notificações para downloads de mídia',
				importance: 3, // Importance level: 3 is 'default'.
				visibility: 1, // Public visibility.
			});
		}
	} catch (error) {
		console.error('Erro ao criar canal de notificação:', error);
	}
}

/**
 * Pede permissão ao usuário para enviar notificações.
 * @returns {Promise<boolean>} `true` se a permissão for concedida, `false` caso contrário.
 */
export async function requestNotificationPermission(): Promise<boolean> {
	try {
		const { display } = await LocalNotifications.requestPermissions();
		if (display === 'granted') {
			await createDownloadsChannel();
			return true;
		}
		return false;
	} catch (error) {
		console.error('Erro ao solicitar permissão de notificação:', error);
		return false;
	}
}

/**
 * Exibe ou atualiza uma notificação de progresso de download.
 *
 * @param {number} id - O ID numérico da notificação. Deve ser único por notificação.
 * @param {string} title - O título da notificação (ex: nome do episódio).
 * @param {number} progress - O progresso do download (0 a 100).
 */
export async function showDownloadProgressNotification(id: number, title: string, progress: number) {
	try {
		const notification: Notification = {
			id,
			title: `Baixando: ${title}`,
			body: `${progress}% concluído`,
			ongoing: true, // Impede que o usuário a deslize para fechar.
			autoCancel: false,
			channelId: CHANNEL_ID,
			// Ícones podem ser customizados aqui se existirem nos assets nativos.
			// smallIcon: 'ic_stat_download', 
			largeIcon: 'ic_launcher_foreground',
			// Adiciona a barra de progresso
			progressBar: {
				value: progress,
				max: 100,
				indeterminate: false
			}
		};
		await LocalNotifications.schedule({ notifications: [notification] });
	} catch (error) {
		console.error(`Erro ao exibir notificação de progresso para o ID ${id}:`, error);
	}
}

/**
 * Exibe uma notificação de conclusão de download.
 *
 * @param {number} id - O ID numérico da notificação a ser usada.
 * @param {string} title - O título do item baixado.
 * @param {boolean} success - Se o download foi bem-sucedido.
 */
export async function showDownloadCompleteNotification(id: number, title: string, success: boolean) {
	try {
		const notification: Notification = {
			id,
			title: success ? 'Download Concluído' : 'Falha no Download',
			body: success ? `"${title}" foi baixado com sucesso.` : `Ocorreu um erro ao baixar "${title}".`,
			ongoing: false,
			autoCancel: true,
			channelId: CHANNEL_ID,
		};
		await LocalNotifications.schedule({ notifications: [notification] });
	} catch (error) {
		console.error(`Erro ao exibir notificação de conclusão para o ID ${id}:`, error);
	}
}
