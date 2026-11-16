# Catálogo & Guia Completo de Aplicativos N.O.M.A.D.

O **Catálogo de Aplicativos do Nexus N.O.M.A.D.** reúne tanto as ferramentas nativas integradas quanto todo o **Arsenal Soberano** com mais de 100 microsserviços auto-hospedados.

Esta página reúne a documentação operacional de cada aplicativo: **Para que serve**, **O que faz**, **Como funciona** e **Exemplos práticos de uso real** na sua residência, homelab e família.

---

## Biblioteca Offline (Kiwix) {% #nomad-kiwix-server %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Banco Vetorial Qdrant {% #nomad-qdrant %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Alternativa auto-hospedada moderna ao Airtable, oferecendo bancos de dados relacionais rápidos com interface visual intuitiva.

### ⚙️ O que faz
- Ideal para estruturar cadastros e catálogos rápidos que exigem relações entre dados sem precisar programar em SQL.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar tabelas com campos dinâmicos (fórmulas, relações entre tabelas, arquivos anexados, tags, datas e caixas de seleção), com visualização em Grade, Formulário Web, Galeria e Kanban.

### 💡 Exemplo Real de Uso
Criar um formulário público na sua rede para cadastrar os livros emprestados para amigos ou catalogar ordens de serviço da sua oficina.

---


## Assistente de IA {% #nomad-ollama %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Aplicativo colaborativo leve para gerenciamento de despensa e listas de compras inteligentes sincronizadas entre celulares.

### ⚙️ O que faz
- Alternativa mais ágil e direta para o dia a dia quando você deseja focar apenas na dinâmica de compras rápidas do casal.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que membros da família marquem itens conforme acabam em casa. Organiza as listas por categorias de corredores do mercado (Hortifrúti, Laticínios, Limpeza).

### 💡 Exemplo Real de Uso
Um de vocês está no supermercado riscando os itens comprados na tela do celular enquanto o outro adiciona um item esquecido de casa, e a lista atualiza em tempo real.

---


## Ferramentas de Dados {% #nomad-cyberchef %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---


