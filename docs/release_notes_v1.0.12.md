# Notas de Lançamento — v1.0.12 (Nexus NOMAD)

## Resumo das Novidades e Melhorias

### 1. Motor de Temas em Tempo Real (Zero Reload)
- Implementado motor dinâmico de temas (`useTheme` + `ThemeProvider` + `data-theme`) que aplica as paletas visuais **instantaneamente** em todo o sistema (Home, Central de Aplicativos, Assistente de IA, Mapas, Guia de Medicamentos, Configuração Rápida, Manuais e Configurações) sem necessidade de recarregar a página.
- Persistência híbrida automática no navegador (`localStorage`) e no banco de dados do servidor (`KVStore` na chave `ui.theme`).

### 2. Nova Página e Módulo "Temas & Interface" (`/settings/themes`)
- Adicionada nova seção dedicada **Temas & Interface** no menu de Configurações (`/settings/themes`), no Centro de Comando (`/home`) e no seletor rápido da barra superior (`ThemeToggle`).
- **5 Temas Completos Incluídos:**
  1. **Militar Tático (`MIL-STD-810H` — Olive Drab, Coyote Tan & Ranger Green):** Chassi blindado fosco (`#141715` / `#1e2520`), destaques em Coyote Tan (`#c2a677`) e Ranger Green (`#7d9680`), cantos chanfrados em 45° (`.chamfer-box`), rebites industriais (`.rivet`) e zero verde neon.
  2. **Padrão NOMAD (Modo Claro):** O visual clássico original do Project NOMAD com areia do deserto (`#f7eedc`), verde oliva (`#424420`), terracota (`#a84a12`) e superfície clara.
  3. **Padrão NOMAD Noturno (Night Ops):** Modo escuro clássico do NOMAD em carvão quente (`#1c1b16`), oliva escuro (`#2a2918`) e tipografia creme (`#f7eedc`).
  4. **Sobrevivência em Campo (Rugged Âmbar & Terra):** Interface de baixa emissão luminosa noturna em carbono fosco (`#141210`), camurça (`#211d18`) e âmbar tático (`#d97706`).
  5. **Operações Navais / Stealth (Titânio & Aço Ártico):** Chassi em ardósia profunda (`#0f1419`), painéis em titânio (`#18212b`) e azul aço (`#5b82a6`).

### 3. Centro de Comando Tático (`MIL-STD-810H`) Integrado aos Módulos Reais do Site
- A tela inicial (`/home`) agora apresenta o HUD Tático Militar com cantos chanfrados em 45°, painel de situação operacional, log de eventos e divisões numeradas respeitando **100% dos serviços reais instalados e módulos nativos do servidor NOMAD** (Kiwix com busca integrada, Assistente de IA Ollama/RAG, Mapas Offline, Guia de Medicamentos, Configuração Rápida, Central de Aplicativos, Manuais & Documentação, Discos & Configurações, Temas & Interface e Atalhos de Rede LAN).
- Permite alternar também a estrutura da tela inicial entre **Automático conforme o Tema**, **Sempre HUD Tático (`MIL-STD-810H`)** ou **Sempre Grade Clássica NOMAD**.

### 4. Sequência de Boot Tático, Recovery Console e Login de Operadores (`TacticalBootGate`)
- Integrado sistema completo de inicialização de OS militar: **Cold-Boot Hardware Check** → **CRT Power-On** → **Splash NEXUS OS v1.0.12** → **Terminal de Recuperação (`help` → `login` → Registro de Operador Mestre no Chip TPM → `iniciar sistema`)** → **Reboot Limpo** → **Tela de Login Oficial (`DESTRAVAR CONSOLE`)**.
- Banco de dados de operadores persistente (`nomad_auth_db` + `KVStore` na chave `auth.operators`) com suporte a múltiplos níveis de autorização (`Nível 01` a `Nível 05 Supremo`) e bloqueio rápido (`Bloquear` na barra superior ou `SAIR` no HUD).

### 5. Atualização de Versão e Publicação
- Bumping para `v1.0.12` (`1.0.12-nexus`) com compilação e publicação automática no GitHub Container Registry (`ghcr.io/oneithan/nexus-nomad:v1.0.12` e `:latest`).

