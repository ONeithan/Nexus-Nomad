# Kasm / Webtop (Navegador Descartável Seguro)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Kasm / Webtop (Navegador Descartável Seguro)** (`nomad_kasm_webtop`).

- **Identificador do Serviço:** `nomad_kasm_webtop`
- **Porta TCP Padrão:** `8539`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-kasm-webtop.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `abc`
- **Senha Padrão:** `abc`
- **Instruções de Primeiro Acesso:** O ambiente gráfico Webtop geralmente abre direto no navegador; se pedir senha, utilize abc / abc.

---

## 🎯 1. Para Que Serve Este Aplicativo

Um ambiente desktop completo ou navegador isolado executado dentro de um contêiner descartável acessível via web.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Proteção absoluta contra phishing, cavalos de troia e malwares ao baixar arquivos desconhecidos de sites suspeitos.
- Porta padrão mapeada: 8539
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Renderiza uma janela de navegador ou desktop Linux diretamente em uma aba do Chrome. Qualquer arquivo baixado, vírus ou link estranho acessado fica confinado dentro do contêiner e é completamente destruído ao fechar a sessão.

---

## 💡 4. Exemplo Real de Uso Prático

Você recebe um link estranho por e-mail dizendo ser um boleto ou nota fiscal; em vez de abrir no seu PC pessoal, você abre no Webtop: se houver vírus, seu computador real não sofre risco algum.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8539` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
