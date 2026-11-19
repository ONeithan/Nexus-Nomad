# Wallos (Rastreador de Assinaturas & Fixas)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Wallos (Rastreador de Assinaturas & Fixas)** (`nomad_wallos`).

- **Identificador do Serviço:** `nomad_wallos`
- **Porta TCP Padrão:** `8522`
- **Categoria Operacional:** Finanças
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-wallos.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Painel visual dedicado a monitorar assinaturas de serviços, contas recorrentes e contratos de longo prazo.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Elimina o problema clássico de assinar ferramentas ou serviços e esquecer que eles continuam sendo debitados todo mês no...
- Porta padrão mapeada: 8522
- Categoria operacional: finance
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Registra ciclos de cobrança (mensal, anual, trimestral), formas de pagamento utilizadas, conversão automática de moedas (se assina algo em dólar/euro) e data exata da próxima fatura.

---

## 💡 4. Exemplo Real de Uso Prático

Você cadastra suas contas de internet, condomínio, luz e ferramentas; o Wallos mostra um calendário visual com todos os dias de vencimento e o gasto fixo total do mês consolidado.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8522` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
