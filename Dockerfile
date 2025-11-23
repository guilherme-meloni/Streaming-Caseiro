# Estágio 1: Build
# Usa uma imagem Node para instalar dependências e "compilar" o site
FROM node:20-slim AS builder
WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia os arquivos de dependência e baixa os pacotes (otimização de cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
RUN pnpm install -r --offline

# Copia o resto do código do site
COPY . .

# Roda o comando de build para gerar a versão de produção otimizada
RUN pnpm run build

# Estágio 2: Produção
# Começa de uma nova imagem limpa para manter o tamanho final pequeno
FROM node:20-slim
WORKDIR /app

# Instala pnpm novamente para instalar apenas as dependências de produção
RUN npm install -g pnpm

# Copia os arquivos de dependência
COPY package.json pnpm-lock.yaml ./

# Instala SOMENTE as dependências de produção
RUN pnpm fetch
RUN pnpm install -r --offline --prod

# Copia a pasta 'build' gerada no estágio anterior, que contém o servidor Node.js otimizado
COPY --from=builder /app/build ./build
# Copia a pasta de assets estáticos
COPY --from=builder /app/static ./static
# Copia os assets pré-processados do SvelteKit
COPY --from=builder /app/.svelte-kit ./.svelte-kit

# Expõe a porta que o servidor de produção do SvelteKit usa
EXPOSE 3000

# O comando para iniciar o servidor de produção do SvelteKit
CMD ["node", "build"]
