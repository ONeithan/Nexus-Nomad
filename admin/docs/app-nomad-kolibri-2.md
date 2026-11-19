# Plataforma Educacional (Kolibri)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Plataforma Educacional (Kolibri)** (`nomad_kolibri_2`).

- **Identificador do Serviço:** `nomad_kolibri_2`
- **Porta TCP Padrão:** `8310`
- **Categoria Operacional:** Educação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-kolibri-2.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar no assistente inicial`
- **Senha Padrão:** `Criar no assistente inicial`
- **Instruções de Primeiro Acesso:** Selecione Português (Brasil) na primeira tela e crie sua conta de Superusuário/Tutor.

---

## 🎯 1. Para Que Serve Este Aplicativo

Escola interativa offline completa com cursos em vídeo, Khan Academy em português, exercícios gamificados e trilhas de estudo sem necessidade de internet.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Canais educacionais completos em vídeo e HTML5 interativo (Khan Academy, PhET, StoryWeaver)
- Acompanhamento de progresso de alunos, turmas e famílias totalmente offline
- Servidor dedicado de conteúdo interativo na porta 8311 para exercícios HTML5/SCORM
- Suporte a importação de canais via rede local ou arquivos exportados

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executa a plataforma Learning Equality Kolibri 0.19+ com banco local em /kolibri, servindo a interface web na porta 8310 e exercícios interativos isolados na porta 8311 para evitar conflitos de origem.

---

## 💡 4. Exemplo Real de Uso Prático

Em uma propriedade rural ou durante falta prolongada de internet, crianças e adultos acompanham aulas de matemática, ciências, física e programação em Português diretamente de tablets e celulares conectados ao Wi-Fi local.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8310` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
