# FreePBX / Asterisk (Central Telefônica IP)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **FreePBX / Asterisk (Central Telefônica IP)** (`nomad_freepbx`).

- **Identificador do Serviço:** `nomad_freepbx`
- **Porta TCP Padrão:** `8625`
- **Categoria Operacional:** Comunicação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-freepbx.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Central telefônica PBX completa com suporte a ramais SIP, interfonia e gravação de chamadas.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8625
- Categoria operacional: communication
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Permite transformar celulares, computadores ou telefones IP da casa em ramais internos (ex: ramal 101 para a sala, ramal 102 para a bancada, ramal 103 para o quarto), permitindo chamadas internas gratuitas sem sinal de celular.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de communication com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8625` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
