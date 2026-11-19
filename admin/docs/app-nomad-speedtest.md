# Speedtest Tracker (Histórico de Velocidade)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Speedtest Tracker (Histórico de Velocidade)** (`nomad_speedtest`).

- **Identificador do Serviço:** `nomad_speedtest`
- **Porta TCP Padrão:** `8543`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-speedtest.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Painel autônomo que executa testes periódicos de velocidade de internet diretamente nos servidores oficiais da Ookla / Speedtest.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Garante que você está recebendo os megabits contratados pelo plano de fibra ótica.
- Porta padrão mapeada: 8543
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Roda testes a cada hora de forma programada, registrando velocidade de download, upload e ping em um banco de dados com gráficos históricos e estatísticas de cumprimento de contrato.

---

## 💡 4. Exemplo Real de Uso Prático

Descobrir que toda noite às 20h a operadora pratica "traffic shaping" e reduz sua velocidade de 600 Mbps para 120 Mbps.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8543` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
