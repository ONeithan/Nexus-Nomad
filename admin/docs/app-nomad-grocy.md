# Grocy (ERP Residencial & Despensa)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Grocy (ERP Residencial & Despensa)** (`nomad_grocy`).

- **Identificador do Serviço:** `nomad_grocy`
- **Porta TCP Padrão:** `8510`
- **Categoria Operacional:** Família & Casa
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-grocy.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `admin`
- **Instruções de Primeiro Acesso:** Login padrão inicial do Grocy.

---

## 🎯 1. Para Que Serve Este Aplicativo

Sistema profissional de gerenciamento de estoque doméstico, validade de alimentos e manutenção residencial.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Acaba com o desperdício de comida e de remédios que passam da validade sem ninguém notar.
- Porta padrão mapeada: 8510
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conectado a um leitor de código de barras USB ou câmera do celular, cadastra cada item que entra na despensa ou congelador. Avisa antes dos alimentos vencerem, rastreia consumo e sugere compras.

---

## 💡 4. Exemplo Real de Uso Prático

Ler o código de barras da caixa de leite ao chegar do mercado; o sistema registra a data de validade e abate automaticamente uma unidade quando você marca como consumido.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8510` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
