# Scrutiny (Prevenção de Queima de HDs e SSDs)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Scrutiny (Prevenção de Queima de HDs e SSDs)** (`nomad_scrutiny`).

- **Identificador do Serviço:** `nomad_scrutiny`
- **Porta TCP Padrão:** `8533`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-scrutiny.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Painel visual inteligente para monitoramento preditivo da saúde física de discos mecânicos e SSDs NVMe via telemetria S.M.A.R.T.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Vital para quem armazena terabytes de arquivos familiares, projetos e backups valiosos. Previne a perda irreparável de d...
- Porta padrão mapeada: 8533
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Coleta os atributos dos discos do host e do TrueNAS em intervalos regulares, compara com os bancos de dados de queima da indústria (como os relatórios de falhas da Backblaze) e avisa se um setor remapeado ou erro de CRC indicar que o disco vai queimar nas próximas semanas.

---

## 💡 4. Exemplo Real de Uso Prático

Um dos seus HDs de 4TB começa a apresentar setores com falha de leitura; o Scrutiny emite um alerta vermelho: "Atenção: HD /dev/sdb com 98% de chance de quebra iminente. Faça a troca do disco!".

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8533` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
