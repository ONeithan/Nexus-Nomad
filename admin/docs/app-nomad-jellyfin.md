# Servidor de Mídia (Jellyfin)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Servidor de Mídia (Jellyfin)** (`nomad_jellyfin`).

- **Identificador do Serviço:** `nomad_jellyfin`
- **Porta TCP Padrão:** `8490`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-jellyfin.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Central de streaming de filmes, séries, animes e vídeos familiares para Smart TVs, computadores e celulares.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Transcodificação acelerada por hardware na GPU dedicada (RTX 5060)
- Metadados automáticos com cartazes, sinopses e legendas
- Aplicativos nativos para Smart TV Samsung, LG, Android TV e Roku
- Perfis separados para você, sua esposa e seus filhos com controle etário

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Indexa suas pastas de vídeos no TrueNAS ou HD local e transmite diretamente para aparelhos da casa em alta resolução.

---

## 💡 4. Exemplo Real de Uso Prático

Assistir aos filmes e desenhos do seu acervo no conforto do sofá da sala em 4K HDR sem buffering e sem depender de assinaturas de streaming que removem títulos do catálogo.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8490` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
