# Wake-on-LAN Hub (Ligar PCs Remotamente)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Wake-on-LAN Hub (Ligar PCs Remotamente)** (`nomad_wol_web`).

- **Identificador do Serviço:** `nomad_wol_web`
- **Porta TCP Padrão:** `8080`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-wol-web.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Painel web tático para disparar pacotes mágicos Wake-on-LAN e ligar servidores e computadores da casa à distância com um clique.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Lista de computadores cadastrados com endereço MAC e IP
- Disparo de pacotes mágicos UDP broadcast pela rede local
- Ping integrado para mostrar se a máquina está ligada ou desligada
- Interface web adaptada para celulares

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Envia pacotes de rede broadcast contendo a assinatura hexadecimal do endereço MAC da placa de rede, acordando o computador desligado.

---

## 💡 4. Exemplo Real de Uso Prático

Você está na rua e precisa acessar os arquivos do seu PC de jogos potente; entra no N.O.M.A.D. pelo celular, clica em Ligar PC e conecta via RustDesk em 30 segundos.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8080` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
