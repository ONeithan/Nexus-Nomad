#!/bin/bash

# Nexus Project NOMAD — Script Oficial de Instalação (PT-BR)

###################################################################################################################################################################################################
# Script                | Instalador Nexus Project NOMAD (PT-BR)
# Versão                | 1.0.4-nexus
# Repositório           | https://github.com/ONeithan/Nexus-Nomad
###################################################################################################################################################################################################

RESET='\033[0m'
YELLOW='\033[1;33m'
WHITE_R='\033[39m'
GRAY_R='\033[39m'
RED='\033[1;31m'
GREEN='\033[1;32m'

WHIPTAIL_TITLE="Instalação do Nexus Project NOMAD"
NOMAD_DIR="/opt/project-nomad"
STORAGE_TARGET_DIR="/opt/project-nomad/storage"
GITHUB_USER="${GITHUB_USER:-ONeithan}"
GITHUB_REPO="${GITHUB_REPO:-Nexus-Nomad}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
GITHUB_USER_LC=$(echo "${GITHUB_USER}" | tr '[:upper:]' '[:lower:]')
GITHUB_REPO_LC=$(echo "${GITHUB_REPO}" | tr '[:upper:]' '[:lower:]')
NOMAD_ADMIN_IMAGE="ghcr.io/${GITHUB_USER_LC}/${GITHUB_REPO_LC}:latest"
MANAGEMENT_COMPOSE_FILE_URL="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/install/management_compose.yaml"
START_SCRIPT_URL="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/install/start_nomad.sh"
STOP_SCRIPT_URL="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/install/stop_nomad.sh"
UPDATE_SCRIPT_URL="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}/install/update_nomad.sh"
script_option_debug='true'
accepted_terms='false'
local_ip_address=''

header() {
  if [[ "${script_option_debug}" != 'true' ]]; then clear; clear; fi
  echo -e "${GREEN}#########################################################################${RESET}\n"
}

header_red() {
  if [[ "${script_option_debug}" != 'true' ]]; then clear; clear; fi
  echo -e "${RED}#########################################################################${RESET}\n"
}

banner() {
  echo ""
  echo -e "${GREEN}"
  cat <<'NOMAD_ART'
               _   _ _______  ___   _ ____  
              | \ | | ____\ \/ / | | / ___| 
              |  \| |  _|  \  /| | | \___ \ 
              | |\  | |___ /  \| |_| |___) |
              |_| \_|_____/_/\_\\___/|____/ 
                     P R O J E C T
            _   _  ___  __  __    _    ____
           | \ | |/ _ \|  \/  |  / \  |  _ \
           |  \| | | | | |\/| | / _ \ | | | |
           | |\  | |_| | |  | |/ ___ \| |_| |
           |_| \_|\___/|_|  |_/_/   \_\____/
NOMAD_ART
  echo -e "${RESET}"
  echo -e "${WHITE_R}       Servidor Civilizatório de Conhecimento e Educação Offline (PT-BR)${RESET}\n"
  echo -e "${GREEN}#########################################################################${RESET}\n"
}

check_has_sudo() {
  if sudo -v; then
    echo -e "${GREEN}#${RESET} Permissão sudo confirmada.\n"
  else
    header_red
    echo -e "${RED}#${RESET} Este instalador exige permissões sudo. Execute com: sudo bash $(basename "$0")\n"
    exit 1
  fi
}

check_is_bash() {
  if [[ -z "$BASH_VERSION" ]]; then
    header_red
    echo -e "${RED}#${RESET} Execute este script utilizando o bash: sudo bash $(basename "$0")\n"
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Ambiente Bash verificado.\n"
}

check_is_debian_based() {
  if [[ ! -f /etc/debian_version ]]; then
    header_red
    echo -e "${RED}#${RESET} Este instalador é projetado para sistemas baseados em Debian (Debian / Ubuntu).\n"
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Sistema Debian detectado ($(cat /etc/debian_version)).\n"
}

check_is_x86_64() {
  local arch
  arch="$(uname -m)"
  if [[ "${arch}" != "x86_64" && "${arch}" != "amd64" ]]; then
    echo -e "${YELLOW}#${RESET} AVISO: Arquitetura detectada '${arch}'. O NOMAD suporta oficialmente x86_64.\n"
    echo -e "${YELLOW}#${RESET} Continuando em 10 segundos... pressione Ctrl+C para cancelar.\n"
    sleep 10
    return
  fi
  echo -e "${GREEN}#${RESET} Arquitetura x86_64 verificada (${arch}).\n"
}

