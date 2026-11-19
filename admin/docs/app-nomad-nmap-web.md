# Nmap Web (Auditor de Portas & Brechas)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Nmap Web (Auditor de Portas & Brechas)** (`nomad_nmap_web`).

- **Identificador do Serviço:** `nomad_nmap_web`
- **Porta TCP Padrão:** `8537`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-nmap-web.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Interface gráfica web para execução do lendário auditor de segurança de rede Nmap.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Permite que você audite sua própria casa antes que um invasor encontre uma brecha de segurança nos seus equipamentos de ...
- Porta padrão mapeada: 8537
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Realiza varreduras detalhadas nos roteadores, câmeras IP, impressoras e computadores da sua casa, identificando portas abertas por engano, protocolos inseguros (Telnet/HTTP sem senha) e serviços vulneráveis.

---

## 💡 4. Exemplo Real de Uso Prático

Auditar uma lâmpada ou tomada inteligente comprada na internet para ter certeza de que ela não está tentando abrir portas UPnP ou se comunicar com servidores desconhecidos.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8537` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
