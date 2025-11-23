# PWA Canal Local (Frontend)

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Este é o repositório do frontend para o projeto "Canal Local", uma aplicação de streaming de mídia multiplataforma. A aplicação foi construída para funcionar como um PWA (Progressive Web App), aplicativo Android nativo e aplicativo de desktop (Linux).

---

## 📜 Visão Geral

O "PWA Canal Local" é a interface de usuário para um servidor de mídia pessoal. Ele permite que os usuários naveguem por um catálogo de filmes e séries, assistam a um canal de transmissão contínua 24h, baixem mídias para visualização offline e muito mais.

A aplicação é projetada para ser robusta e flexível, comunicando-se com um backend dedicado através de uma API REST e WebSockets para atualizações em tempo real.

## ✨ Principais Funcionalidades

- **Catálogo de Mídia (VOD):** Navegue por séries e filmes disponíveis no servidor.
- **Canal 24h:** Assista a uma transmissão de vídeo contínua, como um canal de TV tradicional.
- **Player de Vídeo:** Player integrado com suporte a streaming HLS (`.m3u8`).
- **Downloads Offline:** Baixe episódios e filmes para assistir sem conexão com a internet.
- **Autenticação de Usuário:** Sistema de login para gerenciar perfis, favoritos e histórico.
- **Minha Lista e Histórico:** Salve mídias para assistir mais tarde e acompanhe o que já foi visto.
- **Multiplataforma:** Funciona em navegadores (PWA), como um app Android (via Capacitor) e como um app de desktop (via Electron).

## 🚀 Tecnologias Utilizadas

- **Framework Principal:** [SvelteKit](https://kit.svelte.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Player de Vídeo:** [HLS.js](https://hls-js.com/) para streaming adaptativo.
- **Plataformas Nativas:**
  - [Capacitor](https://capacitorjs.com/) para a build Android.
  - [Electron](https://www.electronjs.org/) para a build de Desktop.
- **Comunicação com Backend:** API REST e WebSockets.

---

## ⚙️ Como Começar (Guia de Instalação e Execução)

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- **Node.js:** Versão 18 ou superior.
- **pnpm:** Gerenciador de pacotes. Se não tiver, instale com `npm install -g pnpm`.
- **Servidor Backend:** A aplicação frontend requer que o [servidor backend do Canal Local](https://github.com/seu-usuario/seu-repo-backend) esteja em execução.

### 1. Clone o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd pwa-canal-local
```

### 2. Instale as Dependências

Use o `pnpm` para instalar todas as dependências do projeto.

```bash
pnpm install
```

### 3. Execute em Modo de Desenvolvimento (Web)

Este comando iniciará um servidor de desenvolvimento local (geralmente em `http://localhost:5173`). A aplicação recarregará automaticamente sempre que você fizer alterações nos arquivos.

```bash
pnpm dev
```

---

## 📦 Scripts de Build e Execução

### Aplicação Web (PWA)

- **Build de produção:**
  ```bash
  pnpm build
  ```
  Este comando gera os arquivos estáticos otimizados na pasta `build/`.

- **Pré-visualizar a build:**
  ```bash
  pnpm preview
  ```
  Use este comando para testar a versão de produção localmente.

### Aplicação de Desktop (Electron)

- **Iniciar em modo de desenvolvimento:**
  ```bash
  pnpm start
  ```
  Isso abrirá a aplicação em uma janela do Electron com ferramentas de desenvolvimento.

- **Build para Linux:**
  ```bash
  pnpm build:linux
  ```
  Este comando gerará os pacotes da aplicação para Linux (AppImage, pacman) no diretório `dist/`.

### Aplicação Mobile (Android)

Para gerar o aplicativo Android, siga os passos do Capacitor:

1.  **Gere a build da aplicação web:**
    ```bash
    pnpm build
    ```

2.  **Sincronize os arquivos web com o projeto Android:**
    ```bash
    npx cap sync
    ```
    Este comando copia a pasta `build/` para dentro do projeto nativo e atualiza as dependências.

3.  **Abra o projeto no Android Studio:**
    ```bash
    npx cap open android
    ```
    A partir do Android Studio, você pode compilar, emular e gerar o APK ou App Bundle assinado.

---

## 🧪 Testes e Verificação de Tipos

Este projeto utiliza o `svelte-check` para realizar a verificação estática de tipos em todo o código Svelte e TypeScript.

- **Executar a verificação uma vez:**
  ```bash
  pnpm check
  ```

- **Executar em modo de observação (watch):**
  ```bash
  pnpm check:watch
  ```

Atualmente, não há uma suíte de testes unitários ou E2E configurada. A qualidade do código é mantida através da verificação de tipos.

---

## 📂 Estrutura do Projeto

```
.
├── android/            # Projeto nativo Android (gerenciado pelo Capacitor)
├── electron/           # Código e configuração da aplicação Electron
├── src/                # Código-fonte principal da aplicação SvelteKit
│   ├── lib/            # Componentes, stores, utilitários e módulos Svelte
│   ├── routes/         # Definição de páginas e endpoints da API do SvelteKit
│   └── app.html        # Template HTML principal
├── static/             # Arquivos estáticos (ex: favicon.svg, robots.txt)
├── package.json        # Dependências e scripts do projeto
└── svelte.config.js    # Configuração do SvelteKit
```