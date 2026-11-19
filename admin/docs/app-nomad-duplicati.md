# Duplicati (Backup Criptografado & Desduplicado)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Duplicati (Backup Criptografado & Desduplicado)** (`nomad_duplicati`).

- **Identificador do Serviço:** `nomad_duplicati`
- **Porta TCP Padrão:** `8646`
- **Categoria Operacional:** Utilitários
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-duplicati.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `(apenas senha)`
- **Senha Padrão:** `Sem senha inicial (ou Credencial Global)`
- **Instruções de Primeiro Acesso:** Por padrão entra direto pela rede local ou usa a senha das Credenciais Globais.

---

## 🎯 1. Para Que Serve Este Aplicativo

Ferramentas de backup com criptografia AES-256 e sincronização de dados desduplicados entre discos locais e nuvens frias.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Porta padrão mapeada: 8646
- Categoria operacional: utility
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Executado em contêiner Docker isolado na porta 8646, persistindo dados em volumes dedicados.

---

## 💡 4. Exemplo Real de Uso Prático

Utilizado para operações de utility com controle e soberania local no seu homelab.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8646` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
