# Músicas & Audiolivros (Navidrome)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Músicas & Audiolivros (Navidrome)** (`nomad_navidrome`).

- **Identificador do Serviço:** `nomad_navidrome`
- **Porta TCP Padrão:** `4533`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-navidrome.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor de streaming de músicas de alta fidelidade para transformar sua coleção em um Spotify privado.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Consumo de memória ultra-baixo (< 50MB de RAM) escrito em Go
- Compatível com dezenas de apps para celular (Symfonium, Substreamer, DSub)
- Suporte a áudio sem perda (FLAC, ALAC), playlists e rádios
- Leitura rápida de coleções com mais de 100.000 músicas

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Indexa sua biblioteca musical no TrueNAS e expõe uma API compatível com o padrão Subsonic.

---

## 💡 4. Exemplo Real de Uso Prático

Ouvir seus álbuns favoritos e playlists completas no carro via Bluetooth pelo celular sem gastar seu plano de dados 4G/5G e com qualidade de áudio cristalina.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:4533` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
