# Ferramentas de Dados (CyberChef)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Ferramentas de Dados (CyberChef)** (`nomad_cyberchef`).

- **Identificador do Serviço:** `nomad_cyberchef`
- **Porta TCP Padrão:** `8100`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-cyberchef.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Canivete suíço de operações analíticas, decodificação, criptografia e tratamento de dados com interface nativa em português.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Mais de 300 operações encadeáveis em pipeline visual tipo receita
- Conversões entre Base64, Hexadecimal, Binário, URL e Unicode
- Cálculo de hashes (SHA-256, MD5, Keccak) e decodificação JWT
- Interface nativa 100% traduzida em Português do Brasil no N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executa integralmente no navegador do cliente via JavaScript. Os dados colados nunca transitam pela rede, permitindo analisar chaves e credenciais com segurança total.

---

## 💡 4. Exemplo Real de Uso Prático

Você recebe um log de rede corrompido ou codificado em Base64 com gzip; joga no CyberChef, arrasta as operações "De Base64" e "Gunzip" e visualiza o texto puro em 2 segundos.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8100` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
