# Rádio Mesh LoRa (Meshtastic)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Rádio Mesh LoRa (Meshtastic)** (`nomad_meshtastic_web`).

- **Identificador do Serviço:** `nomad_meshtastic_web`
- **Porta TCP Padrão:** `8450`
- **Categoria Operacional:** Comunicação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-meshtastic-web.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Interface web de monitoramento e envio de mensagens para rádios LoRa de comunicação off-grid resiliente.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Comunicação de texto criptografada por rádio em frequências ISM (915 MHz)
- Rede mesh cooperativa: cada rádio retransmite pacotes dos outros nós
- Compartilhamento de coordenadas GPS sem sinal de operadora
- Conexão com placa LoRa via USB ou Wi-Fi

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se ao microcontrolador ESP32/nRF52 do rádio LoRa via porta serial ou WebSocket, exibindo o mapa de nós vizinhos e canais de mensagens no navegador.

---

## 💡 4. Exemplo Real de Uso Prático

Trocar mensagens entre sua casa e o carro ou em trilhas remotas em um raio de até 15 km sem precisar de operadora de celular ou provedor de internet.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8450` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
