# Sincronização P2P (Syncthing)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Sincronização P2P (Syncthing)** (`nomad_syncthing`).

- **Identificador do Serviço:** `nomad_syncthing`
- **Porta TCP Padrão:** `8384`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-syncthing.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Sincronização contínua e criptografada de pastas entre computadores, celulares e o servidor sem nuvem.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Sincronização automática em segundo plano via rede local ou remota
- Criptografia TLS ponta a ponta e controle de versões de arquivos
- Substituto privado do Dropbox, Google Drive e OneDrive
- Não depende de servidores centrais para transferência direta

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta seus aparelhos diretamente por identificadores criptográficos únicos de dispositivo.

---

## 💡 4. Exemplo Real de Uso Prático

Sua pasta de projetos do Obsidian e documentos de engenharia ficam sempre sincronizados entre o notebook da rua e o computador da sua bancada de trabalho de forma invisível.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8384` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