## Bloco de Notas {% #nomad-flatnotes %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Caderno de anotações rápidas em Markdown salvo diretamente no armazenamento local

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Plataforma Educacional (Kolibri) {% #nomad-kolibri-2 %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Escola interativa offline com cursos em vídeo, Khan Academy em português e exercícios

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Stirling PDF {% #nomad-stirling-pdf %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Estúdio completo de PDF offline — juntar, dividir, comprimir, converter e OCR

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Gerenciador de Arquivos {% #nomad-filebrowser %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador visual interativo de stacks Docker Compose criado por Louis Lam (mesmo autor do Uptime Kuma).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Lê os arquivos `compose.yaml` diretamente do disco, permitindo editar, iniciar, parar e atualizar contêineres com um editor visual e terminal interativo na web.

### 💡 Exemplo Real de Uso


---


## Biblioteca de Livros (Calibre Web) {% #nomad-calibreweb %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

### ⚙️ O que faz
- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

### 💡 Exemplo Real de Uso
Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---


## Ferramentas de TI {% #nomad-it-tools %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Coleção de utilitários técnicos offline — conversores, rede, hashes, geradores e formatação

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona


### 💡 Exemplo Real de Uso


---


## Quadro Branco (Excalidraw) {% #nomad-excalidraw %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Quadro visual offline para desenhar plantas, esquemas elétricos, projetos hidráulicos e diagramas

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Rádio Mesh LoRa (Meshtastic) {% #nomad-meshtastic-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Implementação auto-hospedada e de código aberto do servidor de controle Tailscale / Netbird.

### ⚙️ O que faz
- Dá a comodidade do Tailscale sem depender dos servidores corporativos de terceiros para guardar a chave de roteamento da...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta todos os seus computadores, servidores, TrueNAS e celulares em uma única rede mesh ponto a ponto criptografada, permitindo que eles se comuniquem diretamente mesmo atrás de roteadores e CGNAT da operadora de internet.

### 💡 Exemplo Real de Uso
Você está no trabalho usando o notebook; digita `ssh truenas.nexus` e acessa o terminal do seu servidor em casa sem precisar abrir nenhuma porta no roteador.

---


## Terminal LoRa MeshCore {% #nomad-meshcore-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Cliente web alternativo para conexão e troca de mensagens via nós de rádio LoRa MeshCore

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Inventário Doméstico (Homebox) {% #nomad-homebox %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Controle de estoque familiar — cadastre ferramentas, sementes, remédios, peças e suprimentos

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Cofre de Senhas (Vaultwarden) {% #nomad-vaultwarden %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor de senhas criptografado compatível com Bitwarden — proteja suas credenciais offline

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Servidor de Mídia (Jellyfin) {% #nomad-jellyfin %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A mais rápida e elegante interface de controle e telemetria para impressoras 3D rodando firmware Klipper e Moonraker.

### ⚙️ O que faz
- Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se à impressora 3D via rede, exibindo temperaturas de bico e mesa em gráficos suaves, câmera ao vivo com time-lapses, controle de velocidade e upload de arquivos G-code.

### 💡 Exemplo Real de Uso
Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.

---


## Tradutor Offline da Biblioteca {% #nomad-translate %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Sincronização P2P (Syncthing) {% #nomad-syncthing %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Ferramentas de backup com criptografia AES-256 e sincronização de dados desduplicados entre discos locais e nuvens frias.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona


### 💡 Exemplo Real de Uso


---


## Músicas & Audiolivros (Navidrome) {% #nomad-navidrome %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor leve de streaming offline para suas músicas, podcasts e audiolivros armazenados nos discos

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Wiki & Base de Conhecimento (Wiki.js) {% #nomad-wikijs %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A ferramenta definitiva de documentação de equipe e projetos, combinando a elegância do Notion com a velocidade do Markdown e segurança corporativa.

### ⚙️ O que faz
- É a resposta perfeita para quem não gostou da interface do BookStack. O Outline possui design limpo, moderno, suporte a ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida com suporte a múltiplos espaços de trabalho, histórico de versões, busca textual em tempo real, suporte a IA para expansão de textos e controle fino de permissões.

### 💡 Exemplo Real de Uso
Documentar todo o seu homelab, topologias de rede, manuais dos seus projetos eletrônicos e procedimentos operacionais (SOPs) para que qualquer pessoa consiga manter a infraestrutura funcionando.

---


## Monitor de Logs Docker (Dozzle) {% #nomad-dozzle %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Ferramentas visuais de monitoramento de integridade e tempo de atividade (uptime) de serviços e servidores.

### ⚙️ O que faz
- Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Testam a cada 30 segundos se cada porta, site, contêiner Docker e ping de roteador está respondendo normalmente. Se qualquer serviço falhar, disparam alarmes sonoros e notificações imediatas.

### 💡 Exemplo Real de Uso
Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.

---


## Arquivo Digital & OCR (Paperless-ngx) {% #nomad-paperless %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor PACS e visualizador de exames médicos de imagem (Raios-X, Tomografias, Ressonâncias Magnéticas e Ultrassons).

### ⚙️ O que faz
- Garante que o histórico radiológico de toda a sua vida fique guardado no TrueNAS sem perda de resolução ou compressão de...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Recebe os arquivos digitais em formato nativo DICOM que vêm nos CDs/pen-drives de laboratórios e clínicas, permitindo visualização de cortes em alta fidelidade pelo navegador.

### 💡 Exemplo Real de Uso
Você precisa comparar uma ressonância de joelho ou coluna feita há 5 anos com uma atual; o Orthanc abre as duas lado a lado no navegador para o médico avaliar.

---


## Open WebUI (Chat IA Local) {% #nomad-open-webui %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Interface web de chat estilo ChatGPT / Claude com suporte nativo a Ollama, vLLM e OpenAI API.

### ⚙️ O que faz
- Permite aproveitar todo o potencial da sua **RTX 5060** rodando modelos como Llama 3.2, Mistral, Qwen e DeepSeek sem env...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao daemon do Ollama na porta 11434 e renderiza uma UI rica com suporte a RAG (Retrieval Augmented Generation), upload de documentos PDF/DOCX, navegação web privativa, execução de código e múltiplos usuários com controle de acesso.

### 💡 Exemplo Real de Uso
Você sobe o manual da sua placa-mãe ou um PDF de 500 páginas e pergunta *"Qual é o barramento PCIe correto para colocar o segundo SSD NVMe?"*, e o Open WebUI responde em segundos citando a página exata.

---


## Dify (Automação de Agentes IA) {% #nomad-dify %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma avançada para construção visual de fluxos de agentes de IA, RAG multi-etapas e assistentes automatizados.

### ⚙️ O que faz
- Transforma seus modelos locais de simples "chatbots" em verdadeiros funcionários digitais que executam tarefas complexas...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece um construtor de pipelines no-code onde você pode ligar modelos de IA locais, bancos vetoriais (Qdrant), raspadores de web e webhooks externos para criar ferramentas que tomam decisões de forma autônoma.

### 💡 Exemplo Real de Uso
Criar um agente que lê seus e-mails ou alertas do homelab, resume os pontos críticos e notifica você no Mattermost ou Gotify apenas se houver algo urgente.

---


## Outline (Base de Conhecimento & Projetos) {% #nomad-outline %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A ferramenta definitiva de documentação de equipe e projetos, combinando a elegância do Notion com a velocidade do Markdown e segurança corporativa.

### ⚙️ O que faz
- É a resposta perfeita para quem não gostou da interface do BookStack. O Outline possui design limpo, moderno, suporte a ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida com suporte a múltiplos espaços de trabalho, histórico de versões, busca textual em tempo real, suporte a IA para expansão de textos e controle fino de permissões.

### 💡 Exemplo Real de Uso
Documentar todo o seu homelab, topologias de rede, manuais dos seus projetos eletrônicos e procedimentos operacionais (SOPs) para que qualquer pessoa consiga manter a infraestrutura funcionando.

---


## Docmost (Wiki & Workspace Colaborativo) {% #nomad-docmost %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma moderna de edição de notas e documentos colaborativos em tempo real, baseada em blocos e totalmente open-source.

### ⚙️ O que faz
- Excelente para atas de reuniões rápidas, listas de tarefas dinâmicas e brainstorming colaborativo sem depender de Google...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que várias pessoas editem o mesmo documento simultaneamente, com renderização de diagramas Mermaid, equações matemáticas KaTeX, tabelas e links bidirecionais.

### 💡 Exemplo Real de Uso
Planejar viagens ou reformas da casa com sua esposa, editando ao mesmo tempo a lista de compras de materiais e custos estimados.

---


## Hoarder (Coletor Inteligente com IA) {% #nomad-hoarder %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O melhor gerenciador de bookmarks e "leia mais tarde" já criado para homelabs, turbinado com IA.

### ⚙️ O que faz
- Preserva todo o conhecimento que você descobre na web mesmo se o site original for derrubado ou virar pago.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você envia um link, tweet, imagem ou PDF via extensão de navegador ou app móvel. O Hoarder arquiva a página inteira offline, extrai o texto limpo sem anúncios, aciona o Ollama local na sua máquina para classificar categorias, gerar resumo e criar tags automáticas.

### 💡 Exemplo Real de Uso
Salvar artigos de eletrônica ou threads técnicas; a IA lê o artigo, gera tags como `#kicad`, `#firmware`, `#rtx` e você acha tudo instantaneamente pela busca inteligente.

---


## Whisper.cpp (Transcrição Offline de Voz) {% #nomad-whisper %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Grocy (ERP Residencial & Despensa) {% #nomad-grocy %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema profissional de gerenciamento de estoque doméstico, validade de alimentos e manutenção residencial.

### ⚙️ O que faz
- Acaba com o desperdício de comida e de remédios que passam da validade sem ninguém notar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conectado a um leitor de código de barras USB ou câmera do celular, cadastra cada item que entra na despensa ou congelador. Avisa antes dos alimentos vencerem, rastreia consumo e sugere compras.

### 💡 Exemplo Real de Uso
Ler o código de barras da caixa de leite ao chegar do mercado; o sistema registra a data de validade e abate automaticamente uma unidade quando você marca como consumido.

---


## Mealie (Livro de Receitas & Supermercado) {% #nomad-mealie %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador gastronômico familiar com extração automática de receitas de qualquer site.

### ⚙️ O que faz
- Permite que você e sua esposa planejem as refeições da semana com visual limpo no tablet da cozinha e gerem a lista de c...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cola a URL de qualquer receita da internet (sites de culinária, YouTube, blogs); o Mealie raspa a página, descarta pop-ups e biografias chatas, salva apenas os ingredientes exatos, modo de preparo passo a passo e fotos.

### 💡 Exemplo Real de Uso
Sua esposa encontra uma receita incrível na internet, envia o link para o Mealie pelo celular, clica em "Adicionar à lista de compras" e os ingredientes vão direto para a lista do supermercado.

---


## KitchenOwl (Cardápios & Despensa Inteligente) {% #nomad-kitchenowl %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema profissional de gerenciamento de estoque doméstico, validade de alimentos e manutenção residencial.

### ⚙️ O que faz
- Acaba com o desperdício de comida e de remédios que passam da validade sem ninguém notar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conectado a um leitor de código de barras USB ou câmera do celular, cadastra cada item que entra na despensa ou congelador. Avisa antes dos alimentos vencerem, rastreia consumo e sugere compras.

### 💡 Exemplo Real de Uso
Ler o código de barras da caixa de leite ao chegar do mercado; o sistema registra a data de validade e abate automaticamente uma unidade quando você marca como consumido.

---


## BabyBuddy (Prontuário Médico Familiar) {% #nomad-babybuddy %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---


## OpenREM / DICOM (Arquivo de Exames Médicos) {% #nomad-openrem %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor PACS e visualizador de exames médicos de imagem (Raios-X, Tomografias, Ressonâncias Magnéticas e Ultrassons).

### ⚙️ O que faz
- Garante que o histórico radiológico de toda a sua vida fique guardado no TrueNAS sem perda de resolução ou compressão de...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Recebe os arquivos digitais em formato nativo DICOM que vêm nos CDs/pen-drives de laboratórios e clínicas, permitindo visualização de cortes em alta fidelidade pelo navegador.

### 💡 Exemplo Real de Uso
Você precisa comparar uma ressonância de joelho ou coluna feita há 5 anos com uma atual; o Orthanc abre as duas lado a lado no navegador para o médico avaliar.

---


## Gramps Web (Árvore Genealógica Privada) {% #nomad-gramps-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A mais respeitada plataforma de genealogia científica mundial em versão web colaborativa para toda a família.

### ⚙️ O que faz
- Mantém a história dos seus antepassados e descendentes protegida, sem expor os dados da sua linhagem para bancos de dado...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Constrói árvores genealógicas com vínculos de parentesco, digitalização de certidões antigas, fotos históricas restauradas, mapas de migração dos antepassados e linhagens.

### 💡 Exemplo Real de Uso
Cadastrar fotos dos bisavós e certidões históricas de nascimento/imigração para que seus filhos e netos tenham acesso permanente às suas origens.

---


## Bar Assistant (Guia de Drinks & Bebidas) {% #nomad-bar-assistant %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador do seu bar pessoal, adega e catálogo de coquetéis artesanais.

### ⚙️ O que faz
- Perfeito para receber amigos e família em casa preparando drinks clássicos e autorais com receitas exatas e proporções m...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cadastra os destilados, licores, xaropes e ingredientes que tem no armário; o sistema informa instantaneamente quais coquetéis mundiais você consegue preparar agora ou qual ingrediente barato falta comprar.

### 💡 Exemplo Real de Uso
Amigos chegam em casa no fim de semana; você abre o Bar Assistant, clica em "O que posso fazer?" e ele lista 15 drinks possíveis com os ingredientes que você tem.

---


## Firefly III (Gestão Financeira & Metas) {% #nomad-fireflyiii %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O mais completo gerenciador financeiro auto-hospedado do mundo, construído sobre princípios rígidos de partidas dobradas (double-entry bookkeeping).

### ⚙️ O que faz
- É o único sistema capaz de suprir tudo o que você tinha no seu plugin de 2 anos: cartões com dias de fechamento e vencim...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Trata cada centavo como uma entidade contábil: nenhuma despesa surge do nada; o dinheiro sai de uma conta de ativo (banco, carteira, vale-alimentação) e vai para uma conta de destino ou cartão de crédito. Possui motor robusto de regras automáticas, relatórios orçamentários, tags e acompanhamento de dívidas.

### 💡 Exemplo Real de Uso
Seu salário quinzenal cai no dia 15; o Firefly III aloca automaticamente as parcelas de investimentos, separa o orçamento do supermercado e abate o saldo devedor do financiamento veicular com atualização de patrimônio líquido em tempo real.

---


## Actual Budget (Orçamento por Envelopes) {% #nomad-actual-budget %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema focado no método "envelope budgeting" (dar um destino a cada real recebido), com interface ultra-rápida construída em React e SQLite.

### ⚙️ O que faz
- Excelente para o controle tático do orçamento mensal do casal quando você quer rapidez máxima para saber quanto ainda po...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Funciona inteiramente no navegador local e sincroniza alterações criptografadas ponta a ponta com seu servidor N.O.M.A.D. e com o aplicativo de celular. Mesmo sem internet na rua, você lança despesas e ele sincroniza assim que reconectar.

### 💡 Exemplo Real de Uso
Você abre o app na fila do restaurante; ele mostra na hora: *"Você ainda tem R$ 180 no envelope de Lazer deste mês"*.

---


## Wallos (Rastreador de Assinaturas & Fixas) {% #nomad-wallos %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel visual dedicado a monitorar assinaturas de serviços, contas recorrentes e contratos de longo prazo.

### ⚙️ O que faz
- Elimina o problema clássico de assinar ferramentas ou serviços e esquecer que eles continuam sendo debitados todo mês no...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Registra ciclos de cobrança (mensal, anual, trimestral), formas de pagamento utilizadas, conversão automática de moedas (se assina algo em dólar/euro) e data exata da próxima fatura.

### 💡 Exemplo Real de Uso
Você cadastra suas contas de internet, condomínio, luz e ferramentas; o Wallos mostra um calendário visual com todos os dias de vencimento e o gasto fixo total do mês consolidado.

---


## Ghostfolio (Acompanhamento de Investimentos) {% #nomad-ghostfolio %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma moderna de gestão de portfólio de investimentos, desenhada para privacidade e independência financeira.

### ⚙️ O que faz
- Permite ver o crescimento patrimonial da família sem entregar suas posições financeiras para corretoras ou aplicativos q...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Acompanha seus ativos (ações nacionais da B3, Fundos Imobiliários FIIs, ETFs internacionais, Tesouro Direto e Bitcoin) com cotações automáticas, histórico de dividendos recebidos e cálculo de rentabilidade real contra o CDI e IPCA.

### 💡 Exemplo Real de Uso
Lançar uma compra de cotas de FII; o Ghostfolio atualiza a renda passiva mensal estimada em dividendos e calcula o peso daquele ativo na carteira geral.

---


## Maybe (Planejamento de Independência Financeira) {% #nomad-maybe %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O ambicioso sistema de gestão de patrimônio e independência financeira (FIRE - Financial Independence, Retire Early) que virou open-source após receber milhões de dólares em desenvolvimento.

### ⚙️ O que faz
- Dá a visão macro dos próximos 10, 20 e 30 anos do seu patrimônio familiar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Oferece projeções estatísticas de longo prazo para aposentadoria, fluxo de caixa futuro, gráficos de patrimônio líquido consolidado e cenários de rentabilidade.

### 💡 Exemplo Real de Uso
Simular se manter os aportes mensais atuais permitirá quitar o financiamento mais rápido ou atingir a meta da reserva de emergência antes do final do ano.

---


## Invoice Ninja (Faturas & Orçamentos Profissionais) {% #nomad-invoice-ninja %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O padrão ouro auto-hospedado para emissão profissional de faturas, propostas comerciais e orçamentos de projetos.

### ⚙️ O que faz
- Se você faz projetos para fora ou presta consultorias de engenharia e TI, ele profissionaliza toda a sua relação finance...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar orçamentos personalizados com sua logo, enviar faturas em PDF para clientes, controlar horas trabalhadas por projeto e registrar pagamentos recebidos via PIX ou transferência.

### 💡 Exemplo Real de Uso
Gerar um orçamento detalhado de automação para um cliente com data de validade; o cliente aprova pelo link web e o sistema converte na hora em fatura com controle de recebimento.

---


## Authentik (Login Único com Biometria - SSO) {% #nomad-authentik %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma corporativa de autenticação e gerenciamento de identidade (IdP) baseada em padrões abertos OAuth2, SAML e OpenID Connect.

### ⚙️ O que faz
- Protege toda a infraestrutura com autenticação moderna e permite revogar acessos de qualquer aparelho em um clique.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Intercepta o acesso a qualquer serviço do seu homelab. Em vez de memorizar 30 senhas diferentes, você faz login apenas no Authentik usando a impressão digital do celular (Passkey / WebAuthn) e ele autoriza sua sessão em todos os outros apps com segurança bancária.

### 💡 Exemplo Real de Uso
Ao acessar o Portainer ou o Outline de fora de casa, o sistema pede sua biometria no celular antes de liberar a tela.

---


## CrowdSec (Escudo Colaborativo Anti-Invasão) {% #nomad-crowdsec %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma moderna de edição de notas e documentos colaborativos em tempo real, baseada em blocos e totalmente open-source.

### ⚙️ O que faz
- Excelente para atas de reuniões rápidas, listas de tarefas dinâmicas e brainstorming colaborativo sem depender de Google...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que várias pessoas editem o mesmo documento simultaneamente, com renderização de diagramas Mermaid, equações matemáticas KaTeX, tabelas e links bidirecionais.

### 💡 Exemplo Real de Uso
Planejar viagens ou reformas da casa com sua esposa, editando ao mesmo tempo a lista de compras de materiais e custos estimados.

---


## NetAlertX (Vigia de Intrusos no Wi-Fi) {% #nomad-netalertx %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema autônomo de varredura e auditoria que monitora todos os equipamentos conectados na rede local em tempo real.

### ⚙️ O que faz
- Impede que vizinhos ou aparelhos comprometidos usem seu sinal de rede sem o seu consentimento.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executa varreduras ARP e ICMP periódicas no switch e ponto de acesso Wi-Fi. Quando um endereço MAC novo ou desconhecido aparece na rede, ele dispara um alerta imediato no Telegram ou Mattermost com o fabricante e o IP do dispositivo.

### 💡 Exemplo Real de Uso
Um convidado chega na sua casa e se conecta ao Wi-Fi; seu celular vibra avisando: *"Novo dispositivo detectado: Samsung Galaxy S24 (IP 192.168.1.145)"*.

---


## Scrutiny (Prevenção de Queima de HDs e SSDs) {% #nomad-scrutiny %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel visual inteligente para monitoramento preditivo da saúde física de discos mecânicos e SSDs NVMe via telemetria S.M.A.R.T.

### ⚙️ O que faz
- Vital para quem armazena terabytes de arquivos familiares, projetos e backups valiosos. Previne a perda irreparável de d...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Coleta os atributos dos discos do host e do TrueNAS em intervalos regulares, compara com os bancos de dados de queima da indústria (como os relatórios de falhas da Backblaze) e avisa se um setor remapeado ou erro de CRC indicar que o disco vai queimar nas próximas semanas.

### 💡 Exemplo Real de Uso
Um dos seus HDs de 4TB começa a apresentar setores com falha de leitura; o Scrutiny emite um alerta vermelho: *"Atenção: HD /dev/sdb com 98% de chance de quebra iminente. Faça a troca do disco!"*.

---


## DefGuard (VPN WireGuard com 2FA & Auditoria) {% #nomad-defguard %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Solução de nível corporativo para gerenciamento centralizado de redes privadas virtuais WireGuard com suporte a múltiplos fatores de autenticação.

### ⚙️ O que faz
- Muito mais seguro que uma VPN simples, pois permite revogar na hora o acesso de um dispositivo perdido ou furtado.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite gerar arquivos de configuração e QR codes de acesso remoto para celulares e notebooks com controle de quais IPs cada usuário pode acessar dentro da casa.

### 💡 Exemplo Real de Uso
Configurar o celular da sua esposa com VPN automática; sempre que ela sai do Wi-Fi de casa, o aparelho se reconecta via WireGuard para acessar as fotos do Immich com segurança total.

---


## Headscale / Netbird (VPN Mesh Própria) {% #nomad-headscale %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Solução de nível corporativo para gerenciamento centralizado de redes privadas virtuais WireGuard com suporte a múltiplos fatores de autenticação.

### ⚙️ O que faz
- Muito mais seguro que uma VPN simples, pois permite revogar na hora o acesso de um dispositivo perdido ou furtado.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite gerar arquivos de configuração e QR codes de acesso remoto para celulares e notebooks com controle de quais IPs cada usuário pode acessar dentro da casa.

### 💡 Exemplo Real de Uso
Configurar o celular da sua esposa com VPN automática; sempre que ela sai do Wi-Fi de casa, o aparelho se reconecta via WireGuard para acessar as fotos do Immich com segurança total.

---


## WG-Easy (Painel Rápido de VPN WireGuard) {% #nomad-wgeasy %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A interface web mais simples e direta do mundo para criar e gerenciar conexões VPN WireGuard com leitura de QR Code.

### ⚙️ O que faz
- Perfeito para setup rápido de conexões de emergência para familiares sem complicação técnica.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda o núcleo do WireGuard com tráfego acelerado no kernel e entrega um painel limpo onde você clica em "Novo Cliente", escaneia o QR Code na câmera do celular e a VPN está pronta para navegar.

### 💡 Exemplo Real de Uso
Criar um acesso seguro em 30 segundos no tablet do seu filho para ele acessar os desenhos no Jellyfin durante uma viagem.

---


## Nmap Web (Auditor de Portas & Brechas) {% #nomad-nmap-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Interface gráfica web para execução do lendário auditor de segurança de rede Nmap.

### ⚙️ O que faz
- Permite que você audite sua própria casa antes que um invasor encontre uma brecha de segurança nos seus equipamentos de ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Realiza varreduras detalhadas nos roteadores, câmeras IP, impressoras e computadores da sua casa, identificando portas abertas por engano, protocolos inseguros (Telnet/HTTP sem senha) e serviços vulneráveis.

### 💡 Exemplo Real de Uso
Auditar uma lâmpada ou tomada inteligente comprada na internet para ter certeza de que ela não está tentando abrir portas UPnP ou se comunicar com servidores desconhecidos.

---


## Frigate NVR (Câmeras de Segurança com IA) {% #nomad-frigate %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gravador de vídeo em rede (NVR) de alto desempenho focado em detecção de objetos em tempo real utilizando inteligência artificial local.

### ⚙️ O que faz
- Segurança patrimonial profissional sem pagar assinaturas abusivas de nuvens de câmeras comerciais.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se às suas câmeras IP via stream RTSP e processa as imagens na GPU ou no acelerador Coral. Em vez de alarmes falsos de chuva ou folhas ao vento, ele só grava e notifica se detectar uma **pessoa**, **carro** ou **animal** na área delimitada.

### 💡 Exemplo Real de Uso
Uma pessoa se aproxima do portão da sua residência à noite; o Frigate detecta a silhueta humana em 50ms e envia a foto no seu Telegram com a notificação instantânea.

---


## Kasm / Webtop (Navegador Descartável Seguro) {% #nomad-kasm-webtop %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Um ambiente desktop completo ou navegador isolado executado dentro de um contêiner descartável acessível via web.

### ⚙️ O que faz
- Proteção absoluta contra phishing, cavalos de troia e malwares ao baixar arquivos desconhecidos de sites suspeitos.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Renderiza uma janela de navegador ou desktop Linux diretamente em uma aba do Chrome. Qualquer arquivo baixado, vírus ou link estranho acessado fica confinado dentro do contêiner e é completamente destruído ao fechar a sessão.

### 💡 Exemplo Real de Uso
Você recebe um link estranho por e-mail dizendo ser um boleto ou nota fiscal; em vez de abrir no seu PC pessoal, você abre no Webtop: se houver vírus, seu computador real não sofre risco algum.

---


## Nginx Proxy Manager (Nomes Amigáveis) {% #nomad-npm %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador visual de proxy reverso e certificados SSL/TLS Let's Encrypt.

### ⚙️ O que faz
- Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Mapeia portas e IPs locais para domínios elegantes e amigáveis (ex: `fotos.home.lan` para a porta 8560, `jellyfin.home.lan` para a porta 8096) com renovação automática de certificados criptografados.

### 💡 Exemplo Real de Uso
Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.

---


## Technitium DNS Server (DNS Avançado com DoH) {% #nomad-technitium-dns %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O mais completo gerenciador financeiro auto-hospedado do mundo, construído sobre princípios rígidos de partidas dobradas (double-entry bookkeeping).

### ⚙️ O que faz
- É o único sistema capaz de suprir tudo o que você tinha no seu plugin de 2 anos: cartões com dias de fechamento e vencim...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Trata cada centavo como uma entidade contábil: nenhuma despesa surge do nada; o dinheiro sai de uma conta de ativo (banco, carteira, vale-alimentação) e vai para uma conta de destino ou cartão de crédito. Possui motor robusto de regras automáticas, relatórios orçamentários, tags e acompanhamento de dívidas.

### 💡 Exemplo Real de Uso
Seu salário quinzenal cai no dia 15; o Firefly III aloca automaticamente as parcelas de investimentos, separa o orçamento do supermercado e abate o saldo devedor do financiamento veicular com atualização de patrimônio líquido em tempo real.

---


## Blocky (Controle de Horários & Filtro DNS) {% #nomad-blocky %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Resolvedor e filtro de DNS leve escrito em Go, desenhado especificamente para controle de acessos por dispositivo e por horários.

### ⚙️ O que faz
- Controle parental soberano e saudável sem precisar instalar aplicativos espiões nos celulares dos filhos.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite criar regras onde, por exemplo, os tablets e videogames das crianças têm o YouTube e redes sociais bloqueados após as 21h ou durante o horário de estudos, enquanto os PCs dos pais continuam com acesso livre.

### 💡 Exemplo Real de Uso
Configurar o horário de sono da casa: às 22h, o Wi-Fi das crianças desativa o acesso a vídeos e jogos automaticamente.

---


## AdGuard Home (Bloqueador de Anúncios na Rede) {% #nomad-adguard %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador gastronômico familiar com extração automática de receitas de qualquer site.

### ⚙️ O que faz
- Permite que você e sua esposa planejem as refeições da semana com visual limpo no tablet da cozinha e gerem a lista de c...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cola a URL de qualquer receita da internet (sites de culinária, YouTube, blogs); o Mealie raspa a página, descarta pop-ups e biografias chatas, salva apenas os ingredientes exatos, modo de preparo passo a passo e fotos.

### 💡 Exemplo Real de Uso
Sua esposa encontra uma receita incrível na internet, envia o link para o Mealie pelo celular, clica em "Adicionar à lista de compras" e os ingredientes vão direto para a lista do supermercado.

---


## Pi-hole (Sumidouro de Telemetria DNS) {% #nomad-pihole %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidores DNS de bloqueio na camada de rede para toda a residência.

### ⚙️ O que faz
- Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositiv...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interceptam e descartam requisições para servidores de telemetria, rastreadores invasivos de Smart TVs e banners de propagandas antes mesmo que eles cheguem aos celulares ou computadores da casa.

### 💡 Exemplo Real de Uso
Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositivo.

---


## SearXNG (Mecanismo de Busca Privativo) {% #nomad-searxng %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Metamecanismo de busca privativo que agrega resultados do Google, Bing, DuckDuckGo, Wikipedia e Reddit em uma única interface limpa.

### ⚙️ O que faz
- Garante pesquisas completas na web sem criar perfis de comportamento ou direcionamento de anúncios comerciais.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Faz as buscas em seu nome, removendo dados do seu IP, histórico, cookies e fingerprint de rastreamento.

### 💡 Exemplo Real de Uso
Garante pesquisas completas na web sem criar perfis de comportamento ou direcionamento de anúncios comerciais.

---


## SmokePing (Auditor de Latência & Micro-Quedas) {% #nomad-smokeping %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Speedtest Tracker (Histórico de Velocidade) {% #nomad-speedtest %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel autônomo que executa testes periódicos de velocidade de internet diretamente nos servidores oficiais da Ookla / Speedtest.

### ⚙️ O que faz
- Garante que você está recebendo os megabits contratados pelo plano de fibra ótica.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda testes a cada hora de forma programada, registrando velocidade de download, upload e ping em um banco de dados com gráficos históricos e estatísticas de cumprimento de contrato.

### 💡 Exemplo Real de Uso
Descobrir que toda noite às 20h a operadora pratica "traffic shaping" e reduz sua velocidade de 600 Mbps para 120 Mbps.

---


## Uptime Kuma (Monitor de Quedas de Serviços) {% #nomad-uptime-kuma %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O mais renomado sistema de medição e diagnóstico de qualidade de sinal de rede e rotas de internet.

### ⚙️ O que faz
- Prova de forma irrefutável para a sua operadora de internet quando a conexão está com instabilidade ou micro-quedas invi...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Dispara rajadas periódicas de pacotes ICMP para múltiplos destinos estratégicos (servidores de DNS do Google, Cloudflare, gateway da sua operadora, servidores de jogos) e plota gráficos de dispersão de jitter e perda de pacotes ao longo do tempo.

### 💡 Exemplo Real de Uso
O jogo online ou a chamada de vídeo cai; você abre o SmokePing e vê o gráfico mostrando que exatamente às 15:20 a operadora teve 40% de perda de pacotes na rota externa.

---


## PeaNUT (Guardião do Nobreak & Energia) {% #nomad-peanut %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel visual para o Network UPS Tools (NUT), monitorando o nobreak que alimenta seus servidores e roteadores.

### ⚙️ O que faz
- Evita corrupção de dados nos HDs e no sistema de arquivos ZFS durante apagões de energia elétrica.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao nobreak via cabo USB ou placa de rede e lê em tempo real a voltagem da tomada, carga da bateria, consumo em Watts e tempo de autonomia restante. Em caso de falta de luz prolongada, comanda o desligamento seguro do TrueNAS e dos contêineres antes que a bateria se esgote.

### 💡 Exemplo Real de Uso
A luz da rua acaba; o PeaNUT notifica no seu celular: *"Falta de energia detectada. Homelab operando na bateria com 42 minutos de autonomia estimada"*.

---


## Immich (Fotos & Vídeos com TrueNAS Mount) {% #nomad-immich %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A mais avançada plataforma de backup e gerenciamento de fotos e vídeos familiares auto-hospedada do mundo.

### ⚙️ O que faz
- Você mencionou que tem 88GB de fotos; o Immich preserva os originais em resolução máxima no seu TrueNAS sem pagar assina...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Aplicativo móvel para Android e iOS que faz upload automático em segundo plano das fotos tiradas pelo casal. Possui inteligência artificial local de reconhecimento facial (agrupando fotos por membro da família), busca semântica (*"fotos na praia comendo pizza"*), visualização em mapa mundi e suporte a montagem no TrueNAS.

### 💡 Exemplo Real de Uso
Sua esposa tira fotos na rua; ao entrar no Wi-Fi de casa, o app sincroniza tudo silenciosamente com o servidor e organiza o álbum do bebê por data e rostos.

---


## Audiobookshelf (Audiolivros & Podcasts) {% #nomad-audiobookshelf %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

### ⚙️ O que faz
- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

### 💡 Exemplo Real de Uso
Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---


## TubeArchivist (Seu YouTube Offline Privado) {% #nomad-tubearchivist %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Piwigo (Álbuns de Família com Acesso Restrito) {% #nomad-piwigo %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---


## Music Assistant (Central de Som da Casa) {% #nomad-music-assistant %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador do seu bar pessoal, adega e catálogo de coquetéis artesanais.

### ⚙️ O que faz
- Perfeito para receber amigos e família em casa preparando drinks clássicos e autorais com receitas exatas e proporções m...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cadastra os destilados, licores, xaropes e ingredientes que tem no armário; o sistema informa instantaneamente quais coquetéis mundiais você consegue preparar agora ou qual ingrediente barato falta comprar.

### 💡 Exemplo Real de Uso
Amigos chegam em casa no fim de semana; você abre o Bar Assistant, clica em "O que posso fazer?" e ele lista 15 drinks possíveis com os ingredientes que você tem.

---


## Snapcast (Áudio Multi-Room em Sincronia) {% #nomad-snapcast %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor e cliente de áudio multi-room com sincronização precisa no tempo.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Transmite o fluxo de áudio bruto pela rede local para vários alto-falantes e caixas sem delay percebido entre os cômodos da casa.

### 💡 Exemplo Real de Uso


---


## Lyrion Music Server (Áudio Audiófilo Bit-Perfect) {% #nomad-lyrion-lms %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor de DNS local de padrão militar com suporte completo a DNS-over-HTTPS (DoH), DNS-over-TLS (DoT) e bloqueio avançado de requisições.

### ⚙️ O que faz
- Dá privacidade total de navegação para todos os dispositivos e acelera o carregamento de sites através de cache local na...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Resolve todas as consultas de nomes da casa diretamente nos servidores raiz da internet, sem passar pelos servidores lentos e monitorados da sua operadora (Claro, Vivo, etc.).

### 💡 Exemplo Real de Uso
Impedir que a operadora de internet registre quais sites você e sua família estão acessando no dia a dia.

---


## Podgrab (Baixador Silencioso de Podcasts) {% #nomad-podgrab %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema autônomo de varredura e auditoria que monitora todos os equipamentos conectados na rede local em tempo real.

### ⚙️ O que faz
- Impede que vizinhos ou aparelhos comprometidos usem seu sinal de rede sem o seu consentimento.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Executa varreduras ARP e ICMP periódicas no switch e ponto de acesso Wi-Fi. Quando um endereço MAC novo ou desconhecido aparece na rede, ele dispara um alerta imediato no Telegram ou Mattermost com o fabricante e o IP do dispositivo.

### 💡 Exemplo Real de Uso
Um convidado chega na sua casa e se conecta ao Wi-Fi; seu celular vibra avisando: *"Novo dispositivo detectado: Samsung Galaxy S24 (IP 192.168.1.145)"*.

---


## Your_Spotify (Telemetria Musical Privada) {% #nomad-your-spotify %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A mais respeitada plataforma de genealogia científica mundial em versão web colaborativa para toda a família.

### ⚙️ O que faz
- Mantém a história dos seus antepassados e descendentes protegida, sem expor os dados da sua linhagem para bancos de dado...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Constrói árvores genealógicas com vínculos de parentesco, digitalização de certidões antigas, fotos históricas restauradas, mapas de migração dos antepassados e linhagens.

### 💡 Exemplo Real de Uso
Cadastrar fotos dos bisavós e certidões históricas de nascimento/imigração para que seus filhos e netos tenham acesso permanente às suas origens.

---


## n8n (Automação de Processos & Conexão IA) {% #nomad-n8n %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Automatize tarefas conectando notificações de bancos com Actual Budget, e-mails de contas com Paperless e alertas com IA

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Baserow (Banco de Dados Relacional Visual) {% #nomad-baserow %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---


## NocoDB (Visualizador de Bancos como Planilha) {% #nomad-nocodb %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Interface no-code que se conecta a bancos de dados relacionais existentes (PostgreSQL, MySQL, SQLite) e os transforma em uma interface visual de planilha colaborativa.

### ⚙️ O que faz
- Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL co...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao banco de dados do seu próprio sistema ou de outros contêineres e expõe os dados em tabelas com filtros avançados e geração instantânea de APIs REST.

### 💡 Exemplo Real de Uso
Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL complexos.

---


## Directus (Camada de Dados & Painel API) {% #nomad-directus %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema completo de registro de cuidados diários, saúde, medicação e marcos de desenvolvimento da família e crianças.

### ⚙️ O que faz
- Elimina dúvidas sobre quem já deu o antibiótico da criança ou quando foi a última dose do antitérmico, evitando sobredos...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida para celular onde pai e mãe registram horários de medicamentos dados, sintomas de febre, doses de vacinas tomadas, curvas de peso/altura e consultas médicas.

### 💡 Exemplo Real de Uso
Na madrugada com a criança com febre, você olha no celular e vê exatamente que a última dose de remédio foi dada há 4 horas pela sua esposa.

---


## ChangeDetection.io (Monitor de Páginas Web) {% #nomad-changedetection %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Ferramentas visuais de monitoramento de integridade e tempo de atividade (uptime) de serviços e servidores.

### ⚙️ O que faz
- Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Testam a cada 30 segundos se cada porta, site, contêiner Docker e ping de roteador está respondendo normalmente. Se qualquer serviço falhar, disparam alarmes sonoros e notificações imediatas.

### 💡 Exemplo Real de Uso
Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.

---


## Shlink + QR Engine (Links & Etiquetas QR) {% #nomad-shlink %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerador e encurtador de links e códigos QR com suporte a domínio personalizado da sua rede e estatísticas de cliques.

### ⚙️ O que faz
- Você pode imprimir etiquetas com QR Codes para colar em gaveteiros de parafusos, disjuntores da casa ou manuais de eletr...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Transforma links internos compridos em URLs curtas e amigáveis (`http://nx.lan/oficina`) e gera QR Codes vetoriais prontos para impressão.

### 💡 Exemplo Real de Uso
Você pode imprimir etiquetas com QR Codes para colar em gaveteiros de parafusos, disjuntores da casa ou manuais de eletrodomésticos: ao escanear com a câmera do celular, abre diretamente a página técnica correspondente no seu homelab.

---


## Apprise API (Gateway Central de Alertas) {% #nomad-apprise %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor PACS e visualizador de exames médicos de imagem (Raios-X, Tomografias, Ressonâncias Magnéticas e Ultrassons).

### ⚙️ O que faz
- Garante que o histórico radiológico de toda a sua vida fique guardado no TrueNAS sem perda de resolução ou compressão de...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Recebe os arquivos digitais em formato nativo DICOM que vêm nos CDs/pen-drives de laboratórios e clínicas, permitindo visualização de cortes em alta fidelidade pelo navegador.

### 💡 Exemplo Real de Uso
Você precisa comparar uma ressonância de joelho ou coluna feita há 5 anos com uma atual; o Orthanc abre as duas lado a lado no navegador para o médico avaliar.

---


## Gotify (Notificações Push Independentes) {% #nomad-gotify %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidores dedicados para envio de notificações instantâneas push para computadores e celulares sem intermediários comerciais.

### ⚙️ O que faz
- Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
O Gotify roda um aplicativo leve no seu celular Android mantendo um canal WebSocket aberto diretamente com o seu servidor, entregando alertas de discos cheios, invasões ou quedas de servidores em milissegundos.

### 💡 Exemplo Real de Uso
Suas notificações de segurança chegam diretamente até você mesmo se os servidores de notificações da Apple ou do Google estiverem fora do ar.

---


## InvenTree (Almoxarifado & Peças de Oficina) {% #nomad-inventree %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O mais renomado sistema de controle de estoque de peças técnicas, projetos de hardware e montagens eletrônicas.

### ⚙️ O que faz
- Acaba com o clássico problema de comprar parafusos, relés ou conectores duplicados porque você não sabia que já tinha na...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Cadastra fornecedores, códigos de peças de fabricantes (ex: Mouser, Farnell, Mercado Livre), localização exata no gaveteiro (Estante A, Gaveta 3, Divisória 2), listas de materiais (BOM - Bill of Materials) e etiquetas de código de barras.

### 💡 Exemplo Real de Uso
Antes de iniciar um projeto de solda, você abre o projeto no InvenTree e clica em "Verificar Estoque"; ele avisa na hora se você tem todos os componentes necessários ou quais faltam pedir.

---


## PartKeepr (Estoque de Componentes Eletrônicos) {% #nomad-partkeepr %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema especializado em catalogar resistores, capacitores, transistores, microcontroladores (ESP32, STM32, Arduino) e chips SMD.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Registra parâmetros elétricos (tolerância, encapsulamento 0805/0603, tensão máxima, datasheets em PDF anexados) e quantidade disponível em cada carretel ou fita.

### 💡 Exemplo Real de Uso


---


## KiCad Web (Visualizador de Circuitos PCB) {% #nomad-kicad-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Visualizadores leves no navegador para arquivos de circuitos impressos (.kicad_pcb, .sch) e plantas técnicas em 2D (.dxf, .dwg).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite abrir e inspecionar camadas de PCBs, esquemáticos e desenhos mecânicos em qualquer celular, tablet ou laptop sem precisar ter o software CAD pesado instalado na máquina.

### 💡 Exemplo Real de Uso


---


## LibreCAD Web (Desenho Técnico 2D) {% #nomad-librecad-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Visualizadores leves no navegador para arquivos de circuitos impressos (.kicad_pcb, .sch) e plantas técnicas em 2D (.dxf, .dwg).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite abrir e inspecionar camadas de PCBs, esquemáticos e desenhos mecânicos em qualquer celular, tablet ou laptop sem precisar ter o software CAD pesado instalado na máquina.

### 💡 Exemplo Real de Uso


---


## Mainsail (Servidor de Impressão 3D) {% #nomad-mainsail %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A mais rápida e elegante interface de controle e telemetria para impressoras 3D rodando firmware Klipper e Moonraker.

### ⚙️ O que faz
- Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se à impressora 3D via rede, exibindo temperaturas de bico e mesa em gráficos suaves, câmera ao vivo com time-lapses, controle de velocidade e upload de arquivos G-code.

### 💡 Exemplo Real de Uso
Gerencia suas impressões de bancada direto do computador do escritório ou pelo celular.

---


## OpenWebRX (Rádio SDR & Satélite NOAA) {% #nomad-openwebrx %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor SDR (Software Defined Radio) com interface web interativa de espectro em cascata (waterfall).

### ⚙️ O que faz
- Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completam...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se a um dongle USB RTL-SDR e permite sintonizar frequências de rádio AM/FM, escuta aérea, rádio amador, alertas de defesa civil e decodificar imagens ao vivo de satélites meteorológicos NOAA.

### 💡 Exemplo Real de Uso
Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completamente.

---


## Mattermost (Chat Corporativo & Familiar) {% #nomad-mattermost %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma corporativa e familiar de mensagens instantâneas com canais, threads e suporte a bots.

### ⚙️ O que faz
- Um espaço limpo para a comunicação da família e para receber todas as notificações dos servidores em um aplicativo profi...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece canais organizados (ex: `#geral`, `#reformas-casa`, `#alertas-homelab`, `#ideias-projetos`), compartilhamento de arquivos pesados, chamadas e integração total com os webhooks do n8n e Frigate.

### 💡 Exemplo Real de Uso
Um espaço limpo para a comunicação da família e para receber todas as notificações dos servidores em um aplicativo profissional no celular.

---


## Matrix Synapse (Mensageiro Criptografado) {% #nomad-synapse %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor do protocolo federado Matrix com cliente web Cinny (interface com visual idêntico ao Discord).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Criptografia de ponta a ponta nativa (E2EE) onde somente você e o destinatário têm a chave de decodificação das conversas, sem possibilidade de leitura por terceiros.

### 💡 Exemplo Real de Uso


---


## Cinny (Interface Web Matrix Estilo Discord) {% #nomad-cinny %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Interface web de chat estilo ChatGPT / Claude com suporte nativo a Ollama, vLLM e OpenAI API.

### ⚙️ O que faz
- Permite aproveitar todo o potencial da sua **RTX 5060** rodando modelos como Llama 3.2, Mistral, Qwen e DeepSeek sem env...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se ao daemon do Ollama na porta 11434 e renderiza uma UI rica com suporte a RAG (Retrieval Augmented Generation), upload de documentos PDF/DOCX, navegação web privativa, execução de código e múltiplos usuários com controle de acesso.

### 💡 Exemplo Real de Uso
Você sobe o manual da sua placa-mãe ou um PDF de 500 páginas e pergunta *"Qual é o barramento PCIe correto para colocar o segundo SSD NVMe?"*, e o Open WebUI responde em segundos citando a página exata.

---


## Mumble Server (Voz de Ultra-Baixa Latência) {% #nomad-mumble %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

### ⚙️ O que faz
- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

### 💡 Exemplo Real de Uso
Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---


## Jitsi Meet (Videoconferências em HD Sem Nuvem) {% #nomad-jitsi %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma profissional de chamadas em vídeo e reuniões virtuais sem limite de tempo, sem anúncios e sem cadastro obrigatório.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Abre salas com compartilhamento de tela em alta taxa de quadros e criptografia direta no navegador.

### 💡 Exemplo Real de Uso


---


## FreePBX / Asterisk (Central Telefônica IP) {% #nomad-freepbx %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gravador de vídeo em rede (NVR) de alto desempenho focado em detecção de objetos em tempo real utilizando inteligência artificial local.

### ⚙️ O que faz
- Segurança patrimonial profissional sem pagar assinaturas abusivas de nuvens de câmeras comerciais.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se às suas câmeras IP via stream RTSP e processa as imagens na GPU ou no acelerador Coral. Em vez de alarmes falsos de chuva ou folhas ao vento, ele só grava e notifica se detectar uma **pessoa**, **carro** ou **animal** na área delimitada.

### 💡 Exemplo Real de Uso
Uma pessoa se aproxima do portão da sua residência à noite; o Frigate detecta a silhueta humana em 50ms e envia a foto no seu Telegram com a notificação instantânea.

---


## Etherpad Lite (Editor em Tempo Real Colaborativo) {% #nomad-etherpad %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor SDR (Software Defined Radio) com interface web interativa de espectro em cascata (waterfall).

### ⚙️ O que faz
- Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completam...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Conecta-se a um dongle USB RTL-SDR e permite sintonizar frequências de rádio AM/FM, escuta aérea, rádio amador, alertas de defesa civil e decodificar imagens ao vivo de satélites meteorológicos NOAA.

### 💡 Exemplo Real de Uso
Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completamente.

---


## HedgeDoc (Documentos Colaborativos em Markdown) {% #nomad-hedgedoc %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma moderna de edição de notas e documentos colaborativos em tempo real, baseada em blocos e totalmente open-source.

### ⚙️ O que faz
- Excelente para atas de reuniões rápidas, listas de tarefas dinâmicas e brainstorming colaborativo sem depender de Google...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite que várias pessoas editem o mesmo documento simultaneamente, com renderização de diagramas Mermaid, equações matemáticas KaTeX, tabelas e links bidirecionais.

### 💡 Exemplo Real de Uso
Planejar viagens ou reformas da casa com sua esposa, editando ao mesmo tempo a lista de compras de materiais e custos estimados.

---


## RustDesk Server (Suporte & Acesso Remoto) {% #nomad-rustdesk %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor de DNS local de padrão militar com suporte completo a DNS-over-HTTPS (DoH), DNS-over-TLS (DoT) e bloqueio avançado de requisições.

### ⚙️ O que faz
- Dá privacidade total de navegação para todos os dispositivos e acelera o carregamento de sites através de cache local na...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Resolve todas as consultas de nomes da casa diretamente nos servidores raiz da internet, sem passar pelos servidores lentos e monitorados da sua operadora (Claro, Vivo, etc.).

### 💡 Exemplo Real de Uso
Impedir que a operadora de internet registre quais sites você e sua família estão acessando no dia a dia.

---


## Beszel (Telemetria Cyberpunk da Máquina & GPU) {% #nomad-beszel %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel analítico pessoal que registra cada música que você escuta e gera seu próprio "Spotify Wrapped" privativo em tempo real durante o ano todo.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona


### 💡 Exemplo Real de Uso


---


## Dockge (Gerenciador Visual de Docker Compose) {% #nomad-dockge %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma avançada para construção visual de fluxos de agentes de IA, RAG multi-etapas e assistentes automatizados.

### ⚙️ O que faz
- Transforma seus modelos locais de simples "chatbots" em verdadeiros funcionários digitais que executam tarefas complexas...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece um construtor de pipelines no-code onde você pode ligar modelos de IA locais, bancos vetoriais (Qdrant), raspadores de web e webhooks externos para criar ferramentas que tomam decisões de forma autônoma.

### 💡 Exemplo Real de Uso
Criar um agente que lê seus e-mails ou alertas do homelab, resume os pontos críticos e notifica você no Mattermost ou Gotify apenas se houver algo urgente.

---


## Forgejo / Gitea (Seu GitHub Privado no TrueNAS) {% #nomad-forgejo %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

### ⚙️ O que faz
- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

### 💡 Exemplo Real de Uso
Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---


## Woodpecker CI (Compilação & Testes de Scripts) {% #nomad-woodpecker %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor leve de integração contínua (CI/CD) baseado em contêineres Docker, perfeitamente integrado ao Forgejo/Gitea.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona


### 💡 Exemplo Real de Uso


---


## ArchiveBox (Preservador Eterno da Internet) {% #nomad-archivebox %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
O mais renomado sistema de medição e diagnóstico de qualidade de sinal de rede e rotas de internet.

### ⚙️ O que faz
- Prova de forma irrefutável para a sua operadora de internet quando a conexão está com instabilidade ou micro-quedas invi...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Dispara rajadas periódicas de pacotes ICMP para múltiplos destinos estratégicos (servidores de DNS do Google, Cloudflare, gateway da sua operadora, servidores de jogos) e plota gráficos de dispersão de jitter e perda de pacotes ao longo do tempo.

### 💡 Exemplo Real de Uso
O jogo online ou a chamada de vídeo cai; você abre o SmokePing e vê o gráfico mostrando que exatamente às 15:20 a operadora teve 40% de perda de pacotes na rota externa.

---


## Duplicati (Backup Criptografado & Desduplicado) {% #nomad-duplicati %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Servidor do protocolo federado Matrix com cliente web Cinny (interface com visual idêntico ao Discord).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Criptografia de ponta a ponta nativa (E2EE) onde somente você e o destinatário têm a chave de decodificação das conversas, sem possibilidade de leitura por terceiros.

### 💡 Exemplo Real de Uso


---


## Rclone Web (Painel Visual de Sincronização) {% #nomad-rclone-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Plataforma avançada para construção visual de fluxos de agentes de IA, RAG multi-etapas e assistentes automatizados.

### ⚙️ O que faz
- Transforma seus modelos locais de simples "chatbots" em verdadeiros funcionários digitais que executam tarefas complexas...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Fornece um construtor de pipelines no-code onde você pode ligar modelos de IA locais, bancos vetoriais (Qdrant), raspadores de web e webhooks externos para criar ferramentas que tomam decisões de forma autônoma.

### 💡 Exemplo Real de Uso
Criar um agente que lê seus e-mails ou alertas do homelab, resume os pontos críticos e notifica você no Mattermost ou Gotify apenas se houver algo urgente.

---


## Microbin (Pastebin Privado com Autodestruição) {% #nomad-microbin %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

### ⚙️ O que faz
- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

### 💡 Exemplo Real de Uso
Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---


## CUPS Print Server (Central de Impressão da Casa) {% #nomad-cups %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Interface gráfica web para execução do lendário auditor de segurança de rede Nmap.

### ⚙️ O que faz
- Permite que você audite sua própria casa antes que um invasor encontre uma brecha de segurança nos seus equipamentos de ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Realiza varreduras detalhadas nos roteadores, câmeras IP, impressoras e computadores da sua casa, identificando portas abertas por engano, protocolos inseguros (Telnet/HTTP sem senha) e serviços vulneráveis.

### 💡 Exemplo Real de Uso
Auditar uma lâmpada ou tomada inteligente comprada na internet para ter certeza de que ela não está tentando abrir portas UPnP ou se comunicar com servidores desconhecidos.

---


## UrBackup (Backup Invisível Bare-Metal dos PCs) {% #nomad-urbackup %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Ferramentas de backup com criptografia AES-256 e sincronização de dados desduplicados entre discos locais e nuvens frias.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona


### 💡 Exemplo Real de Uso


---


## WeeWX (Estação Meteorológica & Histórico Climático) {% #nomad-weewx %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel autônomo que executa testes periódicos de velocidade de internet diretamente nos servidores oficiais da Ookla / Speedtest.

### ⚙️ O que faz
- Garante que você está recebendo os megabits contratados pelo plano de fibra ótica.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda testes a cada hora de forma programada, registrando velocidade de download, upload e ping em um banco de dados com gráficos históricos e estatísticas de cumprimento de contrato.

### 💡 Exemplo Real de Uso
Descobrir que toda noite às 20h a operadora pratica "traffic shaping" e reduz sua velocidade de 600 Mbps para 120 Mbps.

---


## Planka (Kanban para Projetos & Metas) {% #nomad-planka %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A ferramenta definitiva de documentação de equipe e projetos, combinando a elegância do Notion com a velocidade do Markdown e segurança corporativa.

### ⚙️ O que faz
- É a resposta perfeita para quem não gostou da interface do BookStack. O Outline possui design limpo, moderno, suporte a ...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Interface rápida com suporte a múltiplos espaços de trabalho, histórico de versões, busca textual em tempo real, suporte a IA para expansão de textos e controle fino de permissões.

### 💡 Exemplo Real de Uso
Documentar todo o seu homelab, topologias de rede, manuais dos seus projetos eletrônicos e procedimentos operacionais (SOPs) para que qualquer pessoa consiga manter a infraestrutura funcionando.

---


## FreshRSS (Notícias sem Algoritmo com Contas) {% #nomad-freshrss %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Leitor de feeds RSS auto-hospedado com suporte nativo a contas de usuários independentes (uma para você, uma para sua esposa e contas futuras para os filhos).

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Cada membro da família tem seus próprios feeds de notícias, categorias e histórico de leitura separados, com sincronização em aplicativos móveis como NetNewsWire e ReadYou.

### 💡 Exemplo Real de Uso


---


## Pingvin Share (Envio Ultrarrápido de Arquivos) {% #nomad-pingvin-share %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Alternativa soberana ao WeTransfer para compartilhamento de vídeos e arquivos grandes.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você sobe arquivos pesados no servidor local e gera um link protegido por senha com data de expiração para enviar por WhatsApp ou e-mail.

### 💡 Exemplo Real de Uso


---


## Wake-on-LAN Hub (Ligue Computadores à Distância) {% #nomad-wol-web %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Painel web para envio de pacotes mágicos "Magic Packets" Wake-on-LAN.

### ⚙️ O que faz
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Permite ligar seu PC do quarto ou da bancada de trabalho com um toque no celular mesmo se a máquina estiver totalmente desligada.

### 💡 Exemplo Real de Uso


---


## DokuWiki Tático (Base de S.O.P. Sem Banco de Dados) {% #nomad-dokuwiki %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Ferramentas visuais de monitoramento de integridade e tempo de atividade (uptime) de serviços e servidores.

### ⚙️ O que faz
- Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Testam a cada 30 segundos se cada porta, site, contêiner Docker e ping de roteador está respondendo normalmente. Se qualquer serviço falhar, disparam alarmes sonoros e notificações imediatas.

### 💡 Exemplo Real de Uso
Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.

---


## Homepage (Painel Principal da Smart TV) {% #nomad-homepage %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
A interface web mais simples e direta do mundo para criar e gerenciar conexões VPN WireGuard com leitura de QR Code.

### ⚙️ O que faz
- Perfeito para setup rápido de conexões de emergência para familiares sem complicação técnica.
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Roda o núcleo do WireGuard com tráfego acelerado no kernel e entrega um painel limpo onde você clica em "Novo Cliente", escaneia o QR Code na câmera do celular e a VPN está pronta para navegar.

### 💡 Exemplo Real de Uso
Criar um acesso seguro em 30 segundos no tablet do seu filho para ele acessar os desenhos no Jellyfin durante uma viagem.

---


## Home Assistant (Automação Residencial) {% #nomad-homeassistant %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Gerenciador do seu bar pessoal, adega e catálogo de coquetéis artesanais.

### ⚙️ O que faz
- Perfeito para receber amigos e família em casa preparando drinks clássicos e autorais com receitas exatas e proporções m...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Você cadastra os destilados, licores, xaropes e ingredientes que tem no armário; o sistema informa instantaneamente quais coquetéis mundiais você consegue preparar agora ou qual ingrediente barato falta comprar.

### 💡 Exemplo Real de Uso
Amigos chegam em casa no fim de semana; você abre o Bar Assistant, clica em "O que posso fazer?" e ele lista 15 drinks possíveis com os ingredientes que você tem.

---


## Traccar & OSRM (Roteamento & GPS Offline) {% #nomad-traccar %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema focado no método "envelope budgeting" (dar um destino a cada real recebido), com interface ultra-rápida construída em React e SQLite.

### ⚙️ O que faz
- Excelente para o controle tático do orçamento mensal do casal quando você quer rapidez máxima para saber quanto ainda po...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Funciona inteiramente no navegador local e sincroniza alterações criptografadas ponta a ponta com seu servidor N.O.M.A.D. e com o aplicativo de celular. Mesmo sem internet na rua, você lança despesas e ele sincroniza assim que reconectar.

### 💡 Exemplo Real de Uso
Você abre o app na fila do restaurante; ele mostra na hora: *"Você ainda tem R$ 180 no envelope de Lazer deste mês"*.

---


## Vikunja (Gestão de Crise & Checklists) {% #nomad-vikunja %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Listas táticas de tarefas, protocolos de contingência e prazos com visual moderno e sincronização rápida

### ⚙️ O que faz
- Porta canônica: 80
- Execução autônoma e segura
- Pronto para deploy via Portainer ou Docker Compose

### 🧠 Como funciona
Executado em contêiner Docker isolado na porta 80, persistindo dados em volumes dedicados.

### 💡 Exemplo Real de Uso
Utilizado para operações de utility com controle e soberania local no seu homelab.

---


## Linkding (Bookmarks & Arquivamento Offline) {% #nomad-linkding %}

- **Categoria:** `utility` | **Porta:** `80` | **Tipo:** `Arsenal Docker`

### 🎯 Para que serve
Sistema focado no método "envelope budgeting" (dar um destino a cada real recebido), com interface ultra-rápida construída em React e SQLite.

### ⚙️ O que faz
- Excelente para o controle tático do orçamento mensal do casal quando você quer rapidez máxima para saber quanto ainda po...
- Porta padrão mapeada: 80
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

### 🧠 Como funciona
Funciona inteiramente no navegador local e sincroniza alterações criptografadas ponta a ponta com seu servidor N.O.M.A.D. e com o aplicativo de celular. Mesmo sem internet na rua, você lança despesas e ele sincroniza assim que reconectar.

### 💡 Exemplo Real de Uso
Você abre o app na fila do restaurante; ele mostra na hora: *"Você ainda tem R$ 180 no envelope de Lazer deste mês"*.

---
