# InvenTree (Almoxarifado & Peças de Oficina)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **InvenTree (Almoxarifado & Peças de Oficina)** (`nomad_inventree`).

- **Identificador do Serviço:** `nomad_inventree`
- **Porta TCP Padrão:** `8600`
- **Categoria Operacional:** Oficina & Hardware
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-inventree.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

O mais renomado sistema de controle de estoque de peças técnicas, projetos de hardware e montagens eletrônicas.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Acaba com o clássico problema de comprar parafusos, relés ou conectores duplicados porque você não sabia que já tinha na...
- Porta padrão mapeada: 8600
- Categoria operacional: workshop
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Cadastra fornecedores, códigos de peças de fabricantes (ex: Mouser, Farnell, Mercado Livre), localização exata no gaveteiro (Estante A, Gaveta 3, Divisória 2), listas de materiais (BOM - Bill of Materials) e etiquetas de código de barras.

---

## 💡 4. Exemplo Real de Uso Prático

Antes de iniciar um projeto de solda, você abre o projeto no InvenTree e clica em "Verificar Estoque"; ele avisa na hora se você tem todos os componentes necessários ou quais faltam pedir.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8600` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
