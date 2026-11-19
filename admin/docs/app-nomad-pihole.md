# Pi-hole (Sumidouro de Telemetria DNS)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Pi-hole (Sumidouro de Telemetria DNS)** (`nomad_pihole`).

- **Identificador do Serviço:** `nomad_pihole`
- **Porta TCP Padrão:** `8545`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-pihole.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `(apenas senha)`
- **Senha Padrão:** `Definida nas Credenciais Globais / Console`
- **Instruções de Primeiro Acesso:** Ative as Credenciais Globais em Servidores Remotos antes de instalar para definir a senha web automaticamente.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidores DNS de bloqueio na camada de rede para toda a residência.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositiv...
- Porta padrão mapeada: 8545
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Interceptam e descartam requisições para servidores de telemetria, rastreadores invasivos de Smart TVs e banners de propagandas antes mesmo que eles cheguem aos celulares ou computadores da casa.

---

## 💡 4. Exemplo Real de Uso Prático

Limpa anúncios em aplicativos e sites para todos os aparelhos da casa sem precisar instalar extensões em cada dispositivo.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8545` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
