# Notas de Lançamento — v1.0.11 (Nexus NOMAD)

## Resumo das Correções e Melhorias

### 1. Eliminação do Badge "0" Fantasma nos Cards (`/supply-depot`)
- **Causa identificada:** No SQLite/AdonisJS, campos booleanos são serializados como `0` ou `1`. No JSX do React, a expressão `{service.installed && (...)}` com valor `0` avalia para o número `0`, fazendo o React renderizar um nó de texto visível `"0"` entre a categoria e a porta do serviço (`Educação 0 :8090`).
- **Correção:** A expressão foi substituída por `{Boolean(service.installed) && (...)}`, garantindo que o React nunca renderize números indesejados quando o serviço não estiver instalado.

### 2. Instalação Robusta e Offline do Kiwix (Local e Remoto)
- **Instalação Local (Dispositivo NOMAD):**
  - Anteriormente, o instalador tentava baixar obrigatoriamente a amostra da Wikipédia do GitHub via internet. Se a conexão oscilasse, caísse ou o sistema estivesse operando 100% offline, o download falhava, disparava uma exceção e acionava a rotina de limpeza que revertia o card para "Instalar".
  - A amostra inicial (`wikipedia_en_100_mini_2026-01.zim`) foi embutida diretamente na imagem Docker do sistema (`assets/kiwix/`). A instalação agora realiza a cópia instantânea localmente sem precisar de internet.
  - Caso o sistema opere sem nenhuma amostra, ele não aborta mais: gera a estrutura XML da biblioteca Kiwix (`<library version="20110515"/>`) e inicia o contêiner Kiwix perfeitamente, pronto para receber arquivos `.zim` pela aba Acervo ZIM.
- **Instalação Remota (Servidor Portainer / Dell Micro):**
  - Configurado Entrypoint inteligente no contêiner que cria automaticamente `/data/kiwix-library.xml` caso o volume remoto esteja vazio, evitando a parada imediata do processo `kiwix-serve`.
  - Corrigido o mapeamento de portas: o contêiner interno escuta na porta `8080/tcp`, sendo mapeado corretamente para a porta do host (`8090`) com `ExposedPorts` devidamente declarada.
  - Argumentos de inicialização (`Cmd`) e variáveis de ambiente aplicados com precisão.
  - Adicionada verificação de saúde pós-início (`State.Running`), com captura automática de logs em caso de encerramento inesperado.

### 3. Sincronização Inteligente de Serviços Remotos (`_syncContainersWithDatabase`)
- **Causa identificada:** A cada atualização da página ou checagem de integridade, a rotina de reconciliação de contêineres comparava os serviços instalados apenas com a lista do Docker local (do notebook Acer). Como o contêiner do Portainer roda no servidor remoto, ele não constava na lista local, fazendo o sistema desmarcar o serviço como desinstalado (`installed = false`).
- **Correção:** Implementado rastreamento durável no KVStore (`portainer.deployedServices`). Serviços implantados no Portainer agora são reconhecidos pela rotina de reconciliação e preservam seu status "Instalado" e "Ativo", exibindo o badge correspondente ("Servidor Portainer").

### 4. Gerenciamento Completo de Ciclo de Vida Remoto
- Os serviços implantados no servidor remoto agora suportam ações de Iniciar (`start`), Parar (`stop`), Reiniciar (`restart`) e Desinstalar (`uninstall`) diretamente pela interface da Central de Aplicativos, comunicando-se com a API REST do Portainer.

### 5. Feedback Reativo da Interface
- Ao finalizar a instalação (`completed`), o card transiciona imediatamente para o estado instalado e ativo antes de disparar o recarregamento suave da página.
- Se ocorrer qualquer erro, uma notificação detalhada é exibida na tela e o botão é liberado para nova tentativa.

### 6. Atualização de Versão
- Configurada a tag oficial `v1.0.11` e imagem `1.0.11-nexus` no workflow de compilação contínua e distribuição de contêineres GHCR.

