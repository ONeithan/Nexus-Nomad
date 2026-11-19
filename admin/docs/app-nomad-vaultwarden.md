# Cofre de Senhas (Vaultwarden)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Cofre de Senhas (Vaultwarden)** (`nomad_vaultwarden`).

- **Identificador do Serviço:** `nomad_vaultwarden`
- **Porta TCP Padrão:** `8480`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-vaultwarden.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta na tela inicial`
- **Senha Padrão:** `Criar senha mestre na tela inicial`
- **Instruções de Primeiro Acesso:** Clique em "Criar Conta" para gerar seu cofre. O painel /admin usa o ADMIN_TOKEN caso configurado nas Credenciais Globais.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor de cofre de senhas Bitwarden privado, leve e 100% sob seu controle físico.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Compatível com as extensões oficiais do Bitwarden para navegadores e celulares
- Criptografia de ponta a ponta AES-256 e derivação de chave Argon2
- Preenchimento automático seguro de logins, senhas e cartões
- Gerador de códigos de dois fatores (2FA / TOTP) embutido

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Implementação em Rust de altíssima eficiência. Todas as senhas são criptografadas no seu celular antes de serem enviadas para o servidor.

---

## 💡 4. Exemplo Real de Uso Prático

Fazer login em bancos e lojas em 1 segundo no celular usando a biometria, com senhas únicas de 30 caracteres para cada site, sem salvar nada nas nuvens do Google ou Apple.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8480` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
