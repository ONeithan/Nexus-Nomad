# Podgrab (Baixador Silencioso de Podcasts)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Podgrab (Baixador Silencioso de Podcasts)** (`nomad_podgrab`).

- **Identificador do Serviço:** `nomad_podgrab`
- **Porta TCP Padrão:** `8567`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-podgrab.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Aplicativo leve que se inscreve nos seus podcasts favoritos e baixa automaticamente os novos episódios assim que são lançados, salvando diretamente na pasta do Audiobookshelf.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8567
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executado em contêiner Docker isolado na porta 8567, persistindo dados em volumes dedicados.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de media com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8567` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
