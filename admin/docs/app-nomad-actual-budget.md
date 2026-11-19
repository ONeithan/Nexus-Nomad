# Actual Budget (Orçamento por Envelopes)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Actual Budget (Orçamento por Envelopes)** (`nomad_actual_budget`).

- **Identificador do Serviço:** `nomad_actual_budget`
- **Porta TCP Padrão:** `8521`
- **Categoria Operacional:** Finanças
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-actual-budget.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Sistema focado no método "envelope budgeting" (dar um destino a cada real recebido), com interface ultra-rápida construída em React e SQLite.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Excelente para o controle tático do orçamento mensal do casal quando você quer rapidez máxima para saber quanto ainda po...
- Porta padrão mapeada: 8521
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Funciona inteiramente no navegador local e sincroniza alterações criptografadas ponta a ponta com seu servidor N.O.M.A.D. e com o aplicativo de celular. Mesmo sem internet na rua, você lança despesas e ele sincroniza assim que reconectar.

---

## 💡 4. Exemplo Real de Uso Prático

Você abre o app na fila do restaurante; ele mostra na hora: "Você ainda tem R$ 180 no envelope de Lazer deste mês".

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8521` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
