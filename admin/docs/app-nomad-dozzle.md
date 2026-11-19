# Monitor de Logs Docker (Dozzle)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Monitor de Logs Docker (Dozzle)** (`nomad_dozzle`).

- **Identificador do Serviço:** `nomad_dozzle`
- **Porta TCP Padrão:** `8080`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-dozzle.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Visualizador leve em tempo real dos logs de todos os contêineres Docker em execução no sistema.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Transmissão instantânea de logs sem recarregar a página
- Filtros de busca rápida por termos de erro (error, fail, timeout)
- Estatísticas de uso de memória e CPU por contêiner
- Interface escura tática sem necessidade de banco de dados

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se diretamente ao socket do Docker (/var/run/docker.sock) e lê as saídas padrão stdout e stderr dos contêineres.

---

## 💡 4. Exemplo Real de Uso Prático

Um aplicativo não está abrindo; você entra no Dozzle, clica no nome do contêiner e vê imediatamente a linha exata do erro que está ocorrendo.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8080` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
