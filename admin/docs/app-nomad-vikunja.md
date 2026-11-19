# Vikunja (Gestão de Tarefas & Metas)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Vikunja (Gestão de Tarefas & Metas)** (`nomad_vikunja`).

- **Identificador do Serviço:** `nomad_vikunja`
- **Porta TCP Padrão:** `3456`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-vikunja.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Plataforma completa de gerenciamento de tarefas, checklists operacionais, prazos e projetos com visual moderno Kanban e lista.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Modos de visualização em Lista, Kanban, Tabela e Gráfico de Gantt
- Subtarefas, lembretes com datas de vencimento e prioridades
- Compartilhamento de listas com a esposa ou equipe com controle de permissão
- Sincronização com calendários via CalDAV

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Backend em Go ultra-eficiente com frontend moderno em Vue, persistindo dados em SQLite ou PostgreSQL com suporte a webhooks.

---

## 💡 4. Exemplo Real de Uso Prático

Organizar o plano de manutenção preventiva do carro (troca de óleo, pastilhas, filtros) com alertas automáticos para as datas certas.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:3456` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
