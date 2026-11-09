# Notas de Lançamento — v1.0.11 (Nexus NOMAD)

## Resumo das Correções e Melhorias

### 1. Eliminação do Badge "0" Fantasma nos Cards (`/supply-depot`)
- **Causa identificada:** No SQLite/AdonisJS, campos booleanos são serializados como `0` ou `1`. No JSX do React, a expressão `{service.installed && (...)}` com valor booleano falso avaliava para o número `0`, fazendo o React renderizar um nó de texto visível `"0"` entre a categoria e a porta do serviço (`Educação 0 :8090`).
- **Correção:** A expressão foi substituída por `{Boolean(service.installed) && (...)}`, garantindo que o React nunca renderize números indesejados quando o serviço não estiver instalado.

### 2. Descoberta Dinâmica de Todas as 15 Stacks do Servidor Portainer
- **Causa identificada:** Anteriormente o NOMAD utilizava uma lista estática fixa de serviços conhecidos, exibindo apenas 10 ou 11 itens mesmo quando o usuário possuía 15 stacks em execução no Portainer.
- **Correção:** O NOMAD agora consulta dinamicamente a API de Stacks (`/api/stacks`) e a API de contêineres do Portainer (`/api/endpoints/{id}/docker/containers/json?all=1`). Todas as 15 stacks do usuário são reconhecidas e listadas na aba "Instalados" com suas respectivas portas públicas expostas e botões "Abrir" funcionais.

### 3. Atualização e Precisão dos Metadados das Aplicações Remotas
- **Meelo:** Atualizado para `Meelo (Streaming de Música)` — Servidor de streaming e gerenciamento de músicas e videoclipes musicais.
- **Yubal:** Atualizado para `Yubal (Download de Músicas)` — Download e gerenciamento de músicas e álbuns para a biblioteca local.
- **Ignis:** Atualizado para `Ignis (Obsidian / Notas)` — Obsidian Web / Gestão de notas e segundo cérebro pessoal.

### 4. Suporte a 100% do Catálogo de Aplicações via Portainer Stacks API (Docker Compose Universal)
- O gerador de Stacks Docker Compose foi totalmente reformulado para cobrir **todas as aplicações do catálogo NOMAD**:
  - **Múltiplas Portas Suportadas:** Reconhece e mapeia todas as portas internas e secundárias (ex: Kolibri 8080 e 8311 para exercícios interativos, Qdrant 6333 e 6334, Calibre-Web 8083, Vaultwarden 80, Stirling PDF 8080, etc.).
  - **Múltiplos Volumes Declarativos:** Converte cada diretório de persistência do `container_config` em volumes nomeados duráveis e isolados no Docker do Portainer (ex: `nomad-<app>-config`, `nomad-<app>-data`, `nomad-<app>-books`).
  - **Variáveis de Ambiente Completas:** Repassa automaticamente todas as variáveis de configuração de cada serviço (`Env`).
  - **Inicializadores de Segurança e Dependência:**
    - **Kiwix:** Executa *init-container* ultraleve para provisionar `/data/kiwix-library.xml` no volume compartilhado antes da subida do `kiwix-serve`.
    - **Vaultwarden:** Executa *init-container* com geração de certificados TLS autoassinados (`/data/cert.pem` e `/data/key.pem`) para desbloqueio seguro do cofre no navegador.
- **Validação Rigorosa:** Exige API Key antes da instalação remota, com verificação de integridade pós-deploy (`State.Running`) e captura de logs em caso de falha.

### 5. Atualização Remota Universal de Aplicações (`updateService`)
- A rotina de atualização de aplicativos do sistema foi estendida para reconhecer serviços executados no Portainer.
- Ao solicitar atualização de versão no painel (individual ou via auto-update geral), o sistema dispara o pull da nova imagem no Portainer e realiza o re-deploy da Stack via API REST mantendo **100% dos volumes e dados de usuário preservados**.

### 6. Sincronização e Reconciliação Durável (`_syncContainersWithDatabase`)
- Rastreamento durável de serviços remotos gravado no KVStore (`portainer.deployedServices`).
- A rotina de reconciliação periódica de contêineres foi atualizada para respeitar serviços implantados no Portainer, impedindo que sejam desmarcados ou desvinculados.
- Suporte completo a operações de ciclo de vida (`start`, `stop`, `restart` e `uninstall`) comunicando diretamente com o Portainer.

### 7. Atualização de Versão e Workflow
- Bumping para `v1.0.11` (`1.0.11-nexus`) com compilação e publicação automática no GitHub Container Registry (GHCR).