ensure_dependencies_installed() {
  local missing_deps=()

  if ! command -v curl &> /dev/null; then
    missing_deps+=("curl")
  fi
  if ! command -v gpg &> /dev/null; then
    missing_deps+=("gpg")
  fi
  if ! command -v git &> /dev/null; then
    missing_deps+=("git")
  fi
  if ! command -v lspci &> /dev/null; then
    missing_deps+=("pciutils")
  fi

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    echo -e "${YELLOW}#${RESET} Instalando dependências necessárias: ${missing_deps[*]}...\n"
    sudo apt-get update
    sudo apt-get install -y "${missing_deps[@]}"

    for dep in curl gpg git; do
      if ! command -v "$dep" &> /dev/null; then
        echo -e "${RED}#${RESET} Falha ao instalar '$dep'. Instale manualmente e tente novamente."
        exit 1
      fi
    done
    echo -e "${GREEN}#${RESET} Dependências básicas instaladas com sucesso.\n"
  else
    echo -e "${GREEN}#${RESET} Todas as dependências básicas já estão instaladas.\n"
  fi
}

check_is_debug_mode() {
  if [[ "${script_option_debug}" == 'true' ]]; then
    echo -e "${YELLOW}#${RESET} Modo detalhado ativo (log visível na tela)...\n"
  else
    clear; clear
  fi
}

generateRandomPass() {
  local length="${1:-32}"
  local password
  password=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length")
  echo "$password"
}

ensure_docker_installed() {
  if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}#${RESET} Docker não encontrado. Instalando Docker Engine oficial...\n"
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh

    if ! command -v docker &> /dev/null; then
      echo -e "${RED}#${RESET} Falha na instalação do Docker. Verifique sua conexão e tente novamente."
      exit 1
    fi
    sudo systemctl enable --now docker
    echo -e "${GREEN}#${RESET} Docker instalado e ativado com sucesso.\n"
  else
    echo -e "${GREEN}#${RESET} Docker já está instalado.\n"
    if ! systemctl is-active --quiet docker; then
      echo -e "${YELLOW}#${RESET} Iniciando o serviço Docker...\n"
      sudo systemctl enable --now docker
      if ! systemctl is-active --quiet docker; then
        echo -e "${RED}#${RESET} Falha ao iniciar o serviço Docker."
        exit 1
      fi
    fi
    echo -e "${GREEN}#${RESET} Serviço Docker em execução.\n"
  fi
}

check_docker_compose() {
  if ! sudo docker compose version &>/dev/null; then
    echo -e "${RED}#${RESET} Plugin Docker Compose v2 ('docker compose') não encontrado."
    echo -e "${YELLOW}#${RESET} Tentando instalar docker-compose-plugin via apt..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
    if ! sudo docker compose version &>/dev/null; then
      echo -e "${RED}#${RESET} Não foi possível instalar o Docker Compose v2."
      exit 1
    fi
  fi
}

setup_nvidia_container_toolkit() {
  echo -e "${YELLOW}#${RESET} Verificando presença de GPU dedicada NVIDIA...\n"
  local has_nvidia_gpu=false
  if command -v lspci &> /dev/null; then
    if lspci 2>/dev/null | grep -i nvidia &> /dev/null; then
      has_nvidia_gpu=true
    fi
  fi
  if ! $has_nvidia_gpu && command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
      has_nvidia_gpu=true
    fi
  fi

  if ! $has_nvidia_gpu; then
    echo -e "${YELLOW}#${RESET} Nenhuma GPU NVIDIA dedicada detectada. Continuando em modo padrão...\n"
    return 0
  fi

  if command -v nvidia-ctk &> /dev/null; then
    echo -e "${GREEN}#${RESET} NVIDIA Container Toolkit já instalado.\n"
    return 0
  fi

  echo -e "${YELLOW}#${RESET} Instalando NVIDIA Container Toolkit...\n"
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey 2>/dev/null | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg 2>/dev/null || return 0
  curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list 2>/dev/null \
    | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
    | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null 2>&1 || return 0
  sudo apt-get update 2>/dev/null && sudo apt-get install -y nvidia-container-toolkit 2>/dev/null || return 0
  sudo nvidia-ctk runtime configure --runtime=docker 2>/dev/null || true
  sudo systemctl restart docker 2>/dev/null || true
}

