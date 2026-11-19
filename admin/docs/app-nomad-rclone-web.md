# Rclone Web (Central de Sincronização)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Rclone Web (Central de Sincronização)** (`nomad_rclone_web`).

- **Identificador do Serviço:** `nomad_rclone_web`
- **Porta TCP Padrão:** `5572`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-rclone-web.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `nomad`
- **Instruções de Primeiro Acesso:** Login HTTP básico padrão da interface Rclone Web.

---

## 🎯 1. Para Que Serve Este Aplicativo

Interface web moderna do motor Rclone para gerenciar transferências, sincronizações criptografadas e backups entre discos locais e nuvens.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Suporte a mais de 40 provedores (Google Drive, OneDrive, S3, SFTP, WebDAV)
- Criptografia transparente de arquivos na origem antes do envio
- Painel visual com controle de velocidade, filas e logs em tempo real
- Montagem de pastas remotas como discos locais

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Atua como uma camada de abstração universal de armazenamento, transferindo arquivos com verificação de integridade MD5/SHA-1.

---

## 💡 4. Exemplo Real de Uso Prático

Fazer backup criptografado das suas fotos do N.O.M.A.D. para uma conta de nuvem; se a nuvem for invadida, ninguém consegue ver suas fotos porque estão indecifráveis.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:5572` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
