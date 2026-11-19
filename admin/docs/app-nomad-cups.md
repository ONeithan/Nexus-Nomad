# CUPS Print Server (Central de Impressão da Casa)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **CUPS Print Server (Central de Impressão da Casa)** (`nomad_cups`).

- **Identificador do Serviço:** `nomad_cups`
- **Porta TCP Padrão:** `8649`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-cups.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor universal de impressão baseado em padrões abertos.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8649
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta impressoras antigas que não têm Wi-Fi via USB no servidor e as compartilha pela rede com suporte nativo a AirPrint para imprimir direto do iPhone, iPad, Android e Windows sem instalar drivers proprietários.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8649` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
