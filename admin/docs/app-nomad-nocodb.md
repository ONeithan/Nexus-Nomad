# NocoDB (Visualizador de Bancos como Planilha)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **NocoDB (Visualizador de Bancos como Planilha)** (`nomad_nocodb`).

- **Identificador do Serviço:** `nomad_nocodb`
- **Porta TCP Padrão:** `8582`
- **Categoria Operacional:** Automação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-nocodb.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Interface no-code que se conecta a bancos de dados relacionais existentes (PostgreSQL, MySQL, SQLite) e os transforma em uma interface visual de planilha colaborativa.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL co...
- Porta padrão mapeada: 8582
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se ao banco de dados do seu próprio sistema ou de outros contêineres e expõe os dados em tabelas com filtros avançados e geração instantânea de APIs REST.

---

## 💡 4. Exemplo Real de Uso Prático

Visualizar e consultar tabelas de dados de contêineres do homelab sem precisar abrir o terminal ou rodar comandos SQL complexos.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8582` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
