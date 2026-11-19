# TubeArchivist (Seu YouTube Offline Privado)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **TubeArchivist (Seu YouTube Offline Privado)** (`nomad_tubearchivist`).

- **Identificador do Serviço:** `nomad_tubearchivist`
- **Porta TCP Padrão:** `8562`
- **Categoria Operacional:** Mídia & Som
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-tubearchivist.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `admin (ou Credencial Global)`
- **Senha Padrão:** `Definida nas Credenciais Globais`
- **Instruções de Primeiro Acesso:** Suporta injeção automática pelas Credenciais Globais em Configurações > Servidores Remotos.

---

## 🎯 1. Para Que Serve Este Aplicativo

Indexador e arquivador definitivo de canais e playlists do YouTube.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Preserva vídeos valiosos mesmo se o canal do autor for excluído pelo YouTube ou monetizado em plataformas pagas.
- Porta padrão mapeada: 8562
- Categoria operacional: media
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Monitora seus canais técnicos, tutoriais de eletrônica e canais infantis favoritos. Quando sai um vídeo novo, baixa em alta definição com legendas, descrição e comentários, permitindo assistir pelo navegador ou app de Smart TV sem anúncios.

---

## 💡 4. Exemplo Real de Uso Prático

Salvar playlists inteiras de cursos e tutoriais de bancada para assistir direto no homelab mesmo se o link original sumir da internet.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8562` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
