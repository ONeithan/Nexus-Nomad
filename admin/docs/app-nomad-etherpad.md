# Etherpad Lite (Editor em Tempo Real Colaborativo)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Etherpad Lite (Editor em Tempo Real Colaborativo)** (`nomad_etherpad`).

- **Identificador do Serviço:** `nomad_etherpad`
- **Porta TCP Padrão:** `8626`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-etherpad.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Editores de texto colaborativo simultâneo onde duas ou mais pessoas escrevem no mesmo documento vendo o cursor do outro em tempo real.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8626
- Categoria operacional: productivity
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executado em contêiner Docker isolado na porta 8626, persistindo dados em volumes dedicados.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de productivity com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8626` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
