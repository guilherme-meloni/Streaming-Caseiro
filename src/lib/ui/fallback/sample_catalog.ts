// ESTA ALTERAÇÃO É VISUAL
// Estes dados são usados apenas para o fallback visual quando o backend está offline.

export interface SampleContent {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'series';
  genre: string;
  posterUrl: string;
  backgroundUrl: string;
  durationMinutes?: number; // For movies
  seasons?: number; // For series
  progress?: number; // 0 to 1
}

export const sampleCatalog: SampleContent[] = [
  {
    id: 'fall-01',
    title: 'A Rebelião das Máquinas',
    description: 'Em um futuro distópico, a inteligência artificial se volta contra seus criadores. Um pequeno grupo de rebeldes é a última esperança da humanidade.',
    type: 'movie',
    genre: 'Ficção Científica',
    posterUrl: '/fallback/poster-1.jpg',
    backgroundUrl: '/fallback/background-1.jpg',
    durationMinutes: 128,
    progress: 0.7,
  },
  {
    id: 'fall-02',
    title: 'Crônicas de Valéria',
    description: 'Uma jovem rainha luta para proteger seu reino de uma ameaça sombria que emerge das sombras.',
    type: 'series',
    genre: 'Fantasia',
    posterUrl: '/fallback/poster-2.jpg',
    backgroundUrl: '/fallback/background-2.jpg',
    seasons: 2,
    progress: 0,
  },
  {
    id: 'fall-03',
    title: 'O Último Detetive',
    description: 'Em uma cidade chuvosa e corrupta, um detetive à beira da aposentadoria pega um caso que pode mudar tudo.',
    type: 'movie',
    genre: 'Noir',
    posterUrl: '/fallback/poster-3.jpg',
    backgroundUrl: '/fallback/background-3.jpg',
    durationMinutes: 110,
    progress: 0.25,
  },
  {
    id: 'fall-04',
    title: 'Projeto Quimera',
    description: 'Cientistas descobrem uma forma de viajar entre dimensões, mas a tecnologia cai em mãos erradas.',
    type: 'series',
    genre: 'Ficção Científica',
    posterUrl: '/fallback/poster-4.jpg',
    backgroundUrl: '/fallback/background-4.jpg',
    seasons: 1,
    progress: 0,
  },
  {
    id: 'fall-05',
    title: 'A Conspiração Silenciosa',
    description: 'Uma jornalista descobre uma rede de espionagem que se infiltrou nos mais altos níveis do governo.',
    type: 'movie',
    genre: 'Suspense',
    posterUrl: '/fallback/poster-5.jpg',
    backgroundUrl: '/fallback/background-5.jpg',
    durationMinutes: 135,
    progress: 0,
  },
  {
    id: 'fall-06',
    title: 'Herdeiros do Sol',
    description: 'Em um mundo pós-apocalíptico, uma tribo tenta preservar o conhecimento da antiga civilização.',
    type: 'series',
    genre: 'Aventura',
    posterUrl: '/fallback/poster-6.jpg',
    backgroundUrl: '/fallback/background-6.jpg',
    seasons: 3,
    progress: 0.9,
  },
  {
    id: 'fall-07',
    title: 'Maré Vermelha',
    description: 'Uma bióloga marinha descobre uma criatura aterrorizante nas profundezas do oceano.',
    type: 'movie',
    genre: 'Terror',
    posterUrl: '/fallback/poster-7.jpg',
    backgroundUrl: '/fallback/background-7.jpg',
    durationMinutes: 95,
    progress: 0,
  },
  {
    id: 'fall-08',
    title: 'Cidade de Neon',
    description: 'A vida de vários estranhos se cruza durante uma noite caótica em uma metrópole futurista.',
    type: 'series',
    genre: 'Drama',
    posterUrl: '/fallback/poster-8.jpg',
    backgroundUrl: '/fallback/background-8.jpg',
    seasons: 1,
    progress: 0.5,
  },
];
