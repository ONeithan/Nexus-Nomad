# UrBackup (Backup Invisível Bare-Metal dos PCs)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **UrBackup (Backup Invisível Bare-Metal dos PCs)** (`nomad_urbackup`).

- **Identificador do Serviço:** `nomad_urbackup`
- **Porta TCP Padrão:** `8650`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-urbackup.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

O mais robusto sistema de backup bare-metal cliente-servidor para computadores Windows e Linux.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8650
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Roda um cliente silencioso em segundo plano nos computadores da casa. Cria cópias de segurança automáticas de imagens completas de disco pela rede: se o SSD do seu computador queimar, basta plugar um novo disco e restaurar a máquina exatamente como estava em minutos.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8650` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
