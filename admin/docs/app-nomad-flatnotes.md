# Bloco de Notas (Flatnotes)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Bloco de Notas (Flatnotes)** (`nomad_flatnotes`).

- **Identificador do Serviço:** `nomad_flatnotes`
- **Porta TCP Padrão:** `8200`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-flatnotes.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Editor e organizador de notas rápidas em Markdown focado em simplicidade pura, sem necessidade de banco de dados.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Notas salvas como arquivos .md puros diretamente no disco
- Busca rápida por palavras-chave e suporte a tags (#projeto, #casa)
- Visualização lado a lado e histórico simples de edição
- Compatibilidade nativa com Obsidian, VS Code e Syncthing

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Lê uma pasta de arquivos de texto no disco. Não possui banco de dados proprietário; seus arquivos são seus e você pode copiá-los livremente.

---

## 💡 4. Exemplo Real de Uso Prático

Anotar as senhas de Wi-Fi de hóspedes, medidas de um móvel que você vai construir ou comandos que você sempre esquece.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8200` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
