# SmokePing (Auditor de Latência & Micro-Quedas)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **SmokePing (Auditor de Latência & Micro-Quedas)** (`nomad_smokeping`).

- **Identificador do Serviço:** `nomad_smokeping`
- **Porta TCP Padrão:** `8542`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-smokeping.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

O mais renomado sistema de medição e diagnóstico de qualidade de sinal de rede e rotas de internet.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Prova de forma irrefutável para a sua operadora de internet quando a conexão está com instabilidade ou micro-quedas invi...
- Porta padrão mapeada: 8542
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Dispara rajadas periódicas de pacotes ICMP para múltiplos destinos estratégicos (servidores de DNS do Google, Cloudflare, gateway da sua operadora, servidores de jogos) e plota gráficos de dispersão de jitter e perda de pacotes ao longo do tempo.

---

## 💡 4. Exemplo Real de Uso Prático

O jogo online ou a chamada de vídeo cai; você abre o SmokePing e vê o gráfico mostrando que exatamente às 15:20 a operadora teve 40% de perda de pacotes na rota externa.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8542` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
