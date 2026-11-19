# Blocky (Controle de Horários & Filtro DNS)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Blocky (Controle de Horários & Filtro DNS)** (`nomad_blocky`).

- **Identificador do Serviço:** `nomad_blocky`
- **Porta TCP Padrão:** `8541`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-blocky.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Resolvedor e filtro de DNS leve escrito em Go, desenhado especificamente para controle de acessos por dispositivo e por horários.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Controle parental soberano e saudável sem precisar instalar aplicativos espiões nos celulares dos filhos.
- Porta padrão mapeada: 8541
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Permite criar regras onde, por exemplo, os tablets e videogames das crianças têm o YouTube e redes sociais bloqueados após as 21h ou durante o horário de estudos, enquanto os PCs dos pais continuam com acesso livre.

---

## 💡 4. Exemplo Real de Uso Prático

Configurar o horário de sono da casa: às 22h, o Wi-Fi das crianças desativa o acesso a vídeos e jogos automaticamente.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8541` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
