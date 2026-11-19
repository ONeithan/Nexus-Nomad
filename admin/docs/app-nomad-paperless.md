# Gestão de Documentos (Paperless-ngx)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Gestão de Documentos (Paperless-ngx)** (`nomad_paperless`).

- **Identificador do Serviço:** `nomad_paperless`
- **Porta TCP Padrão:** `8000`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-paperless.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar no 1º acesso (ou Credencial Global)`
- **Senha Padrão:** `Criar no 1º acesso (ou Credencial Global)`
- **Instruções de Primeiro Acesso:** Se "Aplicar Credenciais Globais" estiver ativo em Servidores Remotos, o usuário/senha configurado lá será usado automaticamente.

---

## 🎯 1. Para Que Serve Este Aplicativo

O indexador de documentos físicos definitivo: transforma papéis escaneados em arquivos digitais pesquisáveis.

---

## ⚙️ 2. Principais Recursos & Capacidades

- OCR automático em Português do Brasil para reconhecer textos em fotos
- Classificação automática por IA de correspondentes, datas e etiquetas
- Busca de texto completo dentro de PDFs e fotos de recibos
- Pasta de entrada automática (basta escanear que ele processa)

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Lê o texto impresso com Tesseract OCR, indexa as palavras no banco e arquiva o PDF original de forma imutável.

---

## 💡 4. Exemplo Real de Uso Prático

Você precisa achar a garantia da geladeira comprada há 3 anos; digita "geladeira" no Paperless e ele encontra a nota fiscal na hora com o valor e a data destacada.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8000` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
