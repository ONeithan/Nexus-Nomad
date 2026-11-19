# Microbin (Pastebin Privado com Autodestruição)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Microbin (Pastebin Privado com Autodestruição)** (`nomad_microbin`).

- **Identificador do Serviço:** `nomad_microbin`
- **Porta TCP Padrão:** `8648`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-microbin.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Compartilhador ultrarrápido de trechos de código, logs e senhas temporárias com expiração por tempo ou leitura única.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8648
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executado em contêiner Docker isolado na porta 8648, persistindo dados em volumes dedicados.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8648` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
