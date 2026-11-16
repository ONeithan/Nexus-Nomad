# Catálogo & Guia Completo de Aplicativos N.O.M.A.D.

O **Catálogo de Aplicativos do Nexus N.O.M.A.D.** reúne tanto as ferramentas nativas integradas quanto todo o **Arsenal Soberano** com mais de 100 microsserviços auto-hospedados.

Esta página reúne a documentação operacional de cada aplicativo: **Para que serve**, **O que faz**, **Como funciona** e **Exemplos práticos de uso real** na sua residência, homelab e família.

---

## Biblioteca Offline (Kiwix) {% #nomad-kiwix-server %}

- **Categoria:** `education` | **Porta:** `8090` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Acesso soberano e offline à Wikipédia completa em português, manuais de sobrevivência, guias médicos e enciclopédias sem internet.

### ⚙️ O que faz
- Leitura de arquivos compactados .zim em altíssima velocidade
- Busca textual instantânea com suporte a imagens e fórmulas
- Servidor web local acessível por qualquer celular ou PC na rede Wi-Fi
- Suporte a múltiplos acervos e armazenamento em HD externo ou TrueNAS

### 🧠 Como funciona
Executa um servidor C++ embarcado de baixo consumo que lê acervos comprimidos (.zim) sem precisar descompactar os gigabytes no disco, servindo páginas HTML em milissegundos para múltiplos usuários simultâneos.

### 💡 Exemplo Real de Uso
Em um apagão geral de internet na sua cidade, você e sua família continuam acessando a Wikipédia completa com mais de 1 milhão de artigos, manuais de primeiros socorros e guias de agricultura direto pelo Wi-Fi de casa.

---

## Banco Vetorial Qdrant {% #nomad-qdrant %}

- **Categoria:** `ai` | **Porta:** `6333` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Armazenamento e busca por proximidade vetorial para inteligência artificial, agentes e memória semântica.

### ⚙️ O que faz
- Motor em Rust de altíssima performance para embeddings vetoriais
- Base de recuperação de documentos (RAG) para o Ollama e Dify
- Filtragem híbrida de texto e vetores com persistência local em disco
- Zero envio de dados para provedores de nuvem

### 🧠 Como funciona
Converte parágrafos e documentos em coordenadas multidimensionais. Quando você faz uma pergunta, o Qdrant encontra os trechos mais pertinentes em milissegundos para a IA local responder com base nos seus dados.

### 💡 Exemplo Real de Uso
Ao perguntar à IA local "Qual o torque dos parafusos do cabeçote do meu motor?", o Qdrant varre 5.000 páginas de manuais e entrega o dado exato para a IA responder na hora.

---

## Assistente de IA Local {% #nomad-ollama %}

- **Categoria:** `ai` | **Porta:** `11434` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Motor central de inferência de inteligência artificial generativa local com aceleração de GPU dedicada.

### ⚙️ O que faz
- Execução local de modelos avançados (Llama 3.2, Mistral, Qwen, DeepSeek)
- Aceleração direta na GPU dedicada (RTX 5060)
- API aberta compatível com OpenAI para integração com Open WebUI e n8n
- Privacidade absoluta: zero telemetria ou envio de conversas para a nuvem

### 🧠 Como funciona
Carrega modelos de IA quantizados diretamente na memória VRAM da GPU e processa tokens via CUDA em velocidade máxima, expondo endpoints de API locais para o assistente do N.O.M.A.D.

### 💡 Exemplo Real de Uso
Resumir contratos longos, analisar códigos-fonte de projetos ou tirar dúvidas confidenciais com um assistente tão inteligente quanto o ChatGPT, sem que nenhuma palavra saia do seu computador.

---

## Ferramentas de Dados (CyberChef) {% #nomad-cyberchef %}

- **Categoria:** `utility` | **Porta:** `8100` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Canivete suíço de operações analíticas, decodificação, criptografia e tratamento de dados com interface nativa em português.

### ⚙️ O que faz
- Mais de 300 operações encadeáveis em pipeline visual tipo receita
- Conversões entre Base64, Hexadecimal, Binário, URL e Unicode
- Cálculo de hashes (SHA-256, MD5, Keccak) e decodificação JWT
- Interface nativa 100% traduzida em Português do Brasil no N.O.M.A.D.

### 🧠 Como funciona
Executa integralmente no navegador do cliente via JavaScript. Os dados colados nunca transitam pela rede, permitindo analisar chaves e credenciais com segurança total.

### 💡 Exemplo Real de Uso
Você recebe um log de rede corrompido ou codificado em Base64 com gzip; joga no CyberChef, arrasta as operações "De Base64" e "Gunzip" e visualiza o texto puro em 2 segundos.

---

## Bloco de Notas (Flatnotes) {% #nomad-flatnotes %}

- **Categoria:** `productivity` | **Porta:** `8200` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Editor e organizador de notas rápidas em Markdown focado em simplicidade pura, sem necessidade de banco de dados.

