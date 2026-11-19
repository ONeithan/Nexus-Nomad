# Immich (Fotos & Vídeos com TrueNAS Mount)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Immich (Fotos & Vídeos com TrueNAS Mount)** (`nomad_immich`).

- **Identificador do Serviço:** `nomad_immich`
- **Porta TCP Padrão:** `8560`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-immich.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

A mais avançada plataforma de backup e gerenciamento de fotos e vídeos familiares auto-hospedada do mundo.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Você mencionou que tem 88GB de fotos; o Immich preserva os originais em resolução máxima no seu TrueNAS sem pagar assina...
- Porta padrão mapeada: 8560
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Aplicativo móvel para Android e iOS que faz upload automático em segundo plano das fotos tiradas pelo casal. Possui inteligência artificial local de reconhecimento facial (agrupando fotos por membro da família), busca semântica ("fotos na praia comendo pizza"), visualização em mapa mundi e suporte a montagem no TrueNAS.

---

## 💡 4. Exemplo Real de Uso Prático

Sua esposa tira fotos na rua; ao entrar no Wi-Fi de casa, o app sincroniza tudo silenciosamente com o servidor e organiza o álbum do bebê por data e rostos.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8560` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
