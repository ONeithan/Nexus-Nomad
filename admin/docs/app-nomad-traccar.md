# Traccar (Rastreamento GPS & Frotas)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Traccar (Rastreamento GPS & Frotas)** (`nomad_traccar`).

- **Identificador do Serviço:** `nomad_traccar`
- **Porta TCP Padrão:** `8082`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-traccar.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `admin`
- **Senha Padrão:** `admin`
- **Instruções de Primeiro Acesso:** Credenciais iniciais do Traccar (em versões novas, pode solicitar cadastro na 1ª tela).

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor de rastreamento de veículos, motos e celulares com telemetria GPS, cercas virtuais e alertas em tempo real.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Compatível com mais de 1.500 modelos de rastreadores GPS do mercado
- Rastreamento de celulares Android e iOS via aplicativo leve
- Criação de cercas geográficas com alertas de entrada e saída
- Histórico de rotas, velocidade e paradas com reprodução visual

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Recebe coordenadas de rastreadores veiculares via TCP/UDP ou HTTP e plota em mapas locais com cálculo de odômetro e velocidade.

---

## 💡 4. Exemplo Real de Uso Prático

Você instala um rastreador de R$ 80 no carro; ele envia as coordenadas direto para o seu servidor N.O.M.A.D., sem mensalidades de empresas de rastreamento.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8082` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
