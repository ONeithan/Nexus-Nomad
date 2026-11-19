# DokuWiki (Wiki em Texto Puro)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **DokuWiki (Wiki em Texto Puro)** (`nomad_dokuwiki`).

- **Identificador do Serviço:** `nomad_dokuwiki`
- **Porta TCP Padrão:** `8080`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-dokuwiki.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Wiki colaborativa extremamente rápida e leve que armazena todas as páginas diretamente em arquivos de texto puro sem exigir banco de dados.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Armazenamento em arquivos de texto puro (.txt) fáceis de fazer backup
- Sintaxe wiki simples e suporte a tabelas e imagens
- Controle de acesso granular e histórico de revisões
- Centenas de plugins e temas personalizáveis

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Grava cada artigo diretamente no sistema de arquivos do Linux. Para fazer backup ou migrar, basta copiar a pasta de arquivos.

---

## 💡 4. Exemplo Real de Uso Prático

Criar o manual de emergência da residência para que qualquer pessoa leia mesmo se o banco de dados SQL do servidor falhar.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8080` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
