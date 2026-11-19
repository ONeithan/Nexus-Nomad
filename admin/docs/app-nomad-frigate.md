# Frigate NVR (Câmeras de Segurança com IA)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **Frigate NVR (Câmeras de Segurança com IA)** (`nomad_frigate`).

- **Identificador do Serviço:** `nomad_frigate`
- **Porta TCP Padrão:** `8538`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-frigate.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Gravador de vídeo em rede (NVR) de alto desempenho focado em detecção de objetos em tempo real utilizando inteligência artificial local.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Segurança patrimonial profissional sem pagar assinaturas abusivas de nuvens de câmeras comerciais.
- Porta padrão mapeada: 8538
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se às suas câmeras IP via stream RTSP e processa as imagens na GPU ou no acelerador Coral. Em vez de alarmes falsos de chuva ou folhas ao vento, ele só grava e notifica se detectar uma pessoa, carro ou animal na área delimitada.

---

## 💡 4. Exemplo Real de Uso Prático

Uma pessoa se aproxima do portão da sua residência à noite; o Frigate detecta a silhueta humana em 50ms e envia a foto no seu Telegram com a notificação instantânea.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8538` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
