#!/bin/bash

# Nexus Project NOMAD — Script de Desinstalação (PT-BR)

RESET='\033[0m'
YELLOW='\033[1;33m'
WHITE_R='\033[39m'
GRAY_R='\033[39m'
RED='\033[1;31m'
GREEN='\033[1;32m'

NOMAD_DIR="/opt/project-nomad"
MANAGEMENT_COMPOSE_FILE="${NOMAD_DIR}/compose.yml"

header_red() {
  if [[ "${script_option_debug}" != 'true' ]]; then clear; clear; fi
  echo -e "${RED}#########################################################################${RESET}\n"
}

check_has_sudo() {
  if sudo -v 2>/dev/null; then
    echo -e "${GREEN}#${RESET} Permissões sudo confirmadas.\n"
  else
    header_red
    echo -e "${RED}#${RESET} Este script requer permissões sudo para ser executado.\n"
    echo -e "${RED}#${RESET} Exemplo: sudo bash $(basename "$0")"
    exit 1
  fi
}

check_current_directory() {
  if [ "$(pwd)" == "${NOMAD_DIR}" ]; then
    echo "Por favor, execute este script a partir de outro diretório fora de ${NOMAD_DIR}."
    exit 1
  fi
}

ensure_management_compose_file_exists() {
  if [ ! -f "${MANAGEMENT_COMPOSE_FILE}" ]; then
    echo "Não foi possível encontrar o arquivo Docker Compose em ${MANAGEMENT_COMPOSE_FILE}. Verifique se o Nexus Project NOMAD está instalado."
    exit 1
  fi
}

get_uninstall_confirmation() {
  read -p "Este script removerá os contêineres do Nexus Project NOMAD. Deseja continuar? (s/N): " choice
  case "$choice" in
    s|S|y|Y )
      echo -e "Prosseguindo com a desinstalação..."
      ;;
    * )
      echo -e "Desinstalação cancelada pelo usuário."
      exit 0
      ;;
  esac
}

ensure_docker_installed() {
  if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado no sistema."
    exit 1
  fi
}

check_docker_compose() {
  if ! docker compose version &>/dev/null; then
    echo -e "${RED}#${RESET} Docker Compose v2 não está instalado ou disponível como plugin do Docker."
    exit 1
  fi
}

storage_cleanup() {
  read -p "Deseja excluir também o diretório de dados (${NOMAD_DIR})? ISSO APAGARÁ PERMANENTEMENTE os dados locais lá armazenados! (s/N): " delete_dir_choice
  case "$delete_dir_choice" in
    s|S|y|Y )
      echo "Removendo arquivos de ${NOMAD_DIR}..."
      if rm -rf "${NOMAD_DIR}"; then
        echo "Arquivos removidos com sucesso."
      else
        echo "Aviso: Não foi possível remover completamente ${NOMAD_DIR}. Remova manualmente se necessário."
      fi
      ;;
    * )
      echo "Mantendo o diretório ${NOMAD_DIR} intacto."
      ;;
  esac
}

uninstall_nomad() {
  echo "Parando e removendo contêineres de gerenciamento do Nexus Project NOMAD..."
  docker compose -p project-nomad -f "${MANAGEMENT_COMPOSE_FILE}" down
  sleep 5

  echo "Parando e removendo contêineres de aplicativos (nomad_*)..."
  docker ps -a --filter "name=^nomad_" --format "{{.Names}}" | xargs -r docker rm -f
  sleep 5

  echo "Removendo rede Docker project-nomad_default (se existir)..."
  docker network rm project-nomad_default 2>/dev/null && echo "Rede removida." || echo "Rede já removida ou inexistente."

  echo "Removendo volume temporário de atualização (se existir)..."
  docker volume rm project-nomad_nomad-update-shared 2>/dev/null && echo "Volume removido." || echo "Volume já removido ou inexistente."

  storage_cleanup

  echo "Nexus Project NOMAD desinstalado com sucesso!"
}

check_has_sudo
check_current_directory
ensure_management_compose_file_exists
ensure_docker_installed
check_docker_compose
get_uninstall_confirmation
uninstall_nomad
