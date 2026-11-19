# OpenWebRX (Rádio SDR & Satélite NOAA)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **OpenWebRX (Rádio SDR & Satélite NOAA)** (`nomad_openwebrx`).

- **Identificador do Serviço:** `nomad_openwebrx`
- **Porta TCP Padrão:** `8605`
- **Categoria Operacional:** Oficina & Hardware
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-openwebrx.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor SDR (Software Defined Radio) com interface web interativa de espectro em cascata (waterfall).

---

## ⚙️ 2. Principais Recursos & Capacidades

- Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completam...
- Porta padrão mapeada: 8605
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se a um dongle USB RTL-SDR e permite sintonizar frequências de rádio AM/FM, escuta aérea, rádio amador, alertas de defesa civil e decodificar imagens ao vivo de satélites meteorológicos NOAA.

---

## 💡 4. Exemplo Real de Uso Prático

Monitoramento de frequências de emergência e eventos meteorológicos severos mesmo se a internet da região cair completamente.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8605` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
