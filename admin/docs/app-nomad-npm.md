# Nginx Proxy Manager (Nomes Amigáveis)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Nginx Proxy Manager (Nomes Amigáveis)** (`nomad_npm`).

- **Identificador do Serviço:** `nomad_npm`
- **Porta TCP Padrão:** `8520`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-npm.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin@example.com`
- **Senha Padrão:** `changeme`
- **Instruções de Primeiro Acesso:** Credenciais de fábrica do Nginx Proxy Manager. Altere e-mail e senha após o primeiro login.

---

## 🎯 1. Para Que Serve Este Aplicativo

Gerenciador visual de proxy reverso e certificados SSL/TLS Let's Encrypt.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.
- Porta padrão mapeada: 8520
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Mapeia portas e IPs locais para domínios elegantes e amigáveis (ex: `fotos.home.lan` para a porta 8560, `jellyfin.home.lan` para a porta 8096) com renovação automática de certificados criptografados.

---

## 💡 4. Exemplo Real de Uso Prático

Elimina a necessidade de decorar números de portas ou IPs para acessar as aplicações dentro e fora de casa.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8520` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
