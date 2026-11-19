# Terminal LoRa MeshCore

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Terminal LoRa MeshCore** (`nomad_meshcore_web`).

- **Identificador do Serviço:** `nomad_meshcore_web`
- **Porta TCP Padrão:** `8500`
- **Categoria Operacional:** Comunicação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-meshcore-web.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Terminal tático para configuração avançada de nós de rádio, telemetria de sinal e pacotes de rede mesh.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Monitoramento de SNR e RSSI de pacotes de rádio em tempo real
- Configuração de taxas de espalhamento (Spreading Factor) e potência TX
- Roteamento de telemetria meteorológica e pacotes de sensores
- Depuração de tráfego de rádio em tempo real

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Interface técnica de baixo nível que conversa diretamente com o firmware dos transceptores Semtech SX1262 para diagnóstico fino de alcance de rádio.

---

## 💡 4. Exemplo Real de Uso Prático

Ajustar a antena da casa para atingir o repetidor de rádio LoRa mais distante da cidade com a melhor relação sinal-ruído possível.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8500` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
