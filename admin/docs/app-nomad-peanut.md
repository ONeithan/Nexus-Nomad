# PeaNUT (Guardião do Nobreak & Energia)

> **Manual Individual de Operação N.O.M.A.D.** — Documento exclusivo do módulo **PeaNUT (Guardião do Nobreak & Energia)** (`nomad_peanut`).

- **Identificador do Serviço:** `nomad_peanut`
- **Porta TCP Padrão:** `8544`
- **Categoria Operacional:** Redes & DNS
- **Modalidade:** Módulo Nativo N.O.M.A.D.
- **Arquivo de Documentação:** `app-nomad-peanut.md`

---

## 🔑 Credenciais Padrão & Acesso Inicial

- **Modalidade de Autenticação:** Acesso Direto pela Rede Local (Sem Login Inicial)
- **Usuário / Login Padrão:** `Acesso Direto (Sem login)`
- **Senha Padrão:** `Sem senha inicial`
- **Instruções de Primeiro Acesso:** Esta aplicação abre diretamente no navegador sem exigir login ou senha na primeira utilização.

---

## 🎯 1. Para Que Serve Este Aplicativo

Painel visual para o Network UPS Tools (NUT), monitorando o nobreak que alimenta seus servidores e roteadores.

---

## ⚙️ 2. Principais Recursos & Capacidades

- Evita corrupção de dados nos HDs e no sistema de arquivos ZFS durante apagões de energia elétrica.
- Porta padrão mapeada: 8544
- Categoria operacional: networking
- Integração com ecossistema N.O.M.A.D.

---

## 🧠 3. Como Funciona (Arquitetura & Fluxo de Dados)

Conecta-se ao nobreak via cabo USB ou placa de rede e lê em tempo real a voltagem da tomada, carga da bateria, consumo em Watts e tempo de autonomia restante. Em caso de falta de luz prolongada, comanda o desligamento seguro do TrueNAS e dos contêineres antes que a bateria se esgote.

---

## 💡 4. Exemplo Real de Uso Prático

A luz da rua acaba; o PeaNUT notifica no seu celular: "Falta de energia detectada. Homelab operando na bateria com 42 minutos de autonomia estimada".

---

## 🚀 5. Guia Rápido de Operação & Persistência

- **Endereço de Acesso Direto:** `http://<IP-DO-SERVIDOR>:8544` (ou clique em **Abrir** no card do aplicativo dentro da **Central de Aplicativos**).
- **Execução Local ou Remota (Portainer):** Este serviço pode ser implantado tanto no motor Docker local quanto no **Servidor Portainer Remoto** ativo na tela **Servidores Remotos**.
- **Controle e Manutenção:** Use o menu **Gerenciar** na Central de Aplicativos para iniciar, parar, reiniciar, visualizar logs em tempo real, configurar URL personalizada ou atualizar o contêiner.

---

[← Voltar ao Catálogo de Manuais Individuais (/docs/supply-depot-apps)](/docs/supply-depot-apps)