get_install_confirmation() {
  echo -e "${YELLOW}#${RESET} Este assistente instalará o ${GREEN}Nexus Project NOMAD (PT-BR)${RESET} a partir de ${WHITE_R}${GITHUB_USER}/${GITHUB_REPO}${RESET}."
  echo -e "${YELLOW}#${RESET} Sistema e banco de dados ficarão em ${WHITE_R}/opt/project-nomad${RESET} (disco principal do sistema)."
  if mountpoint -q /mnt/nomad_storage 2>/dev/null; then
    echo -e "${GREEN}#${RESET} Disco secundário detectado em ${WHITE_R}/mnt/nomad_storage${RESET}! Todo o acervo pesado (ZIMs, PDFs, Mapas, Livros) será gravado nele automaticamente."
  fi
  read -p "Deseja continuar com a instalação? (s/N): " choice
  case "$choice" in
    s|S|y|Y )
      echo -e "${GREEN}#${RESET} Instalação confirmada pelo usuário.\n"
      ;;
    * )
      echo "Instalação cancelada."
      exit 0
      ;;
  esac
}

accept_terms() {
  printf "\n"
  echo "Termos de Licença (Apache License 2.0)"
  echo "______________________________________"
  echo "O Nexus Project NOMAD é baseado no Project NOMAD sob licença Apache 2.0."
  echo "Consulte os termos completos no arquivo LICENSE do repositório."
  printf "\n"
  read -p "Li e aceito os termos da licença Apache 2.0 (s/N): " choice
  case "$choice" in
    s|S|y|Y )
      accepted_terms='true'
      ;;
    * )
      echo "Termos não aceitos. Encerrando instalação."
      exit 1
      ;;
  esac
}

detect_and_create_directories() {
  if [[ ! -d "$NOMAD_DIR" ]]; then
    echo -e "${YELLOW}#${RESET} Criando diretório principal em $NOMAD_DIR...\n"
    sudo mkdir -p "$NOMAD_DIR"
    sudo chown "$(whoami):$(whoami)" "$NOMAD_DIR"
  fi

  # Detecta automaticamente se há um volume secundário montado em /mnt/nomad_storage
  if [[ -n "${NOMAD_STORAGE_OVERRIDE:-}" ]]; then
    STORAGE_TARGET_DIR="${NOMAD_STORAGE_OVERRIDE}"
  elif mountpoint -q /mnt/nomad_storage 2>/dev/null; then
    STORAGE_TARGET_DIR="/mnt/nomad_storage"
    echo -e "${GREEN}#${RESET} Volume dedicado em /mnt/nomad_storage detectado! Configurando armazenamento nele.\n"
  else
    STORAGE_TARGET_DIR="${NOMAD_DIR}/storage"
    echo -e "${YELLOW}#${RESET} Usando diretório de armazenamento padrão em ${STORAGE_TARGET_DIR}.\n"
  fi

  sudo mkdir -p \
    "${STORAGE_TARGET_DIR}/logs" \
    "${STORAGE_TARGET_DIR}/zim" \
    "${STORAGE_TARGET_DIR}/books" \
    "${STORAGE_TARGET_DIR}/maps" \
    "${STORAGE_TARGET_DIR}/media" \
    "${STORAGE_TARGET_DIR}/kb_uploads"

  sudo touch "${STORAGE_TARGET_DIR}/logs/admin.log"
}

