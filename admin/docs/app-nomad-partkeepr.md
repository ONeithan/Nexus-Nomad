# PartKeepr (Estoque de Componentes Eletrônicos)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **PartKeepr (Estoque de Componentes Eletrônicos)** (`nomad_partkeepr`).

- **Identificador do Serviço:** `nomad_partkeepr`
- **Porta TCP Padrão:** `8601`
- **Categoria Operacional:** Oficina & Hardware
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-partkeepr.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `admin`
- **Instruções de Primeiro Acesso:** Login padrão inicial do PartKeepr.

---

## 🎯 1. Para Que Serve Este Aplicativo

Sistema especializado em catalogar resistores, capacitores, transistores, microcontroladores (ESP32, STM32, Arduino) e chips SMD.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8601
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Registra parâmetros elétricos (tolerância, encapsulamento 0805/0603, tensão máxima, datasheets em PDF anexados) e quantidade disponível em cada carretel ou fita.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de workshop com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8601` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
