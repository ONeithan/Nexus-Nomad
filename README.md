<div align="center">
<img src="admin/public/nomad-primary.svg" width="220" alt="Nexus Project NOMAD"/>

# Nexus Project N.O.M.A.D.
### Sistema Operacional Tático de Campo, Sobrevivência & Arca do Conhecimento 100% Offline

[![Idioma](https://img.shields.io/badge/Idioma-Português%20(PT--BR)-green)](https://github.com/ONeithan/Nexus-Nomad)
[![Doutrina](https://img.shields.io/badge/Doutrina-MIL--STD--810H%20(Off--Grid)-blue)](https://github.com/ONeithan/Nexus-Nomad)
[![Docker](https://img.shields.io/badge/Docker-GHCR%20Oficial-2496ED)](https://github.com/ONeithan/Nexus-Nomad/pkgs/container/nexus-nomad)
[![Wiki](https://img.shields.io/badge/Documentação-Wiki%20Oficial-orange)](https://github.com/ONeithan/Nexus-Nomad/wiki)
[![Licença](https://img.shields.io/badge/Licença-Uso%20Não%20Comercial-red)](LICENSE)

</div>

---

> [!IMPORTANT]
> ### 📖 Galeria Visual Completa & Manuais na Wiki Oficial
> **Todas as capturas de tela, tutoriais de campo passo a passo e documentações aprofundadas dos 113 aplicativos estão concentradas exclusivamente na nossa Wiki Oficial.**
> 
> 👉 **[Acesse a Wiki Oficial do Nexus N.O.M.A.D.](https://github.com/ONeithan/Nexus-Nomad/wiki)**
> 
> * 🛰️ [Centro de Comando Tático & Telemetria em Tempo Real](https://github.com/ONeithan/Nexus-Nomad/wiki/Home)
> * 🚀 [Sequência de Boot Militar & Inicialização Tática](https://github.com/ONeithan/Nexus-Nomad/wiki/Boot-Militar-e-Inicializacao)
> * 🛡️ [Segurança, Hashing de Senhas & Níveis de Operador 01 a 05](https://github.com/ONeithan/Nexus-Nomad/wiki/Seguranca-e-Autenticacao)
> * 📦 [Central de Aplicativos & 113 Guias Operacionais](https://github.com/ONeithan/Nexus-Nomad/wiki/Central-de-Aplicativos)
> * 🛠️ [Ferramentas Táticas Traduzidas (IT-Tools, CyberChef, Calibre, Dozzle)](https://github.com/ONeithan/Nexus-Nomad/wiki/Ferramentas-Traduzidas-PT-BR)
> * 🌐 [Explorador ZIM & Wikipédia Completa Offline (45 GB / 14 GB / 850 MB)](https://github.com/ONeithan/Nexus-Nomad/wiki/Explorador-ZIM-e-Wikipedia)
> * 🎓 [Central Educacional Kolibri (Khan Academy & Simulações PhET)](https://github.com/ONeithan/Nexus-Nomad/wiki/Central-Educacional-Kolibri)
> * 🗺️ [Cartografia Offline Vetorial Protomaps PMTiles (Planeta 130 GB)](https://github.com/ONeithan/Nexus-Nomad/wiki/Cartografia-e-Mapas-Offline)
> * 🩺 [Guia Médico Tático, Bulário e Protocolos Clínicos de Trauma](https://github.com/ONeithan/Nexus-Nomad/wiki/Guia-Medico-e-Farmacologico)
> * 💾 [Armazenamento Raio-X, Compartilhamento Samba e Mapeamento em Lote](https://github.com/ONeithan/Nexus-Nomad/wiki/Discos-Armazenamento-e-Samba)
> * 🧠 [Inteligência Artificial, RAG Vetorial e Aceleração por GPU Externa](https://github.com/ONeithan/Nexus-Nomad/wiki/Inteligencia-Artificial-e-Chat)

---

## 🎯 O Que é o Nexus Project N.O.M.A.D.?

O **Nexus Project N.O.M.A.D.** (*Network Operations, Mapping & Autonomous Defense*) é uma suíte operacional completa projetada para transformar qualquer computador portátil, servidor doméstico ou homelab em uma **Arca de Sobrevivência e Conhecimento Civilizatório**.

Construído sob a doutrina **100% Off-Grid**, o sistema opera de forma estritamente autônoma sem requisições para a nuvem ou telemetria invasiva, mantendo todas as ferramentas de comunicação, saúde, educação, cartografia, engenharia, criptografia e inteligência artificial disponíveis mesmo em cenários de desastre natural, apagão cibernético ou colapso de infraestrutura.

### 🛡️ Os Pilares Fundamentais do Sistema:
1. **Autonomia Radical (100% Offline):** Nenhuma biblioteca externa, fonte de texto, script ou contêiner depende de internet para inicializar ou operar.
2. **Doutrina Tática Militar (MIL-STD-810H):** Interface rugerizada com paletas de camuflagem (Olive Drab, Desert Ops e Noturno), monitoramento em tempo real de hardware e scanlines CRT opcionais.
3. **Preservação de Conhecimento:** Integração profunda com arquivos `.zim` (Wikipédia completa, manuais de sobrevivência, enciclopédias médicas) e plataforma educacional Kolibri.
4. **Navegação Vetorial Sem Nuvem:** Mapas mundiais no formato Protomaps PMTiles para zoom fluído e rotas visuais sem conexões remotas.
5. **Inteligência Artificial Desacoplada:** Assistente nativo com busca vetorial RAG no acervo local, além de integração com Open WebUI e suporte a aceleração em GPUs externas na rede local.
6. **Mapeamento de Armazenamento Inteligente:** Botão mestre para consolidar todos os downloads e acervos pesados em discos externos com um único clique.

---

## 🚀 Instalação Rápida

### Opção 1: Instalação Automática em 1 Comando (Debian 12/13 ou Ubuntu)

Em um servidor Linux limpo, execute:

```bash
sudo apt-get update && sudo apt-get install -y curl && \
curl -fsSL https://raw.githubusercontent.com/ONeithan/Nexus-Nomad/main/install/install_nomad.sh -o install_nomad.sh && \
sudo bash install_nomad.sh
```

---

### Opção 2: Via Docker Compose

Crie o arquivo `docker-compose.yml` em `/opt/project-nomad`:

```yaml
version: '3.8'

services:
  nomad_admin:
    image: ghcr.io/oneithan/nexus-nomad:latest
    container_name: nomad_admin
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/project-nomad/storage:/app/storage
      - /mnt:/mnt
      - /media:/media
      - nomad-update-shared:/app/update-shared
    environment:
      - NODE_ENV=production
      - PORT=8080
      - HOST=0.0.0.0
      - APP_KEY=nomad_secret_military_key_security_32_chars
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=nomad_user
      - DB_PASSWORD=nomad_secure_password
      - DB_DATABASE=nomad
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NOMAD_STORAGE_PATH=/opt/project-nomad/storage
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

  mysql:
    image: mysql:8.0
    container_name: nomad_mysql
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=nomad_root_secure
      - MYSQL_DATABASE=nomad
      - MYSQL_USER=nomad_user
      - MYSQL_PASSWORD=nomad_secure_password
    volumes:
      - /opt/project-nomad/mysql:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: nomad_redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  dozzle:
    image: amir20/dozzle:v10.0
    container_name: nomad_dozzle
    restart: unless-stopped
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOZZLE_ENABLE_ACTIONS=false
      - DOZZLE_ENABLE_SHELL=false

volumes:
  nomad-update-shared:
```

Suba o sistema:
```bash
docker compose up -d
```

Acesse no navegador:
```text
http://localhost:8080   (ou http://IP-DO-SERVIDOR:8080)
```

---

## 🔑 Portas Padrão & Credenciais de Fábrica

| Aplicação | Porta TCP | Rota / Proxy Nativo | Credenciais Padrão | Finalidade |
| :--- | :---: | :--- | :--- | :--- |
| **Centro de Comando NOMAD** | `:8080` | `/home` | Cadastrado no 1º acesso | Painel principal e orquestrador do sistema |
| **Monitor de Logs Docker (Dozzle)** | `:9999` | Integrado ao NOMAD | Sessão do NOMAD | Monitoramento de logs de contêineres em tempo real |
| **Open WebUI (Chat IA)** | `:8500` | `/chat` (seletor) | Cadastro no 1º acesso | Interface avançada de inteligência artificial |
| **Biblioteca Offline (Kiwix)** | `:8090` | `/` | Aberto / Sem senha | Consulta a arquivos ZIM e Wikipédia |
| **Ferramentas de TI (IT-Tools)** | `:8430` | `/apps-pt/it-tools/` | Aberto (100% PT-BR) | Utilitários de rede, conversão e criptografia |
| **Ferramentas de Dados (CyberChef)**| `:8100` | `/apps-pt/cyberchef/` | Aberto (100% PT-BR) | Canivete suíço de análise e decodificação |
| **Gerenciador de Arquivos (FileBrowser)** | `:8410` | `/` | `admin` / `nomad` | Gerenciador de arquivos web |
| **Biblioteca de E-books (Calibre-Web)** | `:8083` | `/` | `admin` / `admin123` | Leitor e catálogo digital de livros (pasta `/books`) |
| **Manipulação de PDFs (Stirling PDF)**| `:8087` | `/` | Aberto localmente | Divisão, mesclagem e OCR em PDFs |
| **Educação Offline (Kolibri)** | `:8085` | `/` | Cadastrado no 1º acesso | Cursos Khan Academy, Simulações PhET e livros |
| **Rede Samba (Compartilhamento LAN)**| Porta SMB | `\\IP-DO-NOMAD\nomad` | Definido em Armazenamento | Acesso via rede local Windows Explorer e Mac Finder |

---

## 💻 Requisitos de Hardware

| Perfil de Uso | Processador | Memória RAM | Armazenamento |
| :--- | :--- | :--- | :--- |
| **Mínimo** | x86_64 Dual-Core | 4 GB | 32 GB SSD |
| **Recomendado** | x86_64 Quad-Core | 8 a 16 GB | 500 GB a 1 TB+ (SSD/HD) |
| **Com IA Local (Ollama/WebUI)** | x86_64 Moderno | 16 GB+ | 1 TB+ NVMe (+ GPU NVIDIA/AMD opcional) |

> [!TIP]
> **Aceleração com GPU Externa na Rede Local:** Você pode rodar o N.O.M.A.D. em um notebook ou servidor modesto e conectar a IA diretamente à placa de vídeo do seu PC gamer através da rede local. Veja o passo a passo completo no [Guia de Aceleração de IA na Wiki](https://github.com/ONeithan/Nexus-Nomad/wiki/Aceleracao-IA-com-GPU-Externa).

---

## 📜 Licença e Termos de Uso

* **Projeto Aberto e Não Comercial:** O Nexus Project N.O.M.A.D. é distribuído livremente para fins de sobrevivência, estudo, preparação comunitária e uso pessoal.
* **Proibição Comercial:** É expressamente **proibida** a comercialização, venda, revenda ou licenciamento pago de distribuições derivadas desta versão. Consulte o arquivo [LICENSE](LICENSE) para maiores detalhes.
* **Créditos:** Baseado e expandido a partir da fundação open-source do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad) (Apache 2.0).
