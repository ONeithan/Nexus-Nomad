# ChangeDetection.io (Monitor de Páginas Web)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **ChangeDetection.io (Monitor de Páginas Web)** (`nomad_changedetection`).

- **Identificador do Serviço:** `nomad_changedetection`
- **Porta TCP Padrão:** `8584`
- **Categoria Operacional:** Automação
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-changedetection.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Rastreador de alterações em websites, tabelas de preços e portais de notícias.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Avisa na hora quando uma peça rara de computador ou componente eletrônico voltar ao estoque ou cair de preço em lojas on...
- Porta padrão mapeada: 8584
- Categoria operacional: automation
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Acessa páginas web em intervalos programados, compara o conteúdo com a versão anterior (com capacidade de selecionar apenas uma tag ou elemento HTML específico) e notifica quando o texto ou preço mudar.

---

## 💡 4. Exemplo Real de Uso Prático

Monitorar a página de uma placa de vídeo ou filamento de impressora 3D; o sistema detecta que o preço caiu de R$ 3.200 para R$ 2.400 e manda um alerta com o link direto no seu celular.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8584` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
