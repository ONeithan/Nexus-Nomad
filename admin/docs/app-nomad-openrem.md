# OpenREM / DICOM (Arquivo de Exames Médicos)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **OpenREM / DICOM (Arquivo de Exames Médicos)** (`nomad_openrem`).

- **Identificador do Serviço:** `nomad_openrem`
- **Porta TCP Padrão:** `8514`
- **Categoria Operacional:** Família & Casa
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-openrem.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Credencial Padrão de Fábrica (Usuário & Senha)
- **Usuário / Login Padrão:** `openremadmin`
- **Senha Padrão:** `changeme`
- **Instruções de Primeiro Acesso:** Credenciais iniciais padrão do OpenREM.

---

## 🎯 1. Para Que Serve Este Aplicativo

Servidor PACS e visualizador de exames médicos de imagem (Raios-X, Tomografias, Ressonâncias Magnéticas e Ultrassons).

---

## ⚙️ 2. Principais Recursos & Capacidades

- Garante que o histórico radiológico de toda a sua vida fique guardado no TrueNAS sem perda de resolução ou compressão de...
- Porta padrão mapeada: 8514
- Categoria operacional: home-family
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Recebe os arquivos digitais em formato nativo DICOM que vêm nos CDs/pen-drives de laboratórios e clínicas, permitindo visualização de cortes em alta fidelidade pelo navegador.

---

## 💡 4. Exemplo Real de Uso Prático

Você precisa comparar uma ressonância de joelho ou coluna feita há 5 anos com uma atual; o Orthanc abre as duas lado a lado no navegador para o médico avaliar.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8514` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
