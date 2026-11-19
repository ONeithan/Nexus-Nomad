# Biblioteca Offline (Kiwix)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Biblioteca Offline (Kiwix)** (`nomad_kiwix_server`).

- **Identificador do Serviço:** `nomad_kiwix_server`
- **Porta TCP Padrão:** `8090`
- **Categoria Operacional:** Educação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-kiwix-server.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Acesso soberano e offline à Wikipédia completa em português, manuais de sobrevivência, guias médicos e enciclopédias sem internet.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Leitura de arquivos compactados .zim em altíssima velocidade
- Busca textual instantânea com suporte a imagens e fórmulas
- Servidor web local acessível por qualquer celular ou PC na rede Wi-Fi
- Suporte a múltiplos acervos e armazenamento em HD externo ou TrueNAS

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executa um servidor C++ embarcado de baixo consumo que lê acervos comprimidos (.zim) sem precisar descompactar os gigabytes no disco, servindo páginas HTML em milissegundos para múltiplos usuários simultâneos.

---

## 💡 4. Exemplo Real de Uso Prático

Em um apagão geral de internet na sua cidade, você e sua família continuam acessando a Wikipédia completa com mais de 1 milhão de artigos, manuais de primeiros socorros e guias de agricultura direto pelo Wi-Fi de casa.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8090` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