### ⚙️ O que faz
- Notas salvas como arquivos .md puros diretamente no disco
- Busca rápida por palavras-chave e suporte a tags (#projeto, #casa)
- Visualização lado a lado e histórico simples de edição
- Compatibilidade nativa com Obsidian, VS Code e Syncthing

### 🧠 Como funciona
Lê uma pasta de arquivos de texto no disco. Não possui banco de dados proprietário; seus arquivos são seus e você pode copiá-los livremente.

### 💡 Exemplo Real de Uso
Anotar as senhas de Wi-Fi de hóspedes, medidas de um móvel que você vai construir ou comandos que você sempre esquece.

---

## Suíte PDF (Stirling PDF) {% #nomad-stirling-pdf %}

- **Categoria:** `productivity` | **Porta:** `8400` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Suíte completa e privativa de edição, conversão, assinatura e união de PDFs diretamente no navegador.

### ⚙️ O que faz
- Unir dezenas de PDFs, dividir, girar e reorganizar páginas
- Compressão avançada para reduzir o tamanho de arquivos pesados
- Remoção de senhas, adição de marca d'água e assinatura digital
- Conversão entre PDF, Word, imagens e OCR de textos escaneados

### 🧠 Como funciona
Roda um motor em Java e Python local que processa os documentos na memória do contêiner e devolve o arquivo tratado para download imediato, sem reter cópias residuais.

### 💡 Exemplo Real de Uso
Você tem 10 páginas de certidões e comprovantes escaneados; entra no Stirling PDF, junta tudo em um único PDF de 2MB organizado e pronto para enviar por e-mail.

---

## Gerenciador de Arquivos (FileBrowser) {% #nomad-filebrowser %}

- **Categoria:** `utility` | **Porta:** `8410` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Explorador de arquivos completo no navegador para gerenciar e transferir dados no servidor N.O.M.A.D.

### ⚙️ O que faz
- Upload e download rápido de pastas inteiras e arquivos pesados
- Editor de texto embutido e reprodutor de vídeos e músicas
- Compartilhamento seguro de links com prazo de expiração
- Acesso direto às pastas de livros, mídias e documentos

### 🧠 Como funciona
Atua como uma ponte visual sobre o sistema de arquivos local do Linux, expondo as pastas montadas em uma interface moderna e segura com controle de usuários.

### 💡 Exemplo Real de Uso
Mover um vídeo ou ISO de 10GB do seu computador para o servidor com arrastar e soltar no navegador sem precisar abrir cliente FTP ou terminal.

---

## Biblioteca de Livros (Calibre Web) {% #nomad-calibreweb %}

- **Categoria:** `education` | **Porta:** `8420` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Leitor e organizador da sua biblioteca digital pessoal de e-books em EPUB, PDF e MOBI.

### ⚙️ O que faz
- Leitor embutido direto no navegador do celular, tablet ou PC
- Envio de livros com um clique para aparelhos Kindle por e-mail
- Organização por autores, séries, etiquetas e capas em alta resolução
- Conexão com a pasta central de livros do servidor

### 🧠 Como funciona
Lê o banco de dados da sua biblioteca Calibre e serve um catálogo web no protocolo OPDS, permitindo que aplicativos de leitura como Moon+ Reader ou Koreader acessem seu acervo.

### 💡 Exemplo Real de Uso
Você está deitado na cama com o tablet; abre o Calibre Web pelo navegador e continua lendo seu livro de eletrônica de onde parou.

---

## Ferramentas de TI (IT-Tools) {% #nomad-it-tools %}

- **Categoria:** `utility` | **Porta:** `8430` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Coleção prática com mais de 70 utilitários para desenvolvedores, técnicos e administradores de sistemas com tradução nativa em português.

### ⚙️ O que faz
- Calculadora de sub-redes IPv4/IPv6 e conversor de máscaras CIDR
- Formatador de JSON, XML, SQL e YAML
- Gerador de senhas seguras, chaves SSH e UUIDs v4
- 100% traduzido para Português do Brasil no N.O.M.A.D.

### 🧠 Como funciona
Aplicativo estático ultra-otimizado que roda integralmente no cliente web com visual escuro tático, permitindo operações imediatas sem latência de rede.

### 💡 Exemplo Real de Uso
Calcular em segundos quantos hosts cabem em uma sub-rede /27 ou formatar um JSON desorganizado de uma API para entender o retorno de erro.

---

## Quadro Branco (Excalidraw) {% #nomad-excalidraw %}

- **Categoria:** `productivity` | **Porta:** `8440` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Quadro branco digital tático para diagramas, arquiteturas e fluxogramas com estética de desenho à mão.

### ⚙️ O que faz
- Criação rápida de caixas, setas, notas adesivas e diagramas
- Exportação em PNG transparente, SVG e formato editável
- Bibliotecas de ícones de computadores, redes e móveis residenciais
- Armazenamento local das criações no navegador

### 🧠 Como funciona
Renderiza vetores no HTML5 Canvas simulando traços manuais humanos. Extremamente fluido e leve mesmo com dezenas de elementos desenhados simultaneamente.

### 💡 Exemplo Real de Uso
Esboçar a topologia de cabos de rede que vão passar pelos conduítes da sua casa ou desenhar a arquitetura de blocos de um novo circuito de bancada.

---

## Rádio Mesh LoRa (Meshtastic) {% #nomad-meshtastic-web %}

- **Categoria:** `communication` | **Porta:** `8450` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Interface web de monitoramento e envio de mensagens para rádios LoRa de comunicação off-grid resiliente.

### ⚙️ O que faz
- Comunicação de texto criptografada por rádio em frequências ISM (915 MHz)
- Rede mesh cooperativa: cada rádio retransmite pacotes dos outros nós
- Compartilhamento de coordenadas GPS sem sinal de operadora
- Conexão com placa LoRa via USB ou Wi-Fi

### 🧠 Como funciona
Conecta-se ao microcontrolador ESP32/nRF52 do rádio LoRa via porta serial ou WebSocket, exibindo o mapa de nós vizinhos e canais de mensagens no navegador.

### 💡 Exemplo Real de Uso
Trocar mensagens entre sua casa e o carro ou em trilhas remotas em um raio de até 15 km sem precisar de operadora de celular ou provedor de internet.

---

## Terminal LoRa MeshCore {% #nomad-meshcore-web %}

- **Categoria:** `communication` | **Porta:** `8500` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Terminal tático para configuração avançada de nós de rádio, telemetria de sinal e pacotes de rede mesh.

### ⚙️ O que faz
- Monitoramento de SNR e RSSI de pacotes de rádio em tempo real
- Configuração de taxas de espalhamento (Spreading Factor) e potência TX
- Roteamento de telemetria meteorológica e pacotes de sensores
- Depuração de tráfego de rádio em tempo real

### 🧠 Como funciona
Interface técnica de baixo nível que conversa diretamente com o firmware dos transceptores Semtech SX1262 para diagnóstico fino de alcance de rádio.

### 💡 Exemplo Real de Uso
Ajustar a antena da casa para atingir o repetidor de rádio LoRa mais distante da cidade com a melhor relação sinal-ruído possível.

---

## Inventário Doméstico (Homebox) {% #nomad-homebox %}

- **Categoria:** `home-family` | **Porta:** `8470` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O sistema definitivo de inventário doméstico para bens, ferramentas, eletrodomésticos e garantias.

### ⚙️ O que faz
- Cadastro de itens com números de série, notas fiscais e fotos
- Localização por cômodos, armários e caixas organizadoras
- Geração e leitura de etiquetas com QR Code
- Cálculo de valor total do patrimônio para seguros

### 🧠 Como funciona
Banco de dados leve em SQLite com interface web ágil. Permite escanear a etiqueta de uma caixa com a câmera do celular e ver tudo o que está dentro dela sem abrir.

### 💡 Exemplo Real de Uso
Você precisa encontrar a fonte de 12V de um aparelho guardado há 2 anos; pesquisa "fonte 12V" no Homebox e ele mostra: Armário da Oficina > Caixa Plástica Azul 04.

---

## Cofre de Senhas (Vaultwarden) {% #nomad-vaultwarden %}

- **Categoria:** `security` | **Porta:** `8480` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de cofre de senhas Bitwarden privado, leve e 100% sob seu controle físico.

### ⚙️ O que faz
- Compatível com as extensões oficiais do Bitwarden para navegadores e celulares
- Criptografia de ponta a ponta AES-256 e derivação de chave Argon2
- Preenchimento automático seguro de logins, senhas e cartões
- Gerador de códigos de dois fatores (2FA / TOTP) embutido

### 🧠 Como funciona
Implementação em Rust de altíssima eficiência. Todas as senhas são criptografadas no seu celular antes de serem enviadas para o servidor.

### 💡 Exemplo Real de Uso
Fazer login em bancos e lojas em 1 segundo no celular usando a biometria, com senhas únicas de 30 caracteres para cada site, sem salvar nada nas nuvens do Google ou Apple.

---

## Servidor de Mídia (Jellyfin) {% #nomad-jellyfin %}

- **Categoria:** `media` | **Porta:** `8490` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Central de streaming de filmes, séries, animes e vídeos familiares para Smart TVs, computadores e celulares.

### ⚙️ O que faz
- Transcodificação acelerada por hardware na GPU dedicada (RTX 5060)
- Metadados automáticos com cartazes, sinopses e legendas
- Aplicativos nativos para Smart TV Samsung, LG, Android TV e Roku
- Perfis separados para você, sua esposa e seus filhos com controle etário

### 🧠 Como funciona
Indexa suas pastas de vídeos no TrueNAS ou HD local e transmite diretamente para aparelhos da casa em alta resolução.

### 💡 Exemplo Real de Uso
Assistir aos filmes e desenhos do seu acervo no conforto do sofá da sala em 4K HDR sem buffering e sem depender de assinaturas de streaming que removem títulos do catálogo.

---

## Tradutor Offline (LibreTranslate) {% #nomad-translate %}

- **Categoria:** `education` | **Porta:** `8000` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Motor de tradução automática neural de textos e documentos entre dezenas de idiomas sem internet.

### ⚙️ O que faz
- Tradução de textos longos entre Português, Inglês, Espanhol e outros
- API aberta para traduzir livros do Calibre Web e coleções Kiwix
- Execução em redes neurais locais sem limite de requisições
- Zero vazamento de dados de documentos sensíveis

### 🧠 Como funciona
Utiliza modelos baseados em transformers rodando localmente no processador, preservando sigilo absoluto.

### 💡 Exemplo Real de Uso
Traduzir um manual técnico de 20 páginas em alemão ou russo diretamente para português sem colar nenhum trecho no Google Tradutor.

---

## Sincronização P2P (Syncthing) {% #nomad-syncthing %}

- **Categoria:** `utility` | **Porta:** `8384` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sincronização contínua e criptografada de pastas entre computadores, celulares e o servidor sem nuvem.

### ⚙️ O que faz
- Sincronização automática em segundo plano via rede local ou remota
- Criptografia TLS ponta a ponta e controle de versões de arquivos
- Substituto privado do Dropbox, Google Drive e OneDrive
- Não depende de servidores centrais para transferência direta

### 🧠 Como funciona
Conecta seus aparelhos diretamente por identificadores criptográficos únicos de dispositivo.

### 💡 Exemplo Real de Uso
Sua pasta de projetos do Obsidian e documentos de engenharia ficam sempre sincronizados entre o notebook da rua e o computador da sua bancada de trabalho de forma invisível.

---

## Músicas & Audiolivros (Navidrome) {% #nomad-navidrome %}

- **Categoria:** `media` | **Porta:** `4533` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de streaming de músicas de alta fidelidade para transformar sua coleção em um Spotify privado.

### ⚙️ O que faz
- Consumo de memória ultra-baixo (< 50MB de RAM) escrito em Go
- Compatível com dezenas de apps para celular (Symfonium, Substreamer, DSub)
- Suporte a áudio sem perda (FLAC, ALAC), playlists e rádios
- Leitura rápida de coleções com mais de 100.000 músicas

### 🧠 Como funciona
Indexa sua biblioteca musical no TrueNAS e expõe uma API compatível com o padrão Subsonic.

### 💡 Exemplo Real de Uso
Ouvir seus álbuns favoritos e playlists completas no carro via Bluetooth pelo celular sem gastar seu plano de dados 4G/5G e com qualidade de áudio cristalina.

---

## Wiki & Base de Conhecimento (Wiki.js) {% #nomad-wikijs %}

- **Categoria:** `productivity` | **Porta:** `3000` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A mais moderna plataforma de documentação wiki em Markdown com visual limpo e busca rápida.

### ⚙️ O que faz
- Editor Markdown visual com suporte a diagramas e tabelas
- Autenticação de múltiplos usuários com permissões por seção
- Backup automático de todas as páginas em repositório Git
- Indexação de busca em tempo real com renderização rápida

### 🧠 Como funciona
Armazena a estrutura em banco de dados e sincroniza os arquivos de texto diretamente com um repositório Git.

### 💡 Exemplo Real de Uso
Documentar a lista de tintas usadas em cada parede da casa, medidas dos cômodos e senhas do roteador para consulta de qualquer membro da família.

---

## Monitor de Logs Docker (Dozzle) {% #nomad-dozzle %}

- **Categoria:** `utility` | **Porta:** `8080` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Visualizador leve em tempo real dos logs de todos os contêineres Docker em execução no sistema.

### ⚙️ O que faz
- Transmissão instantânea de logs sem recarregar a página
- Filtros de busca rápida por termos de erro (error, fail, timeout)
- Estatísticas de uso de memória e CPU por contêiner
- Interface escura tática sem necessidade de banco de dados

### 🧠 Como funciona
Conecta-se diretamente ao socket do Docker (/var/run/docker.sock) e lê as saídas padrão stdout e stderr dos contêineres.

### 💡 Exemplo Real de Uso
Um aplicativo não está abrindo; você entra no Dozzle, clica no nome do contêiner e vê imediatamente a linha exata do erro que está ocorrendo.

---

## Gestão de Documentos (Paperless-ngx) {% #nomad-paperless %}

- **Categoria:** `productivity` | **Porta:** `8000` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O indexador de documentos físicos definitivo: transforma papéis escaneados em arquivos digitais pesquisáveis.

### ⚙️ O que faz
- OCR automático em Português do Brasil para reconhecer textos em fotos
- Classificação automática por IA de correspondentes, datas e etiquetas
- Busca de texto completo dentro de PDFs e fotos de recibos
- Pasta de entrada automática (basta escanear que ele processa)

### 🧠 Como funciona
Lê o texto impresso com Tesseract OCR, indexa as palavras no banco e arquiva o PDF original de forma imutável.

### 💡 Exemplo Real de Uso
Você precisa achar a garantia da geladeira comprada há 3 anos; digita "geladeira" no Paperless e ele encontra a nota fiscal na hora com o valor e a data destacada.

---

## Open WebUI (Chat IA Local) {% #nomad-open-webui %}

- **Categoria:** `ai` | **Porta:** `8501` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Interface web de chat estilo ChatGPT / Claude com suporte nativo a Ollama, vLLM e OpenAI API.

### ⚙️ O que faz
- Permite aproveitar todo o potencial da sua RTX 5060 rodando modelos como Llama 3.2, Mistral, Qwen e DeepSeek sem enviar ...
- Porta padrão mapeada: 8501
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao daemon do Ollama na porta 11434 e renderiza uma UI rica com suporte a RAG (Retrieval Augmented Generation), upload de documentos PDF/DOCX, navegação web privativa, execução de código e múltiplos usuários com controle de acesso.

### 💡 Exemplo Real de Uso
Você sobe o manual da sua placa-mãe ou um PDF de 500 páginas e pergunta "Qual é o barramento PCIe correto para colocar o segundo SSD NVMe?", e o Open WebUI responde em segundos citando a página exata.

---

## Dify (Automação de Agentes IA) {% #nomad-dify %}

- **Categoria:** `ai` | **Porta:** `8502` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma avançada para construção visual de fluxos de agentes de IA, RAG multi-etapas e assistentes automatizados.

### ⚙️ O que faz
- Transforma seus modelos locais de simples "chatbots" em verdadeiros funcionários digitais que executam tarefas complexas...
- Porta padrão mapeada: 8502
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece um construtor de pipelines no-code onde você pode ligar modelos de IA locais, bancos vetoriais (Qdrant), raspadores de web e webhooks externos para criar ferramentas que tomam decisões de forma autônoma.

### 💡 Exemplo Real de Uso
Criar um agente que lê seus e-mails ou alertas do homelab, resume os pontos críticos e notifica você no Mattermost ou Gotify apenas se houver algo urgente.

---

## Outline (Base de Conhecimento & Projetos) {% #nomad-outline %}

- **Categoria:** `ai` | **Porta:** `8504` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A ferramenta definitiva de documentação de equipe e projetos, combinando a elegância do Notion com a velocidade do Markdown e segurança corporativa.

### ⚙️ O que faz
- É a resposta perfeita para quem não gostou da interface do BookStack. O Outline possui design limpo, moderno, suporte a ...
- Porta padrão mapeada: 8504
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida com suporte a múltiplos espaços de trabalho, histórico de versões, busca textual em tempo real, suporte a IA para expansão de textos e controle fino de permissões.

### 💡 Exemplo Real de Uso
Documentar todo o seu homelab, topologias de rede, manuais dos seus projetos eletrônicos e procedimentos operacionais (SOPs) para que qualquer pessoa consiga manter a infraestrutura funcionando.

---

## Docmost (Wiki & Workspace Colaborativo) {% #nomad-docmost %}

- **Categoria:** `ai` | **Porta:** `8505` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma moderna de edição de notas e documentos colaborativos em tempo real, baseada em blocos e totalmente open-source.

### ⚙️ O que faz
- Excelente para atas de reuniões rápidas, listas de tarefas dinâmicas e brainstorming colaborativo sem depender de Google...
- Porta padrão mapeada: 8505
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que várias pessoas editem o mesmo documento simultaneamente, com renderização de diagramas Mermaid, equações matemáticas KaTeX, tabelas e links bidirecionais.

### 💡 Exemplo Real de Uso
Planejar viagens ou reformas da casa com sua esposa, editando ao mesmo tempo a lista de compras de materiais e custos estimados.

---

## Hoarder (Coletor Inteligente com IA) {% #nomad-hoarder %}

- **Categoria:** `ai` | **Porta:** `8506` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O melhor gerenciador de bookmarks e "leia mais tarde" já criado para homelabs, turbinado com IA.

### ⚙️ O que faz
- Preserva todo o conhecimento que você descobre na web mesmo se o site original for derrubado ou virar pago.
- Porta padrão mapeada: 8506
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você envia um link, tweet, imagem ou PDF via extensão de navegador ou app móvel. O Hoarder arquiva a página inteira offline, extrai o texto limpo sem anúncios, aciona o Ollama local na sua máquina para classificar categorias, gerar resumo e criar tags automáticas.

### 💡 Exemplo Real de Uso
Salvar artigos de eletrônica ou threads técnicas; a IA lê o artigo, gera tags como `#kicad`, `#firmware`, `#rtx` e você acha tudo instantaneamente pela busca inteligente.

---

## Whisper.cpp (Transcrição Offline de Voz) {% #nomad-whisper %}

- **Categoria:** `ai` | **Porta:** `8507` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 8507
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---

## Grocy (ERP Residencial & Despensa) {% #nomad-grocy %}

- **Categoria:** `home-family` | **Porta:** `8510` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sistema profissional de gerenciamento de estoque doméstico, validade de alimentos e manutenção residencial.

### ⚙️ O que faz
- Acaba com o desperdício de comida e de remédios que passam da validade sem ninguém notar.
- Porta padrão mapeada: 8510
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conectado a um leitor de código de barras USB ou câmera do celular, cadastra cada item que entra na despensa ou congelador. Avisa antes dos alimentos vencerem, rastreia consumo e sugere compras.

### 💡 Exemplo Real de Uso
Ler o código de barras da caixa de leite ao chegar do mercado; o sistema registra a data de validade e abate automaticamente uma unidade quando você marca como consumido.

---

## Mealie (Livro de Receitas & Supermercado) {% #nomad-mealie %}

- **Categoria:** `home-family` | **Porta:** `8511` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerenciador gastronômico familiar com extração automática de receitas de qualquer site.

### ⚙️ O que faz
- Permite que você e sua esposa planejem as refeições da semana com visual limpo no tablet da cozinha e gerem a lista de c...
- Porta padrão mapeada: 8511
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cola a URL de qualquer receita da internet (sites de culinária, YouTube, blogs); o Mealie raspa a página, descarta pop-ups e biografias chatas, salva apenas os ingredientes exatos, modo de preparo passo a passo e fotos.

### 💡 Exemplo Real de Uso
Sua esposa encontra uma receita incrível na internet, envia o link para o Mealie pelo celular, clica em "Adicionar à lista de compras" e os ingredientes vão direto para a lista do supermercado.

---

## KitchenOwl (Cardápios & Despensa Inteligente) {% #nomad-kitchenowl %}

- **Categoria:** `home-family` | **Porta:** `8512` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Aplicativo colaborativo leve para gerenciamento de despensa e listas de compras inteligentes sincronizadas entre celulares.

### ⚙️ O que faz
- Alternativa mais ágil e direta para o dia a dia quando você deseja focar apenas na dinâmica de compras rápidas do casal.
- Porta padrão mapeada: 8512
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que membros da família marquem itens conforme acabam em casa. Organiza as listas por categorias de corredores do mercado (Hortifrúti, Laticínios, Limpeza).

### 💡 Exemplo Real de Uso
Um de vocês está no supermercado riscando os itens comprados na tela do celular enquanto o outro adiciona um item esquecido de casa, e a lista atualiza em tempo real.

---

## BabyBuddy (Prontuário Médico Familiar) {% #nomad-babybuddy %}

- **Categoria:** `home-family` | **Porta:** `8513` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 8513
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---

## OpenREM / DICOM (Arquivo de Exames Médicos) {% #nomad-openrem %}

- **Categoria:** `home-family` | **Porta:** `8514` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor PACS e visualizador de exames médicos de imagem (Raios-X, Tomografias, Ressonâncias Magnéticas e Ultrassons).

### ⚙️ O que faz
- Garante que o histórico radiológico de toda a sua vida fique guardado no TrueNAS sem perda de resolução ou compressão de...
- Porta padrão mapeada: 8514
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Recebe os arquivos digitais em formato nativo DICOM que vêm nos CDs/pen-drives de laboratórios e clínicas, permitindo visualização de cortes em alta fidelidade pelo navegador.

### 💡 Exemplo Real de Uso
Você precisa comparar uma ressonância de joelho ou coluna feita há 5 anos com uma atual; o Orthanc abre as duas lado a lado no navegador para o médico avaliar.

---

## Gramps Web (Árvore Genealógica Privada) {% #nomad-gramps-web %}

- **Categoria:** `home-family` | **Porta:** `8515` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A mais respeitada plataforma de genealogia científica mundial em versão web colaborativa para toda a família.

### ⚙️ O que faz
- Mantém a história dos seus antepassados e descendentes protegida, sem expor os dados da sua linhagem para bancos de dado...
- Porta padrão mapeada: 8515
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Constrói árvores genealógicas com vínculos de parentesco, digitalização de certidões antigas, fotos históricas restauradas, mapas de migração dos antepassados e linhagens.

### 💡 Exemplo Real de Uso
Cadastrar fotos dos bisavós e certidões históricas de nascimento/imigração para que seus filhos e netos tenham acesso permanente às suas origens.

---

## Bar Assistant (Guia de Drinks & Bebidas) {% #nomad-bar-assistant %}

- **Categoria:** `home-family` | **Porta:** `8516` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerenciador do seu bar pessoal, adega e catálogo de coquetéis artesanais.

### ⚙️ O que faz
- Perfeito para receber amigos e família em casa preparando drinks clássicos e autorais com receitas exatas e proporções m...
- Porta padrão mapeada: 8516
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cadastra os destilados, licores, xaropes e ingredientes que tem no armário; o sistema informa instantaneamente quais coquetéis mundiais você consegue preparar agora ou qual ingrediente barato falta comprar.

### 💡 Exemplo Real de Uso
Amigos chegam em casa no fim de semana; você abre o Bar Assistant, clica em "O que posso fazer?" e ele lista 15 drinks possíveis com os ingredientes que você tem.

---

## Firefly III (Gestão Financeira & Metas) {% #nomad-fireflyiii %}

- **Categoria:** `finance` | **Porta:** `8520` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais completo gerenciador financeiro auto-hospedado do mundo, construído sobre princípios rígidos de partidas dobradas (double-entry bookkeeping).

### ⚙️ O que faz
- É o único sistema capaz de suprir tudo o que você tinha no seu plugin de 2 anos: cartões com dias de fechamento e vencim...
- Porta padrão mapeada: 8520
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Trata cada centavo como uma entidade contábil: nenhuma despesa surge do nada; o dinheiro sai de uma conta de ativo (banco, carteira, vale-alimentação) e vai para uma conta de destino ou cartão de crédito. Possui motor robusto de regras automáticas, relatórios orçamentários, tags e acompanhamento de dívidas.

### 💡 Exemplo Real de Uso
Seu salário quinzenal cai no dia 15; o Firefly III aloca automaticamente as parcelas de investimentos, separa o orçamento do supermercado e abate o saldo devedor do financiamento veicular com atualização de patrimônio líquido em tempo real.

---

## Actual Budget (Orçamento por Envelopes) {% #nomad-actual-budget %}

- **Categoria:** `finance` | **Porta:** `8521` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sistema focado no método "envelope budgeting" (dar um destino a cada real recebido), com interface ultra-rápida construída em React e SQLite.

### ⚙️ O que faz
- Excelente para o controle tático do orçamento mensal do casal quando você quer rapidez máxima para saber quanto ainda po...
- Porta padrão mapeada: 8521
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Funciona inteiramente no navegador local e sincroniza alterações criptografadas ponta a ponta com seu servidor N.O.M.A.D. e com o aplicativo de celular. Mesmo sem internet na rua, você lança despesas e ele sincroniza assim que reconectar.

### 💡 Exemplo Real de Uso
Você abre o app na fila do restaurante; ele mostra na hora: "Você ainda tem R$ 180 no envelope de Lazer deste mês".

---

## Wallos (Rastreador de Assinaturas & Fixas) {% #nomad-wallos %}

- **Categoria:** `finance` | **Porta:** `8522` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel visual dedicado a monitorar assinaturas de serviços, contas recorrentes e contratos de longo prazo.

### ⚙️ O que faz
- Elimina o problema clássico de assinar ferramentas ou serviços e esquecer que eles continuam sendo debitados todo mês no...
- Porta padrão mapeada: 8522
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Registra ciclos de cobrança (mensal, anual, trimestral), formas de pagamento utilizadas, conversão automática de moedas (se assina algo em dólar/euro) e data exata da próxima fatura.

### 💡 Exemplo Real de Uso
Você cadastra suas contas de internet, condomínio, luz e ferramentas; o Wallos mostra um calendário visual com todos os dias de vencimento e o gasto fixo total do mês consolidado.

---

## Ghostfolio (Acompanhamento de Investimentos) {% #nomad-ghostfolio %}

- **Categoria:** `finance` | **Porta:** `8523` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma moderna de gestão de portfólio de investimentos, desenhada para privacidade e independência financeira.

### ⚙️ O que faz
- Permite ver o crescimento patrimonial da família sem entregar suas posições financeiras para corretoras ou aplicativos q...
- Porta padrão mapeada: 8523
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Acompanha seus ativos (ações nacionais da B3, Fundos Imobiliários FIIs, ETFs internacionais, Tesouro Direto e Bitcoin) com cotações automáticas, histórico de dividendos recebidos e cálculo de rentabilidade real contra o CDI e IPCA.

### 💡 Exemplo Real de Uso
Lançar uma compra de cotas de FII; o Ghostfolio atualiza a renda passiva mensal estimada em dividendos e calcula o peso daquele ativo na carteira geral.

---

## Maybe (Planejamento de Independência Financeira) {% #nomad-maybe %}

- **Categoria:** `finance` | **Porta:** `8524` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O ambicioso sistema de gestão de patrimônio e independência financeira (FIRE - Financial Independence, Retire Early) que virou open-source após receber milhões de dólares em desenvolvimento.

### ⚙️ O que faz
- Dá a visão macro dos próximos 10, 20 e 30 anos do seu patrimônio familiar.
- Porta padrão mapeada: 8524
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Oferece projeções estatísticas de longo prazo para aposentadoria, fluxo de caixa futuro, gráficos de patrimônio líquido consolidado e cenários de rentabilidade.

### 💡 Exemplo Real de Uso
Simular se manter os aportes mensais atuais permitirá quitar o financiamento mais rápido ou atingir a meta da reserva de emergência antes do final do ano.

---

## Invoice Ninja (Faturas & Orçamentos Profissionais) {% #nomad-invoice-ninja %}

- **Categoria:** `finance` | **Porta:** `8525` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O padrão ouro auto-hospedado para emissão profissional de faturas, propostas comerciais e orçamentos de projetos.

### ⚙️ O que faz
- Se você faz projetos para fora ou presta consultorias de engenharia e TI, ele profissionaliza toda a sua relação finance...
- Porta padrão mapeada: 8525
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar orçamentos personalizados com sua logo, enviar faturas em PDF para clientes, controlar horas trabalhadas por projeto e registrar pagamentos recebidos via PIX ou transferência.

### 💡 Exemplo Real de Uso
Gerar um orçamento detalhado de automação para um cliente com data de validade; o cliente aprova pelo link web e o sistema converte na hora em fatura com controle de recebimento.

---

## Authentik (Login Único com Biometria - SSO) {% #nomad-authentik %}

- **Categoria:** `security` | **Porta:** `8530` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma corporativa de autenticação e gerenciamento de identidade (IdP) baseada em padrões abertos OAuth2, SAML e OpenID Connect.

### ⚙️ O que faz
- Protege toda a infraestrutura com autenticação moderna e permite revogar acessos de qualquer aparelho em um clique.
- Porta padrão mapeada: 8530
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Intercepta o acesso a qualquer serviço do seu homelab. Em vez de memorizar 30 senhas diferentes, você faz login apenas no Authentik usando a impressão digital do celular (Passkey / WebAuthn) e ele autoriza sua sessão em todos os outros apps com segurança bancária.

### 💡 Exemplo Real de Uso
Ao acessar o Portainer ou o Outline de fora de casa, o sistema pede sua biometria no celular antes de liberar a tela.

---

## CrowdSec (Escudo Colaborativo Anti-Invasão) {% #nomad-crowdsec %}

- **Categoria:** `security` | **Porta:** `8531` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Um IPS/IDS inteligente moderno inspirado no Fail2ban, turbinado com inteligência de ameaças coletiva e distribuída mundialmente.

### ⚙️ O que faz
- Funciona como um escudo ativo mesmo que seu homelab utilize Cloudflare Tunnels ou portas abertas.
- Porta padrão mapeada: 8531
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Analisa os logs de acesso do Nginx Proxy Manager, Docker e SSH. Ao detectar que um IP externo está fazendo varredura de portas ou tentativas repetidas de senha, ele bane aquele IP no firewall e compartilha a assinatura do invasor com a rede global.

### 💡 Exemplo Real de Uso
Um bot automatizado na Rússia tenta forçar login no seu servidor; o CrowdSec bloqueia o IP no primeiro segundo e notifica seu painel tático.

---

## NetAlertX (Vigia de Intrusos no Wi-Fi) {% #nomad-netalertx %}

- **Categoria:** `security` | **Porta:** `8532` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sistema autônomo de varredura e auditoria que monitora todos os equipamentos conectados na rede local em tempo real.

### ⚙️ O que faz
- Impede que vizinhos ou aparelhos comprometidos usem seu sinal de rede sem o seu consentimento.
- Porta padrão mapeada: 8532
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executa varreduras ARP e ICMP periódicas no switch e ponto de acesso Wi-Fi. Quando um endereço MAC novo ou desconhecido aparece na rede, ele dispara um alerta imediato no Telegram ou Mattermost com o fabricante e o IP do dispositivo.

### 💡 Exemplo Real de Uso
Um convidado chega na sua casa e se conecta ao Wi-Fi; seu celular vibra avisando: "Novo dispositivo detectado: Samsung Galaxy S24 (IP 192.168.1.145)".

---

## Scrutiny (Prevenção de Queima de HDs e SSDs) {% #nomad-scrutiny %}

- **Categoria:** `security` | **Porta:** `8533` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel visual inteligente para monitoramento preditivo da saúde física de discos mecânicos e SSDs NVMe via telemetria S.M.A.R.T.

### ⚙️ O que faz
- Vital para quem armazena terabytes de arquivos familiares, projetos e backups valiosos. Previne a perda irreparável de d...
- Porta padrão mapeada: 8533
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Coleta os atributos dos discos do host e do TrueNAS em intervalos regulares, compara com os bancos de dados de queima da indústria (como os relatórios de falhas da Backblaze) e avisa se um setor remapeado ou erro de CRC indicar que o disco vai queimar nas próximas semanas.

### 💡 Exemplo Real de Uso
Um dos seus HDs de 4TB começa a apresentar setores com falha de leitura; o Scrutiny emite um alerta vermelho: "Atenção: HD /dev/sdb com 98% de chance de quebra iminente. Faça a troca do disco!".

---

## DefGuard (VPN WireGuard com 2FA & Auditoria) {% #nomad-defguard %}

- **Categoria:** `security` | **Porta:** `8534` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Solução de nível corporativo para gerenciamento centralizado de redes privadas virtuais WireGuard com suporte a múltiplos fatores de autenticação.

### ⚙️ O que faz
- Muito mais seguro que uma VPN simples, pois permite revogar na hora o acesso de um dispositivo perdido ou furtado.
- Porta padrão mapeada: 8534
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite gerar arquivos de configuração e QR codes de acesso remoto para celulares e notebooks com controle de quais IPs cada usuário pode acessar dentro da casa.

### 💡 Exemplo Real de Uso
Configurar o celular da sua esposa com VPN automática; sempre que ela sai do Wi-Fi de casa, o aparelho se reconecta via WireGuard para acessar as fotos do Immich com segurança total.

---

## Headscale / Netbird (VPN Mesh Própria) {% #nomad-headscale %}

- **Categoria:** `networking` | **Porta:** `8535` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Implementação auto-hospedada e de código aberto do servidor de controle Tailscale / Netbird.

### ⚙️ O que faz
- Dá a comodidade do Tailscale sem depender dos servidores corporativos de terceiros para guardar a chave de roteamento da...
- Porta padrão mapeada: 8535
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta todos os seus computadores, servidores, TrueNAS e celulares em uma única rede mesh ponto a ponto criptografada, permitindo que eles se comuniquem diretamente mesmo atrás de roteadores e CGNAT da operadora de internet.

### 💡 Exemplo Real de Uso
Você está no trabalho usando o notebook; digita `ssh truenas.nexus` e acessa o terminal do seu servidor em casa sem precisar abrir nenhuma porta no roteador.

---

## WG-Easy (Painel Rápido de VPN WireGuard) {% #nomad-wgeasy %}

- **Categoria:** `networking` | **Porta:** `8536` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A interface web mais simples e direta do mundo para criar e gerenciar conexões VPN WireGuard com leitura de QR Code.

### ⚙️ O que faz
- Perfeito para setup rápido de conexões de emergência para familiares sem complicação técnica.
- Porta padrão mapeada: 8536
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda o núcleo do WireGuard com tráfego acelerado no kernel e entrega um painel limpo onde você clica em "Novo Cliente", escaneia o QR Code na câmera do celular e a VPN está pronta para navegar.

### 💡 Exemplo Real de Uso
Criar um acesso seguro em 30 segundos no tablet do seu filho para ele acessar os desenhos no Jellyfin durante uma viagem.

---

## Nmap Web (Auditor de Portas & Brechas) {% #nomad-nmap-web %}

- **Categoria:** `security` | **Porta:** `8537` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Interface gráfica web para execução do lendário auditor de segurança de rede Nmap.

### ⚙️ O que faz
- Permite que você audite sua própria casa antes que um invasor encontre uma brecha de segurança nos seus equipamentos de ...
- Porta padrão mapeada: 8537
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Realiza varreduras detalhadas nos roteadores, câmeras IP, impressoras e computadores da sua casa, identificando portas abertas por engano, protocolos inseguros (Telnet/HTTP sem senha) e serviços vulneráveis.

### 💡 Exemplo Real de Uso
Auditar uma lâmpada ou tomada inteligente comprada na internet para ter certeza de que ela não está tentando abrir portas UPnP ou se comunicar com servidores desconhecidos.

---

## Frigate NVR (Câmeras de Segurança com IA) {% #nomad-frigate %}

- **Categoria:** `security` | **Porta:** `8538` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gravador de vídeo em rede (NVR) de alto desempenho focado em detecção de objetos em tempo real utilizando inteligência artificial local.

### ⚙️ O que faz
- Segurança patrimonial profissional sem pagar assinaturas abusivas de nuvens de câmeras comerciais.
- Porta padrão mapeada: 8538
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se às suas câmeras IP via stream RTSP e processa as imagens na GPU ou no acelerador Coral. Em vez de alarmes falsos de chuva ou folhas ao vento, ele só grava e notifica se detectar uma pessoa, carro ou animal na área delimitada.

### 💡 Exemplo Real de Uso
Uma pessoa se aproxima do portão da sua residência à noite; o Frigate detecta a silhueta humana em 50ms e envia a foto no seu Telegram com a notificação instantânea.

---

## Kasm / Webtop (Navegador Descartável Seguro) {% #nomad-kasm-webtop %}

- **Categoria:** `security` | **Porta:** `8539` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Um ambiente desktop completo ou navegador isolado executado dentro de um contêiner descartável acessível via web.

### ⚙️ O que faz
- Proteção absoluta contra phishing, cavalos de troia e malwares ao baixar arquivos desconhecidos de sites suspeitos.
- Porta padrão mapeada: 8539
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Renderiza uma janela de navegador ou desktop Linux diretamente em uma aba do Chrome. Qualquer arquivo baixado, vírus ou link estranho acessado fica confinado dentro do contêiner e é completamente destruído ao fechar a sessão.

### 💡 Exemplo Real de Uso
Você recebe um link estranho por e-mail dizendo ser um boleto ou nota fiscal; em vez de abrir no seu PC pessoal, você abre no Webtop: se houver vírus, seu computador real não sofre risco algum.

---

## Nginx Proxy Manager (Nomes Amigáveis) {% #nomad-npm %}

- **Categoria:** `networking` | **Porta:** `8520` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerenciador visual de proxy reverso e certificados SSL/TLS Let's Encrypt.

### ⚙️ O que faz
- Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.
- Porta padrão mapeada: 8520
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Mapeia portas e IPs locais para domínios elegantes e amigáveis (ex: `fotos.home.lan` para a porta 8560, `jellyfin.home.lan` para a porta 8096) com renovação automática de certificados criptografados.

### 💡 Exemplo Real de Uso
Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.

---

## Technitium DNS Server (DNS Avançado com DoH) {% #nomad-technitium-dns %}

- **Categoria:** `networking` | **Porta:** `8540` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de DNS local de padrão militar com suporte completo a DNS-over-HTTPS (DoH), DNS-over-TLS (DoT) e bloqueio avançado de requisições.

### ⚙️ O que faz
- Dá privacidade total de navegação para todos os dispositivos e acelera o carregamento de sites através de cache local na...
- Porta padrão mapeada: 8540
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Resolve todas as consultas de nomes da casa diretamente nos servidores raiz da internet, sem passar pelos servidores lentos e monitorados da sua operadora (Claro, Vivo, etc.).

### 💡 Exemplo Real de Uso
Impedir que a operadora de internet registre quais sites você e sua família estão acessando no dia a dia.

---

## Blocky (Controle de Horários & Filtro DNS) {% #nomad-blocky %}

- **Categoria:** `networking` | **Porta:** `8541` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Resolvedor e filtro de DNS leve escrito em Go, desenhado especificamente para controle de acessos por dispositivo e por horários.

### ⚙️ O que faz
- Controle parental soberano e saudável sem precisar instalar aplicativos espiões nos celulares dos filhos.
- Porta padrão mapeada: 8541
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar regras onde, por exemplo, os tablets e videogames das crianças têm o YouTube e redes sociais bloqueados após as 21h ou durante o horário de estudos, enquanto os PCs dos pais continuam com acesso livre.

### 💡 Exemplo Real de Uso
Configurar o horário de sono da casa: às 22h, o Wi-Fi das crianças desativa o acesso a vídeos e jogos automaticamente.

---

## AdGuard Home (Bloqueador de Anúncios na Rede) {% #nomad-adguard %}

- **Categoria:** `networking` | **Porta:** `8545` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidores DNS de bloqueio na camada de rede para toda a residência.

### ⚙️ O que faz
- Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositiv...
- Porta padrão mapeada: 8545
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interceptam e descartam requisições para servidores de telemetria, rastreadores invasivos de Smart TVs e banners de propagandas antes mesmo que eles cheguem aos celulares ou computadores da casa.

### 💡 Exemplo Real de Uso
Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositivo.

---

## Pi-hole (Sumidouro de Telemetria DNS) {% #nomad-pihole %}

- **Categoria:** `networking` | **Porta:** `8545` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidores DNS de bloqueio na camada de rede para toda a residência.

### ⚙️ O que faz
- Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositiv...
- Porta padrão mapeada: 8545
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interceptam e descartam requisições para servidores de telemetria, rastreadores invasivos de Smart TVs e banners de propagandas antes mesmo que eles cheguem aos celulares ou computadores da casa.

### 💡 Exemplo Real de Uso
Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositivo.

---

## SearXNG (Mecanismo de Busca Privativo) {% #nomad-searxng %}

- **Categoria:** `networking` | **Porta:** `8547` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Metamecanismo de busca privativo que agrega resultados do Google, Bing, DuckDuckGo, Wikipedia e Reddit em uma única interface limpa.

### ⚙️ O que faz
- Garante pesquisas completas na web sem criar perfis de comportamento ou direcionamento de anúncios comerciais.
- Porta padrão mapeada: 8547
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Faz as buscas em seu nome, removendo dados do seu IP, histórico, cookies e fingerprint de rastreamento.

### 💡 Exemplo Real de Uso
Garante pesquisas completas na web sem criar perfis de comportamento ou direcionamento de anúncios comerciais.

---

## SmokePing (Auditor de Latência & Micro-Quedas) {% #nomad-smokeping %}

- **Categoria:** `networking` | **Porta:** `8542` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais renomado sistema de medição e diagnóstico de qualidade de sinal de rede e rotas de internet.

### ⚙️ O que faz
- Prova de forma irrefutável para a sua operadora de internet quando a conexão está com instabilidade ou micro-quedas invi...
- Porta padrão mapeada: 8542
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Dispara rajadas periódicas de pacotes ICMP para múltiplos destinos estratégicos (servidores de DNS do Google, Cloudflare, gateway da sua operadora, servidores de jogos) e plota gráficos de dispersão de jitter e perda de pacotes ao longo do tempo.

### 💡 Exemplo Real de Uso
O jogo online ou a chamada de vídeo cai; você abre o SmokePing e vê o gráfico mostrando que exatamente às 15:20 a operadora teve 40% de perda de pacotes na rota externa.

---

## Speedtest Tracker (Histórico de Velocidade) {% #nomad-speedtest %}

- **Categoria:** `networking` | **Porta:** `8543` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel autônomo que executa testes periódicos de velocidade de internet diretamente nos servidores oficiais da Ookla / Speedtest.

### ⚙️ O que faz
- Garante que você está recebendo os megabits contratados pelo plano de fibra ótica.
- Porta padrão mapeada: 8543
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda testes a cada hora de forma programada, registrando velocidade de download, upload e ping em um banco de dados com gráficos históricos e estatísticas de cumprimento de contrato.

### 💡 Exemplo Real de Uso
Descobrir que toda noite às 20h a operadora pratica "traffic shaping" e reduz sua velocidade de 600 Mbps para 120 Mbps.

---

## Uptime Kuma (Monitor de Quedas de Serviços) {% #nomad-uptime-kuma %}

- **Categoria:** `networking` | **Porta:** `8548` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Ferramentas visuais de monitoramento de integridade e tempo de atividade (uptime) de serviços e servidores.

### ⚙️ O que faz
- Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.
- Porta padrão mapeada: 8548
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Testam a cada 30 segundos se cada porta, site, contêiner Docker e ping de roteador está respondendo normalmente. Se qualquer serviço falhar, disparam alarmes sonoros e notificações imediatas.

### 💡 Exemplo Real de Uso
Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.

---

## PeaNUT (Guardião do Nobreak & Energia) {% #nomad-peanut %}

- **Categoria:** `networking` | **Porta:** `8544` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel visual para o Network UPS Tools (NUT), monitorando o nobreak que alimenta seus servidores e roteadores.

### ⚙️ O que faz
- Evita corrupção de dados nos HDs e no sistema de arquivos ZFS durante apagões de energia elétrica.
- Porta padrão mapeada: 8544
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao nobreak via cabo USB ou placa de rede e lê em tempo real a voltagem da tomada, carga da bateria, consumo em Watts e tempo de autonomia restante. Em caso de falta de luz prolongada, comanda o desligamento seguro do TrueNAS e dos contêineres antes que a bateria se esgote.

### 💡 Exemplo Real de Uso
A luz da rua acaba; o PeaNUT notifica no seu celular: "Falta de energia detectada. Homelab operando na bateria com 42 minutos de autonomia estimada".

---

## Immich (Fotos & Vídeos com TrueNAS Mount) {% #nomad-immich %}

- **Categoria:** `media` | **Porta:** `8560` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A mais avançada plataforma de backup e gerenciamento de fotos e vídeos familiares auto-hospedada do mundo.

### ⚙️ O que faz
- Você mencionou que tem 88GB de fotos; o Immich preserva os originais em resolução máxima no seu TrueNAS sem pagar assina...
- Porta padrão mapeada: 8560
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Aplicativo móvel para Android e iOS que faz upload automático em segundo plano das fotos tiradas pelo casal. Possui inteligência artificial local de reconhecimento facial (agrupando fotos por membro da família), busca semântica ("fotos na praia comendo pizza"), visualização em mapa mundi e suporte a montagem no TrueNAS.

### 💡 Exemplo Real de Uso
Sua esposa tira fotos na rua; ao entrar no Wi-Fi de casa, o app sincroniza tudo silenciosamente com o servidor e organiza o álbum do bebê por data e rostos.

---

## Audiobookshelf (Audiolivros & Podcasts) {% #nomad-audiobookshelf %}

- **Categoria:** `media` | **Porta:** `8561` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

### ⚙️ O que faz
- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 8561
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

### 💡 Exemplo Real de Uso
Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---

## TubeArchivist (Seu YouTube Offline Privado) {% #nomad-tubearchivist %}

- **Categoria:** `media` | **Porta:** `8562` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Indexador e arquivador definitivo de canais e playlists do YouTube.

### ⚙️ O que faz
- Preserva vídeos valiosos mesmo se o canal do autor for excluído pelo YouTube ou monetizado em plataformas pagas.
- Porta padrão mapeada: 8562
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Monitora seus canais técnicos, tutoriais de eletrônica e canais infantis favoritos. Quando sai um vídeo novo, baixa em alta definição com legendas, descrição e comentários, permitindo assistir pelo navegador ou app de Smart TV sem anúncios.

### 💡 Exemplo Real de Uso
Salvar playlists inteiras de cursos e tutoriais de bancada para assistir direto no homelab mesmo se o link original sumir da internet.

---

## Piwigo (Álbuns de Família com Acesso Restrito) {% #nomad-piwigo %}

- **Categoria:** `media` | **Porta:** `8563` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma web clássica de galerias de fotos com controle de acesso rigoroso por álbum.

### ⚙️ O que faz
- Compartilhar fotos com parentes sem precisar postar em redes sociais abertas como Instagram ou Facebook.
- Porta padrão mapeada: 8563
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar álbuns de viagens ou eventos familiares e gerar logins específicos para parentes (avós, tios) onde eles só conseguem ver e baixar exatamente aquele álbum autorizado.

### 💡 Exemplo Real de Uso
Compartilhar fotos com parentes sem precisar postar em redes sociais abertas como Instagram ou Facebook.

---

## Music Assistant (Central de Som da Casa) {% #nomad-music-assistant %}

- **Categoria:** `media` | **Porta:** `8564` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O cérebro sonoro da casa, unificando suas músicas locais (Navidrome) com serviços de streaming e tocando em caixas de som de diferentes marcas.

### ⚙️ O que faz
- Acaba com o aprisionamento em ecossistemas fechados de caixas de som de uma única marca.
- Porta padrão mapeada: 8564
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Detecta caixas inteligentes da casa (Chromecast, Google Home, Apple AirPlay, caixas DLNA, Sonos e Raspberry Pi com Snapcast), permitindo enviar a mesma música para a casa toda ou uma música diferente para a sala e para a oficina.

### 💡 Exemplo Real de Uso
Colocar sua playlist de rock tocando em sincronia perfeita na cozinha, sala e bancada de trabalho ao mesmo tempo.

---

## Snapcast (Áudio Multi-Room em Sincronia) {% #nomad-snapcast %}

- **Categoria:** `media` | **Porta:** `8565` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor e cliente de áudio multi-room com sincronização precisa no tempo.

### ⚙️ O que faz
- Porta padrão mapeada: 8565
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Transmite o fluxo de áudio bruto pela rede local para vários alto-falantes e caixas sem delay percebido entre os cômodos da casa.

### 💡 Exemplo Real de Uso
Utilizado para operações de media com controle e soberania local no seu homelab.

---

## Lyrion Music Server (Áudio Audiófilo Bit-Perfect) {% #nomad-lyrion-lms %}

- **Categoria:** `media` | **Porta:** `8566` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Antigo Logitech Squeezebox Server, aclamado por audiófilos por reproduzir arquivos FLAC em alta resolução (24-bit/192kHz) sem compressão ou degradação.

### ⚙️ O que faz
- Porta padrão mapeada: 8566
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8566, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de media com controle e soberania local no seu homelab.

---

## Podgrab (Baixador Silencioso de Podcasts) {% #nomad-podgrab %}

- **Categoria:** `media` | **Porta:** `8567` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Aplicativo leve que se inscreve nos seus podcasts favoritos e baixa automaticamente os novos episódios assim que são lançados, salvando diretamente na pasta do Audiobookshelf.

### ⚙️ O que faz
- Porta padrão mapeada: 8567
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8567, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de media com controle e soberania local no seu homelab.

---

## Your_Spotify (Telemetria Musical Privada) {% #nomad-your-spotify %}

- **Categoria:** `media` | **Porta:** `8568` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel analítico pessoal que registra cada música que você escuta e gera seu próprio "Spotify Wrapped" privativo em tempo real durante o ano todo.

### ⚙️ O que faz
- Porta padrão mapeada: 8568
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8568, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de media com controle e soberania local no seu homelab.

---

## n8n (Automação de Processos & Conexão IA) {% #nomad-n8n %}

- **Categoria:** `automation` | **Porta:** `8580` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais poderoso orquestrador visual de fluxos de trabalho e integrações de APIs de código aberto do mercado.

### ⚙️ O que faz
- É o coração de automação que faz todos os microsserviços do seu homelab conversarem entre si sem que você precise escrev...
- Porta padrão mapeada: 8580
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta nós visuais em um fluxo lógico (Trigger -> Ação -> Condição -> Resposta). Possui suporte nativo a centenas de serviços (Telegram, Discord, bancos SQL, Docker, Home Assistant, Ollama, Firefly III e webhooks HTTP genéricos).

### 💡 Exemplo Real de Uso
Automatizar o registro de despesas bancárias no Firefly III recebendo notificações no webhook, transcrever áudios recebidos pelo Telegram com o Whisper.cpp e notificar você no Mattermost quando um backup terminar com sucesso.

---

## Baserow (Banco de Dados Relacional Visual) {% #nomad-baserow %}

- **Categoria:** `automation` | **Porta:** `8581` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Alternativa auto-hospedada moderna ao Airtable, oferecendo bancos de dados relacionais rápidos com interface visual intuitiva.

### ⚙️ O que faz
- Ideal para estruturar cadastros e catálogos rápidos que exigem relações entre dados sem precisar programar em SQL.
- Porta padrão mapeada: 8581
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar tabelas com campos dinâmicos (fórmulas, relações entre tabelas, arquivos anexados, tags, datas e caixas de seleção), com visualização em Grade, Formulário Web, Galeria e Kanban.

### 💡 Exemplo Real de Uso
Criar um formulário público na sua rede para cadastrar os livros emprestados para amigos ou catalogar ordens de serviço da sua oficina.

---

## NocoDB (Visualizador de Bancos como Planilha) {% #nomad-nocodb %}

- **Categoria:** `automation` | **Porta:** `8582` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Interface no-code que se conecta a bancos de dados relacionais existentes (PostgreSQL, MySQL, SQLite) e os transforma em uma interface visual de planilha colaborativa.

### ⚙️ O que faz
- Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL co...
- Porta padrão mapeada: 8582
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao banco de dados do seu próprio sistema ou de outros contêineres e expõe os dados em tabelas com filtros avançados e geração instantânea de APIs REST.

### 💡 Exemplo Real de Uso
Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL complexos.

---

## Directus (Camada de Dados & Painel API) {% #nomad-directus %}

- **Categoria:** `automation` | **Porta:** `8583` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Backend como serviço (BaaS) e headless CMS instantâneo sobre bancos SQL.

### ⚙️ O que faz
- Porta padrão mapeada: 8583
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Envolve seu banco de dados com autenticação robusta, painel administrativo visual e endpoints de API REST e GraphQL gerados automaticamente.

### 💡 Exemplo Real de Uso
Utilizado para operações de automation com controle e soberania local no seu homelab.

---

## ChangeDetection.io (Monitor de Páginas Web) {% #nomad-changedetection %}

- **Categoria:** `automation` | **Porta:** `8584` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Rastreador de alterações em websites, tabelas de preços e portais de notícias.

### ⚙️ O que faz
- Avisa na hora quando uma peça rara de computador ou componente eletrônico voltar ao estoque ou cair de preço em lojas on...
- Porta padrão mapeada: 8584
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Acessa páginas web em intervalos programados, compara o conteúdo com a versão anterior (com capacidade de selecionar apenas uma tag ou elemento HTML específico) e notifica quando o texto ou preço mudar.

### 💡 Exemplo Real de Uso
Monitorar a página de uma placa de vídeo ou filamento de impressora 3D; o sistema detecta que o preço caiu de R$ 3.200 para R$ 2.400 e manda um alerta com o link direto no seu celular.

---

## Shlink + QR Engine (Links & Etiquetas QR) {% #nomad-shlink %}

- **Categoria:** `automation` | **Porta:** `8585` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerador e encurtador de links e códigos QR com suporte a domínio personalizado da sua rede e estatísticas de cliques.

### ⚙️ O que faz
- Você pode imprimir etiquetas com QR Codes para colar em gaveteiros de parafusos, disjuntores da casa ou manuais de eletr...
- Porta padrão mapeada: 8585
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Transforma links internos compridos em URLs curtas e amigáveis (`http://nx.lan/oficina`) e gera QR Codes vetoriais prontos para impressão.

### 💡 Exemplo Real de Uso
Você pode imprimir etiquetas com QR Codes para colar em gaveteiros de parafusos, disjuntores da casa ou manuais de eletrodomésticos: ao escanear com a câmera do celular, abre diretamente a página técnica correspondente no seu homelab.

---

## Apprise API (Gateway Central de Alertas) {% #nomad-apprise %}

- **Categoria:** `automation` | **Porta:** `8586` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidores dedicados para envio de notificações instantâneas push para computadores e celulares sem intermediários comerciais.

### ⚙️ O que faz
- Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google ...
- Porta padrão mapeada: 8586
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
O Gotify roda um aplicativo leve no seu celular Android mantendo um canal WebSocket aberto diretamente com o seu servidor, entregando alertas de discos cheios, invasões ou quedas de servidores em milissegundos.

### 💡 Exemplo Real de Uso
Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google estiverem fora do ar.

---

## Gotify (Notificações Push Independentes) {% #nomad-gotify %}

- **Categoria:** `automation` | **Porta:** `8586` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidores dedicados para envio de notificações instantâneas push para computadores e celulares sem intermediários comerciais.

### ⚙️ O que faz
- Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google ...
- Porta padrão mapeada: 8586
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
O Gotify roda um aplicativo leve no seu celular Android mantendo um canal WebSocket aberto diretamente com o seu servidor, entregando alertas de discos cheios, invasões ou quedas de servidores em milissegundos.

### 💡 Exemplo Real de Uso
Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google estiverem fora do ar.

---

## InvenTree (Almoxarifado & Peças de Oficina) {% #nomad-inventree %}

- **Categoria:** `workshop` | **Porta:** `8600` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais renomado sistema de controle de estoque de peças técnicas, projetos de hardware e montagens eletrônicas.

### ⚙️ O que faz
- Acaba com o clássico problema de comprar parafusos, relés ou conectores duplicados porque você não sabia que já tinha na...
- Porta padrão mapeada: 8600
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Cadastra fornecedores, códigos de peças de fabricantes (ex: Mouser, Farnell, Mercado Livre), localização exata no gaveteiro (Estante A, Gaveta 3, Divisória 2), listas de materiais (BOM - Bill of Materials) e etiquetas de código de barras.

### 💡 Exemplo Real de Uso
Antes de iniciar um projeto de solda, você abre o projeto no InvenTree e clica em "Verificar Estoque"; ele avisa na hora se você tem todos os componentes necessários ou quais faltam pedir.

---

## PartKeepr (Estoque de Componentes Eletrônicos) {% #nomad-partkeepr %}

- **Categoria:** `workshop` | **Porta:** `8601` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Sistema especializado em catalogar resistores, capacitores, transistores, microcontroladores (ESP32, STM32, Arduino) e chips SMD.

### ⚙️ O que faz
- Porta padrão mapeada: 8601
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Registra parâmetros elétricos (tolerância, encapsulamento 0805/0603, tensão máxima, datasheets em PDF anexados) e quantidade disponível em cada carretel ou fita.

### 💡 Exemplo Real de Uso
Utilizado para operações de workshop com controle e soberania local no seu homelab.

---

## KiCad Web (Visualizador de Circuitos PCB) {% #nomad-kicad-web %}

- **Categoria:** `workshop` | **Porta:** `8602` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Visualizadores leves no navegador para arquivos de circuitos impressos (.kicad_pcb, .sch) e plantas técnicas em 2D (.dxf, .dwg).

### ⚙️ O que faz
- Porta padrão mapeada: 8602
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite abrir e inspecionar camadas de PCBs, esquemáticos e desenhos mecânicos em qualquer celular, tablet ou laptop sem precisar ter o software CAD pesado instalado na máquina.

### 💡 Exemplo Real de Uso
Utilizado para operações de workshop com controle e soberania local no seu homelab.

---

## LibreCAD Web (Desenho Técnico 2D) {% #nomad-librecad-web %}

- **Categoria:** `workshop` | **Porta:** `8602` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Visualizadores leves no navegador para arquivos de circuitos impressos (.kicad_pcb, .sch) e plantas técnicas em 2D (.dxf, .dwg).

### ⚙️ O que faz
- Porta padrão mapeada: 8602
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite abrir e inspecionar camadas de PCBs, esquemáticos e desenhos mecânicos em qualquer celular, tablet ou laptop sem precisar ter o software CAD pesado instalado na máquina.

### 💡 Exemplo Real de Uso
Utilizado para operações de workshop com controle e soberania local no seu homelab.

---

## Mainsail (Servidor de Impressão 3D) {% #nomad-mainsail %}

- **Categoria:** `workshop` | **Porta:** `8604` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
A mais rápida e elegante interface de controle e telemetria para impressoras 3D rodando firmware Klipper e Moonraker.

### ⚙️ O que faz
- Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.
- Porta padrão mapeada: 8604
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se à impressora 3D via rede, exibindo temperaturas de bico e mesa em gráficos suaves, câmera ao vivo com time-lapses, controle de velocidade e upload de arquivos G-code.

### 💡 Exemplo Real de Uso
Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.

---

## OpenWebRX (Rádio SDR & Satélite NOAA) {% #nomad-openwebrx %}

- **Categoria:** `workshop` | **Porta:** `8605` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor SDR (Software Defined Radio) com interface web interativa de espectro em cascata (waterfall).

### ⚙️ O que faz
- Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completam...
- Porta padrão mapeada: 8605
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se a um dongle USB RTL-SDR e permite sintonizar frequências de rádio AM/FM, escuta aérea, rádio amador, alertas de defesa civil e decodificar imagens ao vivo de satélites meteorológicos NOAA.

### 💡 Exemplo Real de Uso
Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completamente.

---

## Mattermost (Chat Corporativo & Familiar) {% #nomad-mattermost %}

- **Categoria:** `communication` | **Porta:** `8620` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma corporativa e familiar de mensagens instantâneas com canais, threads e suporte a bots.

### ⚙️ O que faz
- Um espaço limpo para a comunicação da família e para receber todas as notificações dos servidores em um aplicativo profi...
- Porta padrão mapeada: 8620
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece canais organizados (ex: `#geral`, `#reformas-casa`, `#alertas-homelab`, `#ideias-projetos`), compartilhamento de arquivos pesados, chamadas e integração total com os webhooks do n8n e Frigate.

### 💡 Exemplo Real de Uso
Um espaço limpo para a comunicação da família e para receber todas as notificações dos servidores em um aplicativo profissional no celular.

---

## Matrix Synapse (Mensageiro Criptografado) {% #nomad-synapse %}

- **Categoria:** `communication` | **Porta:** `8621` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor do protocolo federado Matrix com cliente web Cinny (interface com visual idêntico ao Discord).

### ⚙️ O que faz
- Porta padrão mapeada: 8621
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Criptografia de ponta a ponta nativa (E2EE) onde somente você e o destinatário têm a chave de decodificação das conversas, sem possibilidade de leitura por terceiros.

### 💡 Exemplo Real de Uso
Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## Cinny (Interface Web Matrix Estilo Discord) {% #nomad-cinny %}

- **Categoria:** `communication` | **Porta:** `8621` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor do protocolo federado Matrix com cliente web Cinny (interface com visual idêntico ao Discord).

### ⚙️ O que faz
- Porta padrão mapeada: 8621
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Criptografia de ponta a ponta nativa (E2EE) onde somente você e o destinatário têm a chave de decodificação das conversas, sem possibilidade de leitura por terceiros.

### 💡 Exemplo Real de Uso
Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## Mumble Server (Voz de Ultra-Baixa Latência) {% #nomad-mumble %}

- **Categoria:** `communication` | **Porta:** `8623` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de áudio e comunicação por voz de latência mínima e altíssima compressão Opus.

### ⚙️ O que faz
- Porta padrão mapeada: 8623
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite conversa por voz em tempo real contínua entre cômodos, oficina e escritório com latência inferior a 10 milissegundos e consumo de banda desprezível.

### 💡 Exemplo Real de Uso
Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## Jitsi Meet (Videoconferências em HD Sem Nuvem) {% #nomad-jitsi %}

- **Categoria:** `communication` | **Porta:** `8624` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma profissional de chamadas em vídeo e reuniões virtuais sem limite de tempo, sem anúncios e sem cadastro obrigatório.

### ⚙️ O que faz
- Porta padrão mapeada: 8624
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Abre salas com compartilhamento de tela em alta taxa de quadros e criptografia direta no navegador.

### 💡 Exemplo Real de Uso
Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## FreePBX / Asterisk (Central Telefônica IP) {% #nomad-freepbx %}

- **Categoria:** `communication` | **Porta:** `8625` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Central telefônica PBX completa com suporte a ramais SIP, interfonia e gravação de chamadas.

### ⚙️ O que faz
- Porta padrão mapeada: 8625
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite transformar celulares, computadores ou telefones IP da casa em ramais internos (ex: ramal 101 para a sala, ramal 102 para a bancada, ramal 103 para o quarto), permitindo chamadas internas gratuitas sem sinal de celular.

### 💡 Exemplo Real de Uso
Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## Etherpad Lite (Editor em Tempo Real Colaborativo) {% #nomad-etherpad %}

- **Categoria:** `productivity` | **Porta:** `8626` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Editores de texto colaborativo simultâneo onde duas ou mais pessoas escrevem no mesmo documento vendo o cursor do outro em tempo real.

### ⚙️ O que faz
- Porta padrão mapeada: 8626
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8626, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## HedgeDoc (Documentos Colaborativos em Markdown) {% #nomad-hedgedoc %}

- **Categoria:** `productivity` | **Porta:** `8626` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Editores de texto colaborativo simultâneo onde duas ou mais pessoas escrevem no mesmo documento vendo o cursor do outro em tempo real.

### ⚙️ O que faz
- Porta padrão mapeada: 8626
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8626, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## RustDesk Server (Suporte & Acesso Remoto) {% #nomad-rustdesk %}

- **Categoria:** `utility` | **Porta:** `8640` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de controle e relay para acesso remoto gráfico a desktops e celulares.

### ⚙️ O que faz
- Controle e suporte remoto imediato aos computadores da família com soberania absoluta.
- Porta padrão mapeada: 8640
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite controlar qualquer PC ou notebook da sua casa ou do seu trabalho à distância com altíssima taxa de quadros e criptografia ponta a ponta, sem depender dos servidores comerciais lentos do TeamViewer.

### 💡 Exemplo Real de Uso
Controle e suporte remoto imediato aos computadores da família com soberania absoluta.

---

## Beszel (Telemetria Cyberpunk da Máquina & GPU) {% #nomad-beszel %}

- **Categoria:** `utility` | **Porta:** `8641` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais moderno, leve e esteticamente impecável painel de telemetria de servidores.

### ⚙️ O que faz
- Porta padrão mapeada: 8641
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Coleta o uso de CPU, memória, tráfego de rede e temperatura dos sensores com um consumo de recursos quase zero (< 20MB de RAM) e suporte oficial ao monitoramento da sua placa de vídeo RTX 5060.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## Dockge (Gerenciador Visual de Docker Compose) {% #nomad-dockge %}

- **Categoria:** `utility` | **Porta:** `8642` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerenciador visual interativo de stacks Docker Compose criado por Louis Lam (mesmo autor do Uptime Kuma).

### ⚙️ O que faz
- Porta padrão mapeada: 8642
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Lê os arquivos `compose.yaml` diretamente do disco, permitindo editar, iniciar, parar e atualizar contêineres com um editor visual e terminal interativo na web.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## Forgejo / Gitea (Seu GitHub Privado no TrueNAS) {% #nomad-forgejo %}

- **Categoria:** `productivity` | **Porta:** `8643` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor Git auto-hospedado completo com suporte a issues, pull requests, wikis, releases e revisão de código.

### ⚙️ O que faz
- Porta padrão mapeada: 8643
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Guarda todo o código dos seus projetos de software, automações, scripts e firmwares de hardware diretamente no seu TrueNAS com controle de versão seguro e sem risco de exclusão de contas na nuvem.

### 💡 Exemplo Real de Uso
Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## Woodpecker CI (Compilação & Testes de Scripts) {% #nomad-woodpecker %}

- **Categoria:** `utility` | **Porta:** `8644` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor leve de integração contínua (CI/CD) baseado em contêineres Docker, perfeitamente integrado ao Forgejo/Gitea.

### ⚙️ O que faz
- Porta padrão mapeada: 8644
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8644, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## ArchiveBox (Preservador Eterno da Internet) {% #nomad-archivebox %}

- **Categoria:** `utility` | **Porta:** `8645` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O seu próprio Wayback Machine privativo.

### ⚙️ O que faz
- Garante que tutoriais técnicos essenciais, artigos de referência e provas documentais nunca se percam se o site de orige...
- Porta padrão mapeada: 8645
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Quando você envia um link, ele salva a página em múltiplos formatos à prova de falhas: página HTML bruta, imagem de captura de tela em resolução completa, PDF com layout impresso, arquivo WARC e vídeo MP4 (se houver mídia).

### 💡 Exemplo Real de Uso
Garante que tutoriais técnicos essenciais, artigos de referência e provas documentais nunca se percam se o site de origem for desativado.

---

## Duplicati (Backup Criptografado & Desduplicado) {% #nomad-duplicati %}

- **Categoria:** `utility` | **Porta:** `8646` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Ferramentas de backup com criptografia AES-256 e sincronização de dados desduplicados entre discos locais e nuvens frias.

### ⚙️ O que faz
- Porta padrão mapeada: 8646
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8646, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## Rclone Web (Central de Sincronização) {% #nomad-rclone-web %}

- **Categoria:** `utility` | **Porta:** `5572` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Interface web moderna do motor Rclone para gerenciar transferências, sincronizações criptografadas e backups entre discos locais e nuvens.

### ⚙️ O que faz
- Suporte a mais de 40 provedores (Google Drive, OneDrive, S3, SFTP, WebDAV)
- Criptografia transparente de arquivos na origem antes do envio
- Painel visual com controle de velocidade, filas e logs em tempo real
- Montagem de pastas remotas como discos locais

### 🧠 Como funciona
Atua como uma camada de abstração universal de armazenamento, transferindo arquivos com verificação de integridade MD5/SHA-1.

### 💡 Exemplo Real de Uso
Fazer backup criptografado das suas fotos do N.O.M.A.D. para uma conta de nuvem; se a nuvem for invadida, ninguém consegue ver suas fotos porque estão indecifráveis.

---

## Microbin (Pastebin Privado com Autodestruição) {% #nomad-microbin %}

- **Categoria:** `utility` | **Porta:** `8648` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Compartilhador ultrarrápido de trechos de código, logs e senhas temporárias com expiração por tempo ou leitura única.

### ⚙️ O que faz
- Porta padrão mapeada: 8648
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8648, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## CUPS Print Server (Central de Impressão da Casa) {% #nomad-cups %}

- **Categoria:** `utility` | **Porta:** `8649` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor universal de impressão baseado em padrões abertos.

### ⚙️ O que faz
- Porta padrão mapeada: 8649
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta impressoras antigas que não têm Wi-Fi via USB no servidor e as compartilha pela rede com suporte nativo a AirPrint para imprimir direto do iPhone, iPad, Android e Windows sem instalar drivers proprietários.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## UrBackup (Backup Invisível Bare-Metal dos PCs) {% #nomad-urbackup %}

- **Categoria:** `utility` | **Porta:** `8650` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
O mais robusto sistema de backup bare-metal cliente-servidor para computadores Windows e Linux.

### ⚙️ O que faz
- Porta padrão mapeada: 8650
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda um cliente silencioso em segundo plano nos computadores da casa. Cria cópias de segurança automáticas de imagens completas de disco pela rede: se o SSD do seu computador queimar, basta plugar um novo disco e restaurar a máquina exatamente como estava em minutos.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## WeeWX (Estação Meteorológica & Histórico Climático) {% #nomad-weewx %}

- **Categoria:** `utility` | **Porta:** `8651` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Software especializado em coletar e arquivar dados climáticos de estações meteorológicas domésticas.

### ⚙️ O que faz
- Porta padrão mapeada: 8651
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se a sensores climáticos (temperatura, umidade, pressão atmosférica, velocidade do vento e índice UV), gerando relatórios gráficos históricos no navegador.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## Planka (Kanban para Projetos & Metas) {% #nomad-planka %}

- **Categoria:** `productivity` | **Porta:** `8652` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Quadro Kanban moderno e veloz para acompanhamento de tarefas, projetos de engenharia e metas familiares.

### ⚙️ O que faz
- Porta padrão mapeada: 8652
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 8652, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## FreshRSS (Notícias sem Algoritmo com Contas) {% #nomad-freshrss %}

- **Categoria:** `productivity` | **Porta:** `8653` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Leitor de feeds RSS auto-hospedado com suporte nativo a contas de usuários independentes (uma para você, uma para sua esposa e contas futuras para os filhos).

### ⚙️ O que faz
- Porta padrão mapeada: 8653
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Cada membro da família tem seus próprios feeds de notícias, categorias e histórico de leitura separados, com sincronização em aplicativos móveis como NetNewsWire e ReadYou.

### 💡 Exemplo Real de Uso
Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## Pingvin Share (Envio de Arquivos Grandes) {% #nomad-pingvin-share %}

- **Categoria:** `utility` | **Porta:** `3000` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Compartilhamento privado de arquivos e pastas pesadas com links protegidos por senha e prazo de expiração automático.

### ⚙️ O que faz
- Substituto soberano do WeTransfer sem limite arbitrário de tamanho
- Links protegidos por senha e número máximo de downloads
- Exclusão automática dos arquivos após a data limite configurada
- Interface limpa e rápida com suporte a múltiplos arquivos

### 🧠 Como funciona
Faz upload do arquivo diretamente para o disco do seu servidor e gera um link seguro para você mandar no WhatsApp ou e-mail de amigos.

### 💡 Exemplo Real de Uso
Enviar um vídeo em 4K de 5GB gravado no aniversário do seu filho para os avós através de um link direto que expira em 7 dias.

---

## Wake-on-LAN Hub (Ligar PCs Remotamente) {% #nomad-wol-web %}

- **Categoria:** `networking` | **Porta:** `8080` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Painel web tático para disparar pacotes mágicos Wake-on-LAN e ligar servidores e computadores da casa à distância com um clique.

### ⚙️ O que faz
- Lista de computadores cadastrados com endereço MAC e IP
- Disparo de pacotes mágicos UDP broadcast pela rede local
- Ping integrado para mostrar se a máquina está ligada ou desligada
- Interface web adaptada para celulares

### 🧠 Como funciona
Envia pacotes de rede broadcast contendo a assinatura hexadecimal do endereço MAC da placa de rede, acordando o computador desligado.

### 💡 Exemplo Real de Uso
Você está na rua e precisa acessar os arquivos do seu PC de jogos potente; entra no N.O.M.A.D. pelo celular, clica em Ligar PC e conecta via RustDesk em 30 segundos.

---

## DokuWiki (Wiki em Texto Puro) {% #nomad-dokuwiki %}

- **Categoria:** `productivity` | **Porta:** `8080` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Wiki colaborativa extremamente rápida e leve que armazena todas as páginas diretamente em arquivos de texto puro sem exigir banco de dados.

### ⚙️ O que faz
- Armazenamento em arquivos de texto puro (.txt) fáceis de fazer backup
- Sintaxe wiki simples e suporte a tabelas e imagens
- Controle de acesso granular e histórico de revisões
- Centenas de plugins e temas personalizáveis

### 🧠 Como funciona
Grava cada artigo diretamente no sistema de arquivos do Linux. Para fazer backup ou migrar, basta copiar a pasta de arquivos.

### 💡 Exemplo Real de Uso
Criar o manual de emergência da residência para que qualquer pessoa leia mesmo se o banco de dados SQL do servidor falhar.

---

## Homepage (Painel Tático do Homelab) {% #nomad-homepage %}

- **Categoria:** `utility` | **Porta:** `3000` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Dashboard moderno e altamente customizável para monitorar os serviços, contêineres e recursos do seu homelab em uma única tela tática.

### ⚙️ O que faz
- Integração nativa com Docker, Portainer, TrueNAS, AdGuard, Proxmox e Weather
- Widgets dinâmicos de consumo de CPU, memória, temperatura e armazenamento
- Busca rápida integrada e categorização visual de aplicações
- Configuração declarativa em arquivos YAML simples

### 🧠 Como funciona
Consulta as APIs locais dos contêineres e sistemas operacionais e renderiza uma página única de alta performance com temas modernos.

### 💡 Exemplo Real de Uso
Deixar um tablet antigo na parede da sala ou da oficina exibindo o status de todos os contêineres do homelab e o clima da cidade.

---

## Home Assistant (Automação Residencial) {% #nomad-homeassistant %}

- **Categoria:** `automation` | **Porta:** `8123` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Central soberana de automação residencial inteligente, conectando sensores, lâmpadas, câmeras e interruptores em um único painel local.

### ⚙️ O que faz
- Suporte a Zigbee, Z-Wave, Matter, Wi-Fi e Bluetooth
- Automações locais complexas sem depender de servidores em nuvem
- Painéis visuais customizáveis para celular, tablet e computador
- Histórico detalhado de consumo de energia e sensores

### 🧠 Como funciona
Descobre e integra dispositivos inteligentes na sua rede local, executando automações com latência zero e total privacidade.

### 💡 Exemplo Real de Uso
Ao abrir a porta de casa à noite, o Home Assistant detecta o sensor e acende a luz da sala suavemente, sem enviar dados para servidores da China ou EUA.

---

## Traccar (Rastreamento GPS & Frotas) {% #nomad-traccar %}

- **Categoria:** `security` | **Porta:** `8082` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Servidor de rastreamento de veículos, motos e celulares com telemetria GPS, cercas virtuais e alertas em tempo real.

### ⚙️ O que faz
- Compatível com mais de 1.500 modelos de rastreadores GPS do mercado
- Rastreamento de celulares Android e iOS via aplicativo leve
- Criação de cercas geográficas com alertas de entrada e saída
- Histórico de rotas, velocidade e paradas com reprodução visual

### 🧠 Como funciona
Recebe coordenadas de rastreadores veiculares via TCP/UDP ou HTTP e plota em mapas locais com cálculo de odômetro e velocidade.

### 💡 Exemplo Real de Uso
Você instala um rastreador de R$ 80 no carro; ele envia as coordenadas direto para o seu servidor N.O.M.A.D., sem mensalidades de empresas de rastreamento.

---

## Vikunja (Gestão de Tarefas & Metas) {% #nomad-vikunja %}

- **Categoria:** `productivity` | **Porta:** `3456` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Plataforma completa de gerenciamento de tarefas, checklists operacionais, prazos e projetos com visual moderno Kanban e lista.

### ⚙️ O que faz
- Modos de visualização em Lista, Kanban, Tabela e Gráfico de Gantt
- Subtarefas, lembretes com datas de vencimento e prioridades
- Compartilhamento de listas com a esposa ou equipe com controle de permissão
- Sincronização com calendários via CalDAV

### 🧠 Como funciona
Backend em Go ultra-eficiente com frontend moderno em Vue, persistindo dados em SQLite ou PostgreSQL com suporte a webhooks.

### 💡 Exemplo Real de Uso
Organizar o plano de manutenção preventiva do carro (troca de óleo, pastilhas, filtros) com alertas automáticos para as datas certas.

---

## Linkding (Marcadores & Favoritos) {% #nomad-linkding %}

- **Categoria:** `productivity` | **Porta:** `9090` | **Tipo:** `Nativo NOMAD`

### 🎯 Para que serve
Gerenciador e arquivador de marcadores (bookmarks) ultra-rápido, limpo e com busca instantânea de links e artigos salvos.

### ⚙️ O que faz
- Interface minimalista de altíssima velocidade sem distrações
- Tags inteligentes (#artigo, #homelab, #receita) e busca instantânea
- Arquivamento automático de cópias de páginas no Wayback Machine ou localmente
- Extensões oficiais para Chrome e Firefox e atalho no celular

### 🧠 Como funciona
Construído em Python/Django com banco SQLite. Ao salvar um link, ele extrai título, descrição e arquiva uma cópia para leitura futura.

### 💡 Exemplo Real de Uso
Salvar tutoriais técnicos que você encontra na internet para ler mais tarde, garantindo que o conteúdo permaneça acessível mesmo se o site original sair do ar.

---
