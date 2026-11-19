# Homepage (Painel Tático do Homelab)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Homepage (Painel Tático do Homelab)** (`nomad_homepage`).

- **Identificador do Serviço:** `nomad_homepage`
- **Porta TCP Padrão:** `3000`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-homepage.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Dashboard moderno e altamente customizável para monitorar os serviços, contêineres e recursos do seu homelab em uma única tela tática.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Integração nativa com Docker, Portainer, TrueNAS, AdGuard, Proxmox e Weather
- Widgets dinâmicos de consumo de CPU, memória, temperatura e armazenamento
- Busca rápida integrada e categorização visual de aplicações
- Configuração declarativa em arquivos YAML simples

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Consulta as APIs locais dos contêineres e sistemas operacionais e renderiza uma página única de alta performance com temas modernos.

---

## 💡 4. Exemplo Real de Uso Prático

Deixar um tablet antigo na parede da sala ou da oficina exibindo o status de todos os contêineres do homelab e o clima da cidade.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:3000` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
