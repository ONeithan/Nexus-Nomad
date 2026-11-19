# WeeWX (Estação Meteorológica & Histórico Climático)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **WeeWX (Estação Meteorológica & Histórico Climático)** (`nomad_weewx`).

- **Identificador do Serviço:** `nomad_weewx`
- **Porta TCP Padrão:** `8651`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-weewx.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Software especializado em coletar e arquivar dados climáticos de estações meteorológicas domésticas.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8651
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se a sensores climáticos (temperatura, umidade, pressão atmosférica, velocidade do vento e índice UV), gerando relatórios gráficos históricos no navegador.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8651` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
