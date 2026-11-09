#!/bin/bash

# Nexus Project NOMAD — Script de Atualização (PT-BR)

RESET='\033[0m'
YELLOW='\033[1;33m'
WHITE_R='\033[39m'
RED='\033[1;31m'
GREEN='\033[1;32m'

NOMAD_DIR="/opt/project-nomad"
GITHUB_USER="${GITHUB_USER:-ONeithan}"
GITHUB_REPO="${GITHUB_REPO:-Nexus-Nomad}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
GITHUB_USER_LC=$(echo "${GITHUB_USER}" | tr '[:upper:]' '[:lower:]')
GITHUB_REPO_LC=$(echo "${GITHUB_REPO}" | tr '[:upper:]' '[:lower:]')
NOMAD_ADMIN_IMAGE="ghcr.io/${GITHUB_USER_LC}/${GITHUB_REPO_LC}:latest"
local_ip_address=''

check_has_sudo() {
  if ! sudo -v; then
    echo -e "${RED}#${RESET} Execute este script com sudo: sudo bash $(basename "$0")\n"
    exit 1
  fi
}

check_is_bash() {
  if [[ -z "$BASH_VERSION" ]]; then
    echo -e "${RED}#${RESET} Execute este script com bash: sudo bash $(basename "$0")\n"
    exit 1
  fi
}

check_is_debian_based() {
  if [[ ! -f /etc/debian_version ]]; then
    echo -e "${RED}#${RESET} Este script suporta apenas sistemas baseados em Debian.\n"
    exit 1
  fi
}

get_update_confirmation() {
  read -p "Deseja atualizar o Nexus Project NOMAD a partir do GitHub (${GITHUB_USER}/${GITHUB_REPO})? Nenhum dado será apagado. (s/N): " choice
  case "$choice" in
    s|S|y|Y )
      echo -e "${GREEN}#${RESET} Iniciando atualização...\n"
      ;;
    * )
      echo "Atualização cancelada."
      exit 0
      ;;
  esac
}

ensure_docker_ready() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}#${RESET} Docker não está instalado. Use o script install_nomad.sh primeiro."
    exit 1
  fi
  if ! systemctl is-active --quiet docker; then
    sudo systemctl start docker
  fi
  if [ ! -f "${NOMAD_DIR}/compose.yml" ]; then
    echo -e "${RED}#${RESET} Arquivo ${NOMAD_DIR}/compose.yml não encontrado."
    exit 1
  fi
}

update_and_recreate() {
  echo -e "${YELLOW}#${RESET} Buscando imagem mais recente (${NOMAD_ADMIN_IMAGE})..."
  if ! sudo docker pull "${NOMAD_ADMIN_IMAGE}"; then
    echo -e "${YELLOW}#${RESET} GHCR indisponível ou privado; recompilando direto do GitHub (${GITHUB_USER}/${GITHUB_REPO})..."
    local src_dir="${NOMAD_DIR}/src"
    if [[ -d "${src_dir}/.git" ]]; then
      sudo git -C "${src_dir}" fetch origin "${GITHUB_BRANCH}"
      sudo git -C "${src_dir}" reset --hard "origin/${GITHUB_BRANCH}"
    else
      sudo rm -rf "${src_dir}"
      sudo git clone --depth 1 --branch "${GITHUB_BRANCH}" "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git" "${src_dir}"
    fi
    sudo docker build --build-arg VERSION="1.0.4-nexus" -t "${NOMAD_ADMIN_IMAGE}" "${src_dir}"
  fi

  echo -e "${YELLOW}#${RESET} Atualizando contêineres auxiliares..."
  sudo docker compose -p project-nomad -f "${NOMAD_DIR}/compose.yml" pull --ignore-pull-failures || true

  echo -e "${YELLOW}#${RESET} Recriando contêineres..."
  if ! sudo docker compose -p project-nomad -f "${NOMAD_DIR}/compose.yml" up -d --force-recreate; then
    echo -e "${RED}#${RESET} Falha ao recriar os contêineres."
    exit 1
  fi
}

get_local_ip() {
  local_ip_address=$(hostname -I | awk '{print $1}')
}

success_message() {
  echo -e "${GREEN}#${RESET} Nexus Project NOMAD atualizado com sucesso!\n"
  echo -e "${GREEN}#${RESET} Painel disponível em: http://${local_ip_address}:8080\n"
}

check_is_debian_based
check_is_bash
check_has_sudo
get_update_confirmation
ensure_docker_ready
update_and_recreate
get_local_ip
success_message
