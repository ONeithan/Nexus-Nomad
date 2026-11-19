# NetAlertX (Vigia de Intrusos no Wi-Fi)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **NetAlertX (Vigia de Intrusos no Wi-Fi)** (`nomad_netalertx`).

- **Identificador do Serviço:** `nomad_netalertx`
- **Porta TCP Padrão:** `8532`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-netalertx.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Sistema autônomo de varredura e auditoria que monitora todos os equipamentos conectados na rede local em tempo real.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Impede que vizinhos ou aparelhos comprometidos usem seu sinal de rede sem o seu consentimento.
- Porta padrão mapeada: 8532
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executa varreduras ARP e ICMP periódicas no switch e ponto de acesso Wi-Fi. Quando um endereço MAC novo ou desconhecido aparece na rede, ele dispara um alerta imediato no Telegram ou Mattermost com o fabricante e o IP do dispositivo.

---

## 💡 4. Exemplo Real de Uso Prático

Um convidado chega na sua casa e se conecta ao Wi-Fi; seu celular vibra avisando: "Novo dispositivo detectado: Samsung Galaxy S24 (IP 192.168.1.145)".

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8532` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
