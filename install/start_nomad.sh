#!/bin/bash

echo "Localizando contêineres do Nexus Project NOMAD..."

# -a inclui todos os contêineres (em execução e parados)
containers=$(docker ps -a --filter "name=^nomad_" --format "{{.Names}}")

if [ -z "$containers" ]; then
    echo "Nenhum contêiner do Nexus Project NOMAD encontrado. O sistema está instalado?"
    exit 0
fi

echo "Contêineres encontrados:"
echo "$containers"
echo ""

for container in $containers; do
    echo "Iniciando contêiner: $container"
    if docker start "$container"; then
        echo "✓ $container iniciado com sucesso"
    else
        echo "✗ Falha ao iniciar $container"
    fi
    echo ""
done

echo "Inicialização de todos os contêineres do Nexus Project NOMAD concluída."
