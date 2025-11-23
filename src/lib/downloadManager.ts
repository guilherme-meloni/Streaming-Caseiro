import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileTransfer, type ProgressStatus } from '@capacitor/file-transfer';
import { addDownload, updateDownloadProgress, completeDownload } from './stores/downloads';
import type { DownloadItem } from './stores/downloads';
import type { ShowDetails, Episodio } from './types';

/**
 * Orquestra o download de um episódio de uma série.
 *
 * Esta função realiza os seguintes passos:
 * 1. Adiciona o item à store de downloads com status 'in_progress'.
 * 2. Obtém um URI local seguro no diretório de dados do aplicativo.
 * 3. Configura um listener global para monitorar o progresso do download.
 * 4. Inicia a transferência do arquivo usando o plugin `@capacitor/file-transfer`.
 * 5. Ao concluir, atualiza o status na store com o caminho local do arquivo.
 * 6. Limpa o listener de progresso.
 *
 * @param {string} serverUrl - A URL base do servidor de mídia.
 * @param {ShowDetails} show - O objeto contendo os detalhes da série.
 * @param {Episodio} episode - O objeto contendo os detalhes do episódio a ser baixado.
 */
export async function startDownload(
    serverUrl: string,
    show: ShowDetails,
    episode: Episodio
) {
    // 1. Monta a URL completa do arquivo no servidor e o caminho local para salvamento.
    const episodeUrl = `${serverUrl}/midia/${show.nomePasta}/${episode.arquivo}`;
    const fileName = episode.arquivo;
    // O caminho local inclui a pasta do show para manter a organização.
    const localPath = `${show.nomePasta}/${fileName}`;

    // 2. Adiciona o download à store global, obtendo um ID único para este download.
    // O estado inicial é 'in_progress' com progresso 0.
    const downloadId = addDownload(
        show.nomeReal,
        episode.titulo || episode.arquivo,
        show.poster || null,
        episodeUrl
    );

    try {
        // 3. Obtém um URI nativo para o caminho do arquivo local.
        // O `Directory.Data` é um local de armazenamento interno e persistente para o app.
        const { uri } = await Filesystem.getUri({
            directory: Directory.Data,
            path: localPath
        });

        // 4. Adiciona um listener de progresso.
        // Este listener é global para o plugin FileTransfer, por isso é crucial
        // verificar se o `info.id` corresponde ao `downloadId` do nosso download atual.
        const transfer = await (FileTransfer as any).addListener('progress', (info: any) => {
            if (info.id === downloadId) {
                const progress = Math.round((info.bytes / info.contentLength) * 100);
                updateDownloadProgress(downloadId, progress);
            }
        });

        // 5. Inicia o download.
        // O plugin irá baixar o arquivo da `source` e salvá-lo no `target` (o URI local).
        await (FileTransfer as any).download({
            source: episodeUrl,
            target: uri,
            id: downloadId // Passa o ID para que o listener de progresso possa identificá-lo.
        });

        // 6. Ao concluir, atualiza a store, marcando o download como 'completed'.
        completeDownload(downloadId, localPath);
        
        // 7. Remove o listener de progresso para evitar memory leaks.
        transfer.remove();
        console.log(`Download de ${fileName} concluído para ${localPath}`);

    } catch (error) {
        console.error(`Erro ao baixar ${fileName}:`, error);
        // TODO: Opcionalmente, atualizar o status do download para 'error' na store.
        // Ex: updateDownloadStatus(downloadId, 'error');
    }
}