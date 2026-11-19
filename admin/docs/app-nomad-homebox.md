# Inventário Doméstico (Homebox)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Inventário Doméstico (Homebox)** (`nomad_homebox`).

- **Identificador do Serviço:** `nomad_homebox`
- **Porta TCP Padrão:** `8470`
- **Categoria Operacional:** Família & Casa
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-homebox.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

O sistema definitivo de inventário doméstico para bens, ferramentas, eletrodomésticos e garantias.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Cadastro de itens com números de série, notas fiscais e fotos
- Localização por cômodos, armários e caixas organizadoras
- Geração e leitura de etiquetas com QR Code
- Cálculo de valor total do patrimônio para seguros

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Banco de dados leve em SQLite com interface web ágil. Permite escanear a etiqueta de uma caixa com a câmera do celular e ver tudo o que está dentro dela sem abrir.

---

## 💡 4. Exemplo Real de Uso Prático

Você precisa encontrar a fonte de 12V de um aparelho guardado há 2 anos; pesquisa "fonte 12V" no Homebox e ele mostra: Armário da Oficina > Caixa Plástica Azul 04.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8470` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
