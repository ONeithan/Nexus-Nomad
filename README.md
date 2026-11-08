<div align="center">
<img src="admin/public/nomad-primary.svg" width="210" alt="Nexus Project NOMAD"/>

# Nexus Project NOMAD
### Conhecimento Que Nunca Fica Offline

[![Idioma](https://img.shields.io/badge/Idioma-Português%20(PT--BR)-green)](https://github.com/ONeithan/Nexus-Nomad)
[![Licença](https://img.shields.io/badge/Licença-Apache%202.0-blue)](LICENSE)
[![Base](https://img.shields.io/badge/Base-Project%20NOMAD-olive)](https://www.projectnomad.us)

</div>

---

O **Nexus Project NOMAD** é um servidor autônomo e *offline-first* de conhecimento, educação e ferramentas práticas em **Português Brasileiro (PT-BR)** — reunindo enciclopédias, cursos, mapas, utilitários e Inteligência Artificial para manter você informado e preparado em qualquer lugar, com ou sem internet.

## Instalação Rápida

O Nexus Project NOMAD pode ser instalado em qualquer sistema operacional baseado em **Debian** (`x86_64` — recomendamos **Debian 12/13** ou **Ubuntu 24.04/26.04 LTS**). A instalação é feita inteiramente pelo terminal e todas as ferramentas são acessadas pelo navegador web — não é necessário instalar interface gráfica no servidor.

**Antes de começar:** o núcleo do NOMAD precisa de cerca de **5 GB de disco e menos de 1 GB de RAM**. O espaço adicional dependerá dos pacotes offline que você decidir baixar depois (Wikipédia, mapas, cursos, livros) e, caso opte por rodar modelos de IA localmente, da memória exigida pelos modelos escolhidos.

*Nota: privilégios `sudo`/`root` são necessários para executar o instalador.*

### Instalação em 1 Comando (Sistemas Baseados em Debian / Ubuntu)

```bash
sudo apt-get update && \
sudo apt-get install -y curl && \
curl -fsSL https://raw.githubusercontent.com/ONeithan/Nexus-Nomad/main/install/install_nomad.sh \
  -o install_nomad.sh && \
sudo bash install_nomad.sh
```

Pronto! Abra o navegador e acesse `http://localhost:8080` (ou `http://IP_DO_DISPOSITIVO:8080` a partir de outro computador ou celular na mesma rede) para explorar o **Centro de Comando**.

> **Armazenamento Secundário (Opcional):** caso o seu servidor possua um segundo disco montado em `/mnt/nomad_storage` antes da instalação, o instalador o detectará automaticamente e armazenará todos os dados dos aplicativos (ZIMs, mapas, livros e mídias) nele, mantendo o sistema e o banco de dados no disco principal.

### Instalação Avançada (Docker Compose)

Para controle manual completo sobre portas, caminhos de volumes e variáveis de ambiente, utilize o template [install/management_compose.yaml](install/management_compose.yaml), substitua os valores `replaceme` e execute `docker compose up -d`.

---

## Como Funciona

O NOMAD funciona como um **Centro de Comando** (painel web + API) que orquestra uma coleção de ferramentas e acervos em contêineres [Docker](https://www.docker.com/), cuidando da instalação, configuração e atualizações em um só lugar.

**Capacidades integradas:**

- **Chat de IA com Base de Conhecimento (RAG)** — assistente de IA alimentado por [Ollama](https://ollama.com/) (rodando localmente no próprio equipamento **ou** conectado a qualquer instância remota de Ollama / API compatível com OpenAI como LM Studio e `llama.cpp`), com upload de documentos e busca semântica via [Qdrant](https://qdrant.tech/).
- **Biblioteca de Informações** — Wikipédia em português, referências médicas, livros e enciclopédias offline via [Kiwix](https://kiwix.org/).
- **Plataforma Educacional** — cursos interativos, matemática, ciências e Khan Academy com acompanhamento de progresso via [Kolibri](https://learningequality.org/kolibri/).
- **Mapas Offline** — mapas vetoriais regionais e mundiais para navegação sem internet via [ProtoMaps](https://protomaps.com).
- **Guia de Medicamentos & Manuais Técnicos** — referência farmacológica offline e 28 guias técnicos integrados em português (captação e tratamento de água, cultivo de alimentos, energia solar off-grid, bioconstrução, primeiros socorros e oficina).
- **Ferramentas de Dados & Notas** — codificação, criptografia e análise via [CyberChef](https://gchq.github.io/CyberChef/) e caderno local em Markdown via [FlatNotes](https://github.com/dullage/flatnotes).
- **Depósito de Suprimentos** — catálogo de aplicativos instaláveis em 1 clique (Stirling PDF, FileBrowser, Calibre Web, Vaultwarden, Jellyfin, IT Tools, Excalidraw, Homebox, Meshtastic) além de suporte a contêineres Docker personalizados.
- **Monitoramento de Sistema & Discos** — telemetria em tempo real de CPU, RAM e topologia detalhada das unidades de armazenamento conectadas.
- **Configuração Rápida (Easy Setup)** — assistente inicial guiado para baixar coleções curadas de conteúdo offline.

---

## O Que Está Incluído

| Capacidade | Motor | O Que Você Recebe |
| :--- | :--- | :--- |
| **Biblioteca Offline** | Kiwix | Wikipédia PT-BR, referências médicas, guias técnicos e livros em formato ZIM |
| **Assistente de IA** | Ollama / API OpenAI + Qdrant | Chat integrado (local ou remoto) com leitura de documentos e busca semântica |
| **Plataforma Educacional** | Kolibri (Gen 2) | Videoaulas, exercícios interativos e cursos estruturados offline |
| **Mapas Offline** | ProtoMaps | Mapas regionais e mundiais baixáveis para consulta sem internet |
| **Manuais & Documentação** | Markdoc Nativo | Guias práticos em português integrados diretamente na central `/docs` |
| **Bloco de Notas** | FlatNotes | Anotações rápidas em Markdown com armazenamento local |
| **Ferramentas de Dados** | CyberChef | Utilitários offline de criptografia, hashes, conversão e análise |
| **Depósito de Suprimentos** | Docker Engine | Instalação em 1 clique de Stirling PDF, FileBrowser, Calibre Web, Vaultwarden e mais |
| **Sistema & Armazenamento** | Disk Collector | Inspeção em tempo real de discos físicos, partições, montagens de rede e recursos |

---

## Requisitos Recomendados

| Perfil de Uso | CPU | Memória RAM | Armazenamento |
| :--- | :--- | :--- | :--- |
| **Mínimo (Biblioteca, Mapas e Apps leves)** | x86_64 Dual-Core | 4 GB | 32 GB+ SSD |
| **Recomendado (Múltiplos Apps + Wikipédia Completa)** | x86_64 Quad-Core | 8 – 16 GB | 256 GB – 1 TB+ |
| **Com IA Local no Próprio Servidor** | x86_64 Moderno (+ GPU NVIDIA/AMD opcional) | 16 GB+ | 500 GB+ SSD NVMe |

*(Dica: máquinas mais modestas também podem usar o Assistente de IA normalmente apontando a **Conexão Remota** em Configurações para outro computador da rede que execute Ollama ou API compatível com OpenAI).*

---

## Scripts Auxiliares de Manutenção

Após instalado, os scripts auxiliares ficam disponíveis em `/opt/project-nomad`:

```bash
# Iniciar todos os contêineres de gerenciamento do NOMAD
sudo bash /opt/project-nomad/start_nomad.sh

# Parar os contêineres de gerenciamento
sudo bash /opt/project-nomad/stop_nomad.sh

# Atualizar o Centro de Comando para a imagem mais recente
sudo bash /opt/project-nomad/update_nomad.sh
```

---

## Segurança de Rede

O NOMAD foi projetado para uso local/offline na sua rede confiável (LAN) e **não** deve ser exposto diretamente para a internet pública sem camada de autenticação/VPN apropriada.

## Licença e Créditos

- Licenciado sob a [Apache License 2.0](LICENSE).
- Baseado no excelente [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad) por [Crosstalk Solutions](https://www.projectnomad.us).
