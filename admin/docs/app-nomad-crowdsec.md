# CrowdSec (Escudo Colaborativo Anti-Invasão)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **CrowdSec (Escudo Colaborativo Anti-Invasão)** (`nomad_crowdsec`).

- **Identificador do Serviço:** `nomad_crowdsec`
- **Porta TCP Padrão:** `8531`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-crowdsec.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Um IPS/IDS inteligente moderno inspirado no Fail2ban, turbinado com inteligência de ameaças coletiva e distribuída mundialmente.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Funciona como um escudo ativo mesmo que seu homelab utilize Cloudflare Tunnels ou portas abertas.
- Porta padrão mapeada: 8531
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Analisa os logs de acesso do Nginx Proxy Manager, Docker e SSH. Ao detectar que um IP externo está fazendo varredura de portas ou tentativas repetidas de senha, ele bane aquele IP no firewall e compartilha a assinatura do invasor com a rede global.

---

## 💡 4. Exemplo Real de Uso Prático

Um bot automatizado na Rússia tenta forçar login no seu servidor; o CrowdSec bloqueia o IP no primeiro segundo e notifica seu painel tático.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8531` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
