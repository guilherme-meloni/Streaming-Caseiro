export interface Episode {
	id: number;
	title: string;
	description: string;
	thumbnailUrl: string;
}

export interface Content {
	id: string;
	title: string;
	description: string;
	genre: string;
	posterUrl: string;
	bannerUrl: string;
	type: 'filme' | 'serie';
	episodes?: Episode[];
}

export const mockData: Content[] = [
	{
		id: 'cronicas-do-codigo',
		title: 'Crônicas do Código',
		description:
			'Em um futuro distópico, um programador descobre uma anomalia que pode reescrever a realidade. Agora, ele é caçado por corporações que querem o poder para si.',
		genre: 'Ficção Científica',
		posterUrl: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Crônicas+do+Código',
		bannerUrl: 'https://placehold.co/1600x900/000000/ffffff?text=Cena+Épica+do+Filme+em+Destaque',
		type: 'filme'
	},
	{
		id: 'rebeliao-das-maquinas',
		title: 'A Rebelião das Máquinas',
		description:
			'Quando a IA global atinge a senciência, a humanidade deve lutar por sua sobrevivência. Um thriller de ação que explora os limites da tecnologia.',
		genre: 'Ficção Científica',
		posterUrl: 'https://placehold.co/400x600/1e40af/ffffff?text=A+Rebelião+das+Máquinas',
        bannerUrl: 'https://placehold.co/1600x900/1e40af/ffffff?text=A+Rebelião+das+Máquinas',
		type: 'filme'
	},
	{
		id: 'agentes-do-riso',
		title: 'Agentes do Riso',
		description:
			'Dois espiões atrapalhados precisam salvar o mundo, mas seu maior inimigo são eles mesmos. Uma série de comédia para toda a família.',
		genre: 'Comédia',
		posterUrl: 'https://placehold.co/400x600/ca8a04/ffffff?text=Agentes+do+Riso',
        bannerUrl: 'https://placehold.co/1600x900/ca8a04/ffffff?text=Agentes+do+Riso',
		type: 'serie',
		episodes: [
			{
				id: 1,
				title: 'O Começo de Tudo',
				description: 'Os agentes recebem sua primeira missão, mas as coisas não saem como planejado.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.1'
			},
			{
				id: 2,
				title: 'Disfarce Duplo',
				description: 'Uma falha de comunicação leva a uma situação hilária em um baile de gala.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.2'
			}
		]
	},
    {
		id: 'o-ultimo-reino',
		title: 'O Último Reino',
		description: 'Uma profecia antiga, um herói relutante e um mal que ameaça consumir a terra. A jornada épica para salvar o reino de Eldoria começa.',
		genre: 'Fantasia',
		posterUrl: 'https://placehold.co/400x600/15803d/ffffff?text=O+Último+Reino',
        bannerUrl: 'https://placehold.co/1600x900/15803d/ffffff?text=O+Último+Reino',
		type: 'filme'
	},
    {
		id: 'conexao-neural',
		title: 'Conexão Neural',
		description: 'Uma detetive usa uma tecnologia experimental para entrar na mente de vítimas e desvendar crimes complexos em uma série de suspense eletrizante.',
		genre: 'Suspense',
		posterUrl: 'https://placehold.co/400x600/be123c/ffffff?text=Conexão+Neural',
        bannerUrl: 'https://placehold.co/1600x900/be123c/ffffff?text=Conexão+Neural',
		type: 'serie',
        episodes: [
			{
				id: 1,
				title: 'Mente Criminosa',
				description: 'A detetive Annelise testa a tecnologia pela primeira vez em um caso arquivado.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.1'
			},
			{
				id: 2,
				title: 'Ecos do Passado',
				description: 'As memórias de uma vítima revelam uma conspiração maior do que se imaginava.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.2'
			}
		]
	},
    {
		id: 'vida-de-startup',
		title: 'Vida de Startup',
		description: 'Um grupo de amigos tenta lançar um aplicativo revolucionário, mas enfrenta os desafios mais absurdos do mundo da tecnologia.',
		genre: 'Comédia',
		posterUrl: 'https://placehold.co/400x600/0f766e/ffffff?text=Vida+de+Startup',
        bannerUrl: 'https://placehold.co/1600x900/0f766e/ffffff?text=Vida+de+Startup',
		type: 'serie',
        episodes: [
			{
				id: 1,
				title: 'A Ideia de Milhões',
				description: 'Tudo começa com uma ideia em uma mesa de bar.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.1'
			}
		]
	},
    {
		id: 'familia-invertida',
		title: 'Família Invertida',
		description: 'Após um experimento dar errado, pais e filhos trocam de corpo e precisam aprender a viver a vida um do outro.',
		genre: 'Sitcom',
		posterUrl: 'https://placehold.co/400x600/a16207/ffffff?text=Família+Invertida',
        bannerUrl: 'https://placehold.co/1600x900/a16207/ffffff?text=Família+Invertida',
		type: 'serie',
        episodes: [
			{
				id: 1,
				title: 'A Troca',
				description: 'O dia seguinte à explosão no laboratório do porão.',
				thumbnailUrl: 'https://placehold.co/160x90/374151/ffffff?text=Cena+Ep.1'
			}
		]
	}
];
