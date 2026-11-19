# Assistente de IA Local

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Assistente de IA Local** (`nomad_ollama`).

- **Identificador do Serviço:** `nomad_ollama`
- **Porta TCP Padrão:** `11434`
- **Categoria Operacional:** IA & Agentes
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-ollama.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Motor central de inferência de inteligência artificial generativa local com aceleração de GPU dedicada.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Execução local de modelos avançados (Llama 3.2, Mistral, Qwen, DeepSeek)
- Aceleração direta na GPU dedicada (RTX 5060)
- API aberta compatível com OpenAI para integração com Open WebUI e n8n
- Privacidade absoluta: zero telemetria ou envio de conversas para a nuvem

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Carrega modelos de IA quantizados diretamente na memória VRAM da GPU e processa tokens via CUDA em velocidade máxima, expondo endpoints de API locais para o assistente do N.O.M.A.D.

---

## 💡 4. Exemplo Real de Uso Prático

Resumir contratos longos, analisar códigos-fonte de projetos ou tirar dúvidas confidenciais com um assistente tão inteligente quanto o ChatGPT, sem que nenhuma palavra saia do seu computador.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:11434` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
