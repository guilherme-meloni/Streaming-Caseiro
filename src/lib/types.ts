// --- NOVOS TIPOS PARA ÁUDIO E LEGENDA ---
export interface AudioTrack {
    index: number;
    language?: string;
}

export interface SubtitleTrack {
    index: number;
    language: string;
}

// --- Tipos para o Player Ao Vivo ---
export interface PlaylistItemMeta {
	poster?: string;
	nomeReal?: string;
	tituloEpisodio?: string;
	descricao?: string;
	ano?: number;
	genero?: string;
    // Adiciona as faixas aos metadados que o player recebe
    audioTracks?: AudioTrack[];
    subtitleTracks?: SubtitleTrack[];
}

export interface PlaylistItem {
	src: string;
	nome: string;
	tipo: 'desenho' | 'bumper' | 'entrada' | 'saida';
	duration: number;
	start?: number;
	meta?: PlaylistItemMeta;
}

export interface GradeUpdatePayload {
	grade: PlaylistItem[];
	currentItemIndex: number;
	itemStartTime: number;
	channelMode: string;
	availableChannels: { code: string; nome: string; totalEpisodios: number }[];
}

// --- Tipos para o Catálogo e VOD ---
export interface Episodio {
    arquivo: string;
    path: string;
    titulo?: string;
    sinopse?: string;
    thumbnail?: string;
    // Adiciona as faixas aqui também para o VOD
    audioTracks?: AudioTrack[];
    subtitleTracks?: SubtitleTrack[];
}

export interface Temporada {
    nome: string;
    episodios: Episodio[];
}

export interface ShowDetails {
    code: string;
    nomeReal: string;
    descricao: string;
    posterExists: boolean;
    nomePasta: string;
    ano: number;
    genero: string;
    temporadas: Temporada[];
}

// --- Tipos para a funcionalidade de Download ---
export interface DownloadedEpisode {
	id: string;
	showName: string;
	episodeName: string;
	posterUrl: string | null;
	localPath: string;
	status: 'downloading' | 'completed' | 'error';
	progress: number;
}

// Tipo para o catálogo principal
export interface CatalogoItem {
    code: string;
    nome: string;
    poster: string | null;
    genero: string;
    type?: 'show' | 'movie' | 'episode'; // Adicionado para distinguir tipos de conteúdo
    videoPath?: string; // Adicionado para VODs diretos
}
