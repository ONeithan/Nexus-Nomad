# Authentik (Login Único com Biometria - SSO)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Authentik (Login Único com Biometria - SSO)** (`nomad_authentik`).

- **Identificador do Serviço:** `nomad_authentik`
- **Porta TCP Padrão:** `8530`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-authentik.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Plataforma corporativa de autenticação e gerenciamento de identidade (IdP) baseada em padrões abertos OAuth2, SAML e OpenID Connect.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Protege toda a infraestrutura com autenticação moderna e permite revogar acessos de qualquer aparelho em um clique.
- Porta padrão mapeada: 8530
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Intercepta o acesso a qualquer serviço do seu homelab. Em vez de memorizar 30 senhas diferentes, você faz login apenas no Authentik usando a impressão digital do celular (Passkey / WebAuthn) e ele autoriza sua sessão em todos os outros apps com segurança bancária.

---

## 💡 4. Exemplo Real de Uso Prático

Ao acessar o Portainer ou o Outline de fora de casa, o sistema pede sua biometria no celular antes de liberar a tela.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8530` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
