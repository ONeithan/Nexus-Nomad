# Open WebUI (Chat IA Local)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Open WebUI (Chat IA Local)** (`nomad_open_webui`).

- **Identificador do Serviço:** `nomad_open_webui`
- **Porta TCP Padrão:** `8501`
- **Categoria Operacional:** IA & Agentes
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-open-webui.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar no 1º acesso`
- **Senha Padrão:** `Criar no 1º acesso`
- **Instruções de Primeiro Acesso:** O primeiro usuário cadastrado na tela inicial assume automaticamente o papel de Administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Interface web de chat estilo ChatGPT / Claude com suporte nativo a Ollama, vLLM e OpenAI API.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Permite aproveitar todo o potencial da sua RTX 5060 rodando modelos como Llama 3.2, Mistral, Qwen e DeepSeek sem enviar ...
- Porta padrão mapeada: 8501
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se ao daemon do Ollama na porta 11434 e renderiza uma UI rica com suporte a RAG (Retrieval Augmented Generation), upload de documentos PDF/DOCX, navegação web privativa, execução de código e múltiplos usuários com controle de acesso.

---

## 💡 4. Exemplo Real de Uso Prático

Você sobe o manual da sua placa-mãe ou um PDF de 500 páginas e pergunta "Qual é o barramento PCIe correto para colocar o segundo SSD NVMe?", e o Open WebUI responde em segundos citando a página exata.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8501` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
