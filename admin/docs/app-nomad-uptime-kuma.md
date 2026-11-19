# Uptime Kuma (Monitor de Quedas de Serviços)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Uptime Kuma (Monitor de Quedas de Serviços)** (`nomad_uptime_kuma`).

- **Identificador do Serviço:** `nomad_uptime_kuma`
- **Porta TCP Padrão:** `8548`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-uptime-kuma.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Ferramentas visuais de monitoramento de integridade e tempo de atividade (uptime) de serviços e servidores.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.
- Porta padrão mapeada: 8548
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Testam a cada 30 segundos se cada porta, site, contêiner Docker e ping de roteador está respondendo normalmente. Se qualquer serviço falhar, disparam alarmes sonoros e notificações imediatas.

---

## 💡 4. Exemplo Real de Uso Prático

Permite saber que um serviço caiu antes mesmo de você ou sua família tentarem acessá-lo.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8548` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
