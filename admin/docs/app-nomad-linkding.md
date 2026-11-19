# Linkding (Marcadores & Favoritos)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Linkding (Marcadores & Favoritos)** (`nomad_linkding`).

- **Identificador do Serviço:** `nomad_linkding`
- **Porta TCP Padrão:** `9090`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-linkding.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Gerenciador e arquivador de marcadores (bookmarks) ultra-rápido, limpo e com busca instantânea de links e artigos salvos.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Interface minimalista de altíssima velocidade sem distrações
- Tags inteligentes (#artigo, #homelab, #receita) e busca instantânea
- Arquivamento automático de cópias de páginas no Wayback Machine ou localmente
- Extensões oficiais para Chrome e Firefox e atalho no celular

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Construído em Python/Django com banco SQLite. Ao salvar um link, ele extrai título, descrição e arquiva uma cópia para leitura futura.

---

## 💡 4. Exemplo Real de Uso Prático

Salvar tutoriais técnicos que você encontra na internet para ler mais tarde, garantindo que o conteúdo permaneça acessível mesmo se o site original sair do ar.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:9090` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
