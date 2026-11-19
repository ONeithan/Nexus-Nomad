# Technitium DNS Server (DNS Avançado com DoH)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Technitium DNS Server (DNS Avançado com DoH)** (`nomad_technitium_dns`).

- **Identificador do Serviço:** `nomad_technitium_dns`
- **Porta TCP Padrão:** `8540`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-technitium-dns.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `admin`
- **Instruções de Primeiro Acesso:** Credenciais iniciais do Technitium DNS. O painel solicitará troca de senha no primeiro acesso.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor de DNS local de padrão militar com suporte completo a DNS-over-HTTPS (DoH), DNS-over-TLS (DoT) e bloqueio avançado de requisições.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Dá privacidade total de navegação para todos os dispositivos e acelera o carregamento de sites através de cache local na...
- Porta padrão mapeada: 8540
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Resolve todas as consultas de nomes da casa diretamente nos servidores raiz da internet, sem passar pelos servidores lentos e monitorados da sua operadora (Claro, Vivo, etc.).

---

## 💡 4. Exemplo Real de Uso Prático

Impedir que a operadora de internet registre quais sites você e sua família estão acessando no dia a dia.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8540` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
