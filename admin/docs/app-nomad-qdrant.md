# Banco Vetorial Qdrant

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Banco Vetorial Qdrant** (`nomad_qdrant`).

- **Identificador do Serviço:** `nomad_qdrant`
- **Porta TCP Padrão:** `6333`
- **Categoria Operacional:** IA & Agentes
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-qdrant.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Armazenamento e busca por proximidade vetorial para inteligência artificial, agentes e memória semântica.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Motor em Rust de altíssima performance para embeddings vetoriais
- Base de recuperação de documentos (RAG) para o Ollama e Dify
- Filtragem híbrida de texto e vetores com persistência local em disco
- Zero envio de dados para provedores de nuvem

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Converte parágrafos e documentos em coordenadas multidimensionais. Quando você faz uma pergunta, o Qdrant encontra os trechos mais pertinentes em milissegundos para a IA local responder com base nos seus dados.

---

## 💡 4. Exemplo Real de Uso Prático

Ao perguntar à IA local "Qual o torque dos parafusos do cabeçote do meu motor?", o Qdrant varre 5.000 páginas de manuais e entrega o dado exato para a IA responder na hora.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:6333` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
