# Notas de Lançamento — v1.0.10 (Nexus NOMAD)

## Resumo das Correções e Melhorias

### 1. Correção da Tela Preta na Central de Aplicativos (`/supply-depot`)
- **Causa identificada:** O componente de ícone `IconDeviceDesktop` não havia sido importado de `@tabler/icons-react` e o estado reativo `services` não estava declarado no escopo do componente React. No navegador, isso gerava um erro de execução JavaScript (`ReferenceError`), desarmando a árvore do React e tornando a tela totalmente preta.
- **Correção:** Importado o ícone correto, declarado o estado `const [services, setServices] = useState<ServiceSlim[]>(props.system.services)` com sincronização automática e atualizada a lista de filtros. O card agora exibe o estado "Instalando..." sem travar nem recarregar a tela em branco.

### 2. Feedback de Instalação em Tempo Real para o Portainer
- **Causa identificada:** Ao clicar para instalar no Servidor Remoto (Portainer), os eventos de progresso eram emitidos apenas em canais privados (`services:portainer:...`) e não chegavam ao componente de feed de atividades (`InstallActivityFeed`), fazendo parecer que nada estava acontecendo.
- **Correção:** O serviço do Portainer agora transmite todos os eventos (`pulling`, `creating`, `starting`, `completed` e `error`) diretamente para o canal oficial de transmissão de instalações. A barra de atividades na tela agora mostra o progresso do download da imagem Docker e a criação do contêiner em tempo real.

### 3. Ajuste de Timeout e Resiliência na API do Portainer
- O download de imagens Docker no Portainer passou a utilizar timeout estendido de até 5 minutos (evitando abortar prematuramente em imagens grandes).
- Se o contêiner já existir no Portainer (erro 409), o sistema agora localiza o contêiner existente e o inicializa de forma transparente.
- Mapeamento automático de volumes persistentes de dados (`nomad-<serviço>-data:/data`).

### 4. Bumping de Versão para v1.0.10
- Imagem configurada para build e publicação automática: `ghcr.io/oneithan/nexus-nomad:v1.0.10` e `1.0.10-nexus`.

