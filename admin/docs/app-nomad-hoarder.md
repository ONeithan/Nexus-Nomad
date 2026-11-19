# Hoarder (Coletor Inteligente com IA)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Hoarder (Coletor Inteligente com IA)** (`nomad_hoarder`).

- **Identificador do Serviço:** `nomad_hoarder`
- **Porta TCP Padrão:** `8506`
- **Categoria Operacional:** IA & Agentes
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-hoarder.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

O melhor gerenciador de bookmarks e "leia mais tarde" já criado para homelabs, turbinado com IA.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Preserva todo o conhecimento que você descobre na web mesmo se o site original for derrubado ou virar pago.
- Porta padrão mapeada: 8506
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Você envia um link, tweet, imagem ou PDF via extensão de navegador ou app móvel. O Hoarder arquiva a página inteira offline, extrai o texto limpo sem anúncios, aciona o Ollama local na sua máquina para classificar categorias, gerar resumo e criar tags automáticas.

---

## 💡 4. Exemplo Real de Uso Prático

Salvar artigos de eletrônica ou threads técnicas; a IA lê o artigo, gera tags como `#kicad`, `#firmware`, `#rtx` e você acha tudo instantaneamente pela busca inteligente.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8506` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
