# Tradutor Offline (LibreTranslate)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Tradutor Offline (LibreTranslate)** (`nomad_translate`).

- **Identificador do Serviço:** `nomad_translate`
- **Porta TCP Padrão:** `8000`
- **Categoria Operacional:** Educação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-translate.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Motor de tradução automática neural de textos e documentos entre dezenas de idiomas sem internet.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Tradução de textos longos entre Português, Inglês, Espanhol e outros
- API aberta para traduzir livros do Calibre Web e coleções Kiwix
- Execução em redes neurais locais sem limite de requisições
- Zero vazamento de dados de documentos sensíveis

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Utiliza modelos baseados em transformers rodando localmente no processador, preservando sigilo absoluto.

---

## 💡 4. Exemplo Real de Uso Prático

Traduzir um manual técnico de 20 páginas em alemão ou russo diretamente para português sem colar nenhum trecho no Google Tradutor.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8000` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
