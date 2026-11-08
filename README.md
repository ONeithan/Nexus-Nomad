<div align="center">
<img src="admin/public/nomad-primary.svg" width="220" alt="Nexus Project NOMAD"/>

# Nexus Project NOMAD
### Conhecimento Civilizatório que Nunca Fica Offline

[![Versão](https://img.shields.io/badge/Versão-1.0.0--Nexus-olive)](https://github.com/ONeithan/Nexus-Nomad)
[![Idioma](https://img.shields.io/badge/Idioma-Português%20(PT--BR)-green)](https://github.com/ONeithan/Nexus-Nomad)
[![Modo](https://img.shields.io/badge/Operação-100%25%20Offline-blue)](https://github.com/ONeithan/Nexus-Nomad)
[![Acervo](https://img.shields.io/badge/Acervo-12.293%20Itens%20Indexados-darkgreen)](https://github.com/ONeithan/Nexus-Nomad)

</div>

---

O **Nexus Project NOMAD** é um servidor de conhecimento, sobrevivência e educação autossuficiente, projetado para operar **100% offline** e acompanhar uma família ou comunidade por gerações.

Em um cenário de interrupção prolongada de internet, rede elétrica pública, abastecimento de água ou serviços urbanos, o sistema provê todas as ferramentas práticas, científicas, médicas, agrícolas e culturais necessárias para manter condições dignas de vida e preservar a civilização.

---

## 🎯 Pilares Centrais

1. **Prioridade Absoluta em Português Brasileiro (PT-BR):**
   - Interface completa, menus, configurações, categorias e documentação em português nativo.
   - Pesquisa aprofundada prioritariamente em órgãos públicos brasileiros (**Embrapa, Fiocruz, Ministério da Saúde, Funasa, Rede e-Tec Brasil/MEC, Domínio Público, Defesa Civil e Bombeiros**).
2. **Preservação de Acervo Histórico e Monumental:**
   - Integração completa do patrimônio documental do **Nexus-Odyssey**: mais de 12.290 itens e 12 GB de dados estruturados em SQLite.
   - Preservação da digitalização integral monumental da **Bíblia de Gutenberg de 1454 (6,58 GB)**, fac-símiles de alta definição, Bíblias de estudo clássicas e os 19 volumes temáticos da **Biblioteca Mestre**.
3. **Autonomia de Infraestrutura:**
   - Otimizado para rodar 24/7 em um notebook dedicado com **auto power-on na BIOS** (reinício automático após retorno de energia).
   - Suporte a arquitetura híbrida de discos: **SSD NVMe** (SO, IA, Docker e alta velocidade) + **HDD** (grandes acervos de PDFs e ZIMs) + expansão de rede com **Pool TrueNAS via NFS**.

---

## 🚀 Guia de Instalação e Inicialização

O sistema foi preparado para ser instalado de forma simples em qualquer distribuição baseada em Debian (recomendamos **Debian 12 Bookworm** ou **Ubuntu 24.04/26.04 LTS Server**).

### Passo 1: Preparação do Sistema Operacional no Notebook
1. Baixe a imagem ISO oficial do **Debian 12** (versão Netinst ou Standard).
2. Grave a imagem em um pendrive utilizando o **Rufus** (selecione partição GPT e modo UEFI).
3. Conecte o notebook na tomada, insira o pendrive e acesse a **BIOS/UEFI** (teclas `F2`, `F12` ou `Del`):
   - Em **Power Management**, ative a opção **"Restore on AC Power Loss"** para **Power On** (isso garante que o notebook ligue sozinho sempre que a energia voltar).
   - Defina o pendrive como primeira opção de boot e instale o Debian.
4. Conecte o notebook ao cabo de rede local e habilite o serviço SSH:
   ```bash
   sudo apt update && sudo apt install -y openssh-server curl
   ```

### Passo 2: Instalação Automática do Nexus NOMAD (Comando de 1 Linha)
A partir do seu computador principal, conecte via SSH ao notebook e execute o instalador do fork:

```bash
curl -fsSL https://raw.githubusercontent.com/ONeithan/Nexus-Nomad/main/install/install_nomad.sh -o install_nomad.sh && sudo bash install_nomad.sh
```

O instalador interativo em português configurará o Docker, os bancos de dados e os serviços automaticamente.

Ao finalizar, acesse o painel pelo navegador em:
```
http://IP_DO_NOTEBOOK:8080
```
*(Ou `http://localhost:8080` caso esteja executando localmente).*

---

## 📦 O que Está Incluído no Centro de Comando

| Capacidade | Motor / Tecnologia | O que Você Tem em Mãos |
| :--- | :--- | :--- |
| **Biblioteca Offline** | Kiwix Server | Wikipédia PT completa, Wikilivros PT, Wikisource, MDWiki Medicina PT e e-books em ZIM. |
| **Assistente IA Local** | Ollama + Qdrant RAG | Chat inteligente em português com busca semântica no acervo de manuais técnicos. |
| **Escola & Universidade** | Kolibri Platform | Cursos do Khan Academy em português, alfabetização, matemática e ciências com progresso. |
| **Cartografia & Navegação** | ProtoMaps | Mapas vetoriais do Brasil e continentes para consulta sem internet e sem GPS. |
| **Guia de Medicamentos** | Módulo Nativo PT-BR | Bulário offline, posologias, busca por sintomas e primeiros socorros em isolamento. |
| **Caderno de Notas** | FlatNotes | Anotações diárias, diários agrícolas e documentação familiar em Markdown. |
| **Laboratório Cripto** | CyberChef | Canivete suíço de criptografia, codificação e proteção de dados sigilosos. |
| **Depósito de Suprimentos** | Docker App Store | Instalação em 1 clique de Stirling PDF, Kavita (e-books), File Browser e Vaultwarden. |
| **Acervo Histórico** | SQLite Catalogo Mestre | 12.293 itens indexados via SHA-256: Gutenberg 1454 (6.58 GB), Bíblias e 19 Volumes Mestre. |

---

## 💾 Arquitetura Híbrida de Armazenamento

Para balancear máxima velocidade e grande capacidade de retenção:

```
[ Notebook Servidor Nexus NOMAD ]
├── ⚡ SSD NVMe 1 TB (Primário Rápido)
│   ├── Sistema Operacional Debian 12
│   ├── Contêineres Docker (Admin, MySQL, Redis, Qdrant)
│   └── Modelos de Inteligência Artificial (Ollama)
│
├── 📦 HDD 500 GB (Secundário para Arquivos Volumosos)
│   ├── Acervo Nexus-Odyssey (Gutenberg Bible 6.58 GB, Fac-símiles JPGs)
│   ├── ZIMs da Wikipédia em Português
│   └── Mapas Regionais do Brasil
│
└── 🌐 Expansão de Rede: TrueNAS via NFS
    └── Montagem em /mnt/truenas-nomad para expansão ilimitada de livros e mídias.
```

---

## 🛠️ Teste e Simulação em Localhost (Windows Dev)

Para testar a interface, temas e traduções no seu computador antes de enviar ao notebook:

1. Acesse a pasta `preview/` na raiz do projeto:
   ```bash
   cd "e:\Projetos\Nexus N.O.M.A.D\preview"
   node server.js
   ```
2. Abra o navegador em:
   ```
   http://localhost:8080
   ```
A simulação completa do **Centro de Comando** rodará instantaneamente em português, permitindo testar o Modo Escuro/Deserto, o Assistente de Configuração, o Guia de Medicamentos e o Chat de IA.

---

## ⚖️ Licença e Governança

- **Projeto Base:** Project NOMAD (Apache-2.0 License).
- **Customização e Tradução:** Nexus N.O.M.A.D (100% PT-BR por Nathan).
- **Sem Telemetria:** ZERO envio de dados ou rastreamento.
