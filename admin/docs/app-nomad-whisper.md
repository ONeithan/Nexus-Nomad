# Whisper.cpp (Transcrição Offline de Voz)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Whisper.cpp (Transcrição Offline de Voz)** (`nomad_whisper`).

- **Identificador do Serviço:** `nomad_whisper`
- **Porta TCP Padrão:** `8507`
- **Categoria Operacional:** IA & Agentes
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-whisper.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Versão em C/C++ de alto desempenho do modelo de transcrição de voz da OpenAI, otimizada para CPUs e placas de vídeo locais.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Transcreve reuniões, áudios longos e gravações familiares com 100% de privacidade e sem custos de nuvem.
- Porta padrão mapeada: 8507
- Categoria operacional: ai
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Expõe uma API compatível com OpenAI para onde você envia arquivos de áudio (.mp3, .ogg, .wav) ou notas de voz do WhatsApp e recebe a transcrição precisa em texto com pontuação correta e identificação de idioma.

---

## 💡 4. Exemplo Real de Uso Prático

Integrar ao n8n para que qualquer áudio de voz enviado para um bot do Telegram seja transcrito na hora e arquivado no seu diário pessoal ou no Outline.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8507` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
