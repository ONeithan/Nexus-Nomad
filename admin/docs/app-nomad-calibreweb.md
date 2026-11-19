# Biblioteca de Livros (Calibre Web)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Biblioteca de Livros (Calibre Web)** (`nomad_calibreweb`).

- **Identificador do Serviço:** `nomad_calibreweb`
- **Porta TCP Padrão:** `8420`
- **Categoria Operacional:** Educação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-calibreweb.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `admin123`
- **Instruções de Primeiro Acesso:** Na primeira abertura, aponte a biblioteca (Calibre Database) para a pasta /books.

---

## 🎯 1. Para Que Serve Este Aplicativo

Leitor e organizador da sua biblioteca digital pessoal de e-books em EPUB, PDF e MOBI.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Leitor embutido direto no navegador do celular, tablet ou PC
- Envio de livros com um clique para aparelhos Kindle por e-mail
- Organização por autores, séries, etiquetas e capas em alta resolução
- Conexão com a pasta central de livros do servidor

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Lê o banco de dados da sua biblioteca Calibre e serve um catálogo web no protocolo OPDS, permitindo que aplicativos de leitura como Moon+ Reader ou Koreader acessem seu acervo.

---

## 💡 4. Exemplo Real de Uso Prático

Você está deitado na cama com o tablet; abre o Calibre Web pelo navegador e continua lendo seu livro de eletrônica de onde parou.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8420` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