download_management_compose_file() {
  local compose_file_path="${NOMAD_DIR}/compose.yml"

  echo -e "${YELLOW}#${RESET} Baixando configuração Docker Compose de ${GITHUB_USER}/${GITHUB_REPO}...\n"
  if ! curl -fsSL "$MANAGEMENT_COMPOSE_FILE_URL" -o "$compose_file_path"; then
    echo -e "${RED}#${RESET} Falha ao baixar management_compose.yaml. Verifique sua conexão e se o push foi feito no GitHub."
    exit 1
  fi

  local app_key
  local db_root_password
  local db_user_password
  app_key=$(generateRandomPass)
  db_root_password=$(generateRandomPass)
  db_user_password=$(generateRandomPass)

  if [[ -d "${NOMAD_DIR}/mysql" ]]; then
    echo -e "${YELLOW}#${RESET} Limpando diretório MySQL de tentativa anterior para sincronizar credenciais...\n"
    sudo rm -rf "${NOMAD_DIR}/mysql"
  fi

  echo -e "${YELLOW}#${RESET} Configurando variáveis de ambiente e caminhos de armazenamento...\n"
  sed -i "s|ghcr.io/oneithan/nexus-nomad:latest|${NOMAD_ADMIN_IMAGE}|g" "$compose_file_path"
  sed -i "s|URL=replaceme|URL=http://${local_ip_address}:8080|g" "$compose_file_path"
  sed -i "s|APP_KEY=replaceme|APP_KEY=${app_key}|g" "$compose_file_path"
  sed -i "s|DB_PASSWORD=replaceme|DB_PASSWORD=${db_user_password}|g" "$compose_file_path"
  sed -i "s|MYSQL_ROOT_PASSWORD=replaceme|MYSQL_ROOT_PASSWORD=${db_root_password}|g" "$compose_file_path"
  sed -i "s|MYSQL_PASSWORD=replaceme|MYSQL_PASSWORD=${db_user_password}|g" "$compose_file_path"

  if [[ "${STORAGE_TARGET_DIR}" != "/opt/project-nomad/storage" ]]; then
    sed -i "s|/opt/project-nomad/storage:/app/storage|${STORAGE_TARGET_DIR}:/app/storage|g" "$compose_file_path"
    sed -i "s|NOMAD_STORAGE_PATH=/opt/project-nomad/storage|NOMAD_STORAGE_PATH=${STORAGE_TARGET_DIR}|g" "$compose_file_path"
    sed -i "s|/opt/project-nomad/storage:/storage|${STORAGE_TARGET_DIR}:/storage|g" "$compose_file_path"
  fi

  echo -e "${GREEN}#${RESET} Arquivo compose.yml configurado com sucesso (Storage: ${STORAGE_TARGET_DIR}).\n"
}

download_helper_scripts() {
  local start_script_path="${NOMAD_DIR}/start_nomad.sh"
  local stop_script_path="${NOMAD_DIR}/stop_nomad.sh"
  local update_script_path="${NOMAD_DIR}/update_nomad.sh"

  echo -e "${YELLOW}#${RESET} Baixando scripts auxiliares (start, stop, update)...\n"
  curl -fsSL --retry 5 --retry-delay 3 "$START_SCRIPT_URL" -o "$start_script_path" && chmod +x "$start_script_path"
  curl -fsSL --retry 5 --retry-delay 3 "$STOP_SCRIPT_URL" -o "$stop_script_path" && chmod +x "$stop_script_path"
  curl -fsSL --retry 5 --retry-delay 3 "$UPDATE_SCRIPT_URL" -o "$update_script_path" && chmod +x "$update_script_path"
  echo -e "${GREEN}#${RESET} Scripts auxiliares instalados em ${NOMAD_DIR}.\n"
}

prepare_nomad_admin_image() {
  echo -e "${YELLOW}#${RESET} Obtendo imagem do Nexus Project NOMAD (${NOMAD_ADMIN_IMAGE})...\n"
  if sudo docker pull "${NOMAD_ADMIN_IMAGE}"; then
    echo -e "${GREEN}#${RESET} Imagem pré-compilada baixada com sucesso do GitHub Container Registry!\n"
    return 0
  fi

  echo -e "${YELLOW}#${RESET} A imagem ainda não está pública no GHCR (ou o GitHub Actions ainda está compilando)."
  echo -e "${YELLOW}#${RESET} Ativando compilação local automática direto do repositório https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git ...\n"

  local src_dir="${NOMAD_DIR}/src"
  if [[ -d "${src_dir}/.git" ]]; then
    sudo git -C "${src_dir}" fetch origin "${GITHUB_BRANCH}"
    sudo git -C "${src_dir}" reset --hard "origin/${GITHUB_BRANCH}"
  else
    sudo rm -rf "${src_dir}"
    if ! sudo git clone --depth 1 --branch "${GITHUB_BRANCH}" "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git" "${src_dir}"; then
      echo -e "${RED}#${RESET} Falha ao clonar https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git. Verifique se o repositório está acessível."
      exit 1
    fi
  fi

  local short_sha
  short_sha=$(sudo git -C "${src_dir}" rev-parse --short HEAD 2>/dev/null || echo "local")

  echo -e "${YELLOW}#${RESET} Compilando imagem Docker localmente (pode levar de 3 a 8 minutos na primeira vez)...\n"
  if ! sudo docker build \
      --build-arg VERSION="1.0.4-nexus" \
      --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      --build-arg VCS_REF="${short_sha}" \
      -t "${NOMAD_ADMIN_IMAGE}" \
      "${src_dir}"; then
    echo -e "${RED}#${RESET} Falha ao compilar a imagem Docker do Nexus NOMAD."
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Imagem ${NOMAD_ADMIN_IMAGE} compilada localmente com sucesso!\n"
}

