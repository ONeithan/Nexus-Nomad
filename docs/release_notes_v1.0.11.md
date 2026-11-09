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

### 4. Instalação Real de Aplicações via Portainer Stacks API (Docker Compose)
- **Causa identificada da falha anterior do Kiwix:**
  - O contêiner oficial do Kiwix (`ghcr.io/kiwix/kiwix-serve`) utiliza como ponto de entrada o binário compilado `/usr/local/bin/kiwix-serve`. Quando iniciado com `--library /data/kiwix-library.xml` em um volume Docker remoto recém-criado e vazio, o processo encerrava no primeiro segundo com erro de arquivo inexistente.
  - O sistema dependia de chamadas manuais à Docker Engine do Portainer sujeitas a timeouts curtos e sem provisionamento de volumes compose.
- **Solução Arquitetural Definitiva:**
  - A implantação no Portainer agora utiliza a **Portainer Stacks API oficial** (`POST /api/stacks/create/standalone/string?endpointId={id}`), gerando arquivos Docker Compose nativos com persistência durável em volumes.
  - Para o **Kiwix**, a stack inclui automaticamente um contêiner inicializador leve (`init-library`) que assegura a criação do arquivo de biblioteca `/data/kiwix-library.xml` no volume compartilhado antes da execução do `kiwix-serve`, garantindo que a aplicação suba 100% saudável e responsiva na porta `8090`.
  - Para quaisquer outras aplicações do catálogo do NOMAD, o sistema monta a definição Docker Compose equivalente com mapeamento seguro de portas, variáveis de ambiente e volumes nomeados.
  - Validação estrita de credenciais: o sistema exige e valida a API Key do Portainer antes do deploy, eliminando falsos positivos e exibindo notificações detalhadas em tempo real via SSE.
  - Verificação de saúde (`healthcheck`) pós-deploy para assegurar que a stack e seus contêineres estejam de fato em execução (`running`) antes de marcar como instalada.

### 5. Sincronização e Reconciliação Durável (`_syncContainersWithDatabase`)
- Rastreamento durável de serviços remotos gravado no KVStore (`portainer.deployedServices`).
- A rotina de reconciliação periódica de contêineres foi atualizada para respeitar serviços implantados no Portainer, impedindo que sejam desmarcados ou desvinculados.
- Suporte completo a operações de ciclo de vida (`start`, `stop`, `restart` e `uninstall`) comunicando diretamente com o Portainer.

### 6. Atualização de Versão e Workflow
- Bumping para `v1.0.11` (`1.0.11-nexus`) com compilação e publicação automática no GitHub Container Registry (GHCR).
