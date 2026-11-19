# DefGuard (VPN WireGuard com 2FA & Auditoria)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **DefGuard (VPN WireGuard com 2FA & Auditoria)** (`nomad_defguard`).

- **Identificador do Serviço:** `nomad_defguard`
- **Porta TCP Padrão:** `8534`
- **Categoria Operacional:** Segurança & VPN
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-defguard.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Cadastro no Primeiro Acesso / Credencial Global
- **Usuário / Login Padrão:** `Criar conta no 1º acesso`
- **Senha Padrão:** `Definir senha no 1º acesso`
- **Instruções de Primeiro Acesso:** No primeiro acesso via navegador, o aplicativo exibe um assistente rápido para você cadastrar seu login e senha de administrador.

---

## 🎯 1. Para Que Serve Este Aplicativo

Solução de nível corporativo para gerenciamento centralizado de redes privadas virtuais WireGuard com suporte a múltiplos fatores de autenticação.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Muito mais seguro que uma VPN simples, pois permite revogar na hora o acesso de um dispositivo perdido ou furtado.
- Porta padrão mapeada: 8534
- Categoria operacional: security
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Permite gerar arquivos de configuração e QR codes de acesso remoto para celulares e notebooks com controle de quais IPs cada usuário pode acessar dentro da casa.

---

## 💡 4. Exemplo Real de Uso Prático

Configurar o celular da sua esposa com VPN automática; sempre que ela sai do Wi-Fi de casa, o aparelho se reconecta via WireGuard para acessar as fotos do Immich com segurança total.

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8534` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