start_management_containers() {
  echo -e "${YELLOW}#${RESET} Subindo os contêineres do Centro de Comando via Docker Compose...\n"
  if ! sudo docker compose -p project-nomad -f "${NOMAD_DIR}/compose.yml" up -d; then
    echo -e "${RED}#${RESET} Falha ao iniciar os contêineres. Verifique os logs com: sudo docker compose -p project-nomad -f ${NOMAD_DIR}/compose.yml logs"
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Contêineres do Nexus Project NOMAD iniciados com sucesso!\n"
}

get_local_ip() {
  local_ip_address=$(hostname -I | awk '{print $1}')
  if [[ -z "$local_ip_address" ]]; then
    echo -e "${RED}#${RESET} Não foi possível detectar o IP local. Verifique o cabo de rede ou Wi-Fi."
    exit 1
  fi
}

verify_gpu_setup() {
  local has_amd_gpu='false'
  local amd_gfx_version=''
  if command -v lspci &> /dev/null; then
    if lspci 2>/dev/null | grep -iE "VGA|3D controller|Display" | grep -iE "amd|radeon" &> /dev/null; then
      has_amd_gpu='true'
    fi
  fi

  local gpu_marker_path="${STORAGE_TARGET_DIR}/.nomad-gpu-type"
  if command -v nvidia-smi &> /dev/null; then
    echo 'nvidia' | sudo tee "${gpu_marker_path}" > /dev/null 2>&1 || true
  elif [[ "${has_amd_gpu}" == 'true' ]]; then
    echo 'amd' | sudo tee "${gpu_marker_path}" > /dev/null 2>&1 || true
  else
    sudo rm -f "${gpu_marker_path}" 2>/dev/null || true
  fi

  local amd_gfx_marker_path="${STORAGE_TARGET_DIR}/.nomad-amd-gfx"
  if [[ -n "${amd_gfx_version}" ]]; then
    echo "${amd_gfx_version}" | sudo tee "${amd_gfx_marker_path}" > /dev/null 2>&1 || true
  else
    sudo rm -f "${amd_gfx_marker_path}" 2>/dev/null || true
  fi
}

success_message() {
  echo -e "${GREEN}#########################################################################${RESET}"
  echo -e "${GREEN}#${RESET} Instalação do ${GREEN}Nexus Project NOMAD (PT-BR)${RESET} concluída com sucesso!"
  echo -e "${GREEN}#${RESET} Diretório do sistema:       ${WHITE_R}${NOMAD_DIR}${RESET}"
  echo -e "${GREEN}#${RESET} Diretório de armazenamento: ${WHITE_R}${STORAGE_TARGET_DIR}${RESET}"
  echo -e "${GREEN}#${RESET}"
  echo -e "${GREEN}#${RESET} Acesse o Centro de Comando pelo navegador:"
  echo -e "${GREEN}#${RESET}   -> ${WHITE_R}http://localhost:8080${RESET} ou ${WHITE_R}http://${local_ip_address}:8080${RESET}"
  echo -e "${GREEN}#########################################################################${RESET}\n"
}

# Pre-flight checks
check_is_debian_based
check_is_x86_64
check_is_bash
check_has_sudo
ensure_dependencies_installed
check_is_debug_mode

# Main install
banner
get_install_confirmation
accept_terms
ensure_docker_installed
check_docker_compose
setup_nvidia_container_toolkit
get_local_ip
detect_and_create_directories
download_helper_scripts
download_management_compose_file
prepare_nomad_admin_image
start_management_containers
verify_gpu_setup
success_message
