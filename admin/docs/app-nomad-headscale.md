# Headscale / Netbird (VPN Mesh Própria)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Headscale / Netbird (VPN Mesh Própria)** (`nomad_headscale`).

- **Identificador do Serviço:** `nomad_headscale`
- **Porta TCP Padrão:** `8535`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-headscale.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Implementação auto-hospedada e de código aberto do servidor de controle Tailscale / Netbird.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Dá a comodidade do Tailscale sem depender dos servidores corporativos de terceiros para guardar a chave de roteamento da...
- Porta padrão mapeada: 8535
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta todos os seus computadores, servidores, TrueNAS e celulares em uma única rede mesh ponto a ponto criptografada, permitindo que eles se comuniquem diretamente mesmo atrás de roteadores e CGNAT da operadora de internet.

---

## 💡 4. Exemplo Real de Uso Prático

Você está no trabalho usando o notebook; digita `ssh truenas.nexus` e acessa o terminal do seu servidor em casa sem precisar abrir nenhuma porta no roteador.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8535` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
