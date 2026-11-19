# Audiobookshelf (Audiolivros & Podcasts)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Audiobookshelf (Audiolivros & Podcasts)** (`nomad_audiobookshelf`).

- **Identificador do Serviço:** `nomad_audiobookshelf`
- **Porta TCP Padrão:** `8561`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-audiobookshelf.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Central de streaming e catálogo de audiolivros e podcasts auto-hospedada.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Dá a comodidade do Audible sem mensalidades, reunindo sua biblioteca inteira de audiolivros em um só lugar.
- Porta padrão mapeada: 8561
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Organiza audiolivros em capítulos, sincroniza a posição exata da reprodução entre o computador e o aplicativo de celular, permite controle de velocidade (1.2x, 1.5x), notas de áudio e download offline no aparelho para escutar no trânsito ou avião.

---

## 💡 4. Exemplo Real de Uso Prático

Você está ouvindo um audiolivro no computador da bancada; entra no carro, abre o app no celular e ele continua no mesmo segundo de onde você parou.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8561` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
