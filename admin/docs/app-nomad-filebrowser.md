# Gerenciador de Arquivos (FileBrowser)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Gerenciador de Arquivos (FileBrowser)** (`nomad_filebrowser`).

- **Identificador do Serviço:** `nomad_filebrowser`
- **Porta TCP Padrão:** `8410`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-filebrowser.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `nomad`
- **Instruções de Primeiro Acesso:** Login padrão criado pelo N.O.M.A.D. (ou use o usuário/senha global configurado em Servidores Remotos).

---

## 🎯 1. Para Que Serve Este Aplicativo

Explorador de arquivos completo no navegador para gerenciar e transferir dados no servidor N.O.M.A.D.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Upload e download rápido de pastas inteiras e arquivos pesados
- Editor de texto embutido e reprodutor de vídeos e músicas
- Compartilhamento seguro de links com prazo de expiração
- Acesso direto às pastas de livros, mídias e documentos

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Atua como uma ponte visual sobre o sistema de arquivos local do Linux, expondo as pastas montadas em uma interface moderna e segura com controle de usuários.

---

## 💡 4. Exemplo Real de Uso Prático

Mover um vídeo ou ISO de 10GB do seu computador para o servidor com arrastar e soltar no navegador sem precisar abrir cliente FTP ou terminal.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8410` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
