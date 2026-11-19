# Suíte PDF (Stirling PDF)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Suíte PDF (Stirling PDF)** (`nomad_stirling_pdf`).

- **Identificador do Serviço:** `nomad_stirling_pdf`
- **Porta TCP Padrão:** `8400`
- **Categoria Operacional:** Produtividade
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-stirling-pdf.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Suíte completa e privativa de edição, conversão, assinatura e união de PDFs diretamente no navegador.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Unir dezenas de PDFs, dividir, girar e reorganizar páginas
- Compressão avançada para reduzir o tamanho de arquivos pesados
- Remoção de senhas, adição de marca d'água e assinatura digital
- Conversão entre PDF, Word, imagens e OCR de textos escaneados

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Roda um motor em Java e Python local que processa os documentos na memória do contêiner e devolve o arquivo tratado para download imediato, sem reter cópias residuais.

---

## 💡 4. Exemplo Real de Uso Prático

Você tem 10 páginas de certidões e comprovantes escaneados; entra no Stirling PDF, junta tudo em um único PDF de 2MB organizado e pronto para enviar por e-mail.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8400` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
