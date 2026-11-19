# WG-Easy (Painel Rápido de VPN WireGuard)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **WG-Easy (Painel Rápido de VPN WireGuard)** (`nomad_wgeasy`).

- **Identificador do Serviço:** `nomad_wgeasy`
- **Porta TCP Padrão:** `8536`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-wgeasy.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

A interface web mais simples e direta do mundo para criar e gerenciar conexões VPN WireGuard com leitura de QR Code.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Perfeito para setup rápido de conexões de emergência para familiares sem complicação técnica.
- Porta padrão mapeada: 8536
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Roda o núcleo do WireGuard com tráfego acelerado no kernel e entrega um painel limpo onde você clica em "Novo Cliente", escaneia o QR Code na câmera do celular e a VPN está pronta para navegar.

---

## 💡 4. Exemplo Real de Uso Prático

Criar um acesso seguro em 30 segundos no tablet do seu filho para ele acessar os desenhos no Jellyfin durante uma viagem.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8536` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
