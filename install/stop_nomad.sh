#!/bin/bash

echo "Localizando contêineres em execução do Nexus Project NOMAD..."

containers=$(docker ps --filter "name=^nomad_" --format "{{.Names}}")

if [ -z "$containers" ]; then
    echo "Nenhum contêiner do Nexus Project NOMAD em execução no momento."
    exit 0
fi

echo "Contêineres em execução encontrados:"
echo "$containers"
echo ""

for container in $containers; do
    echo "Parando contêiner com segurança: $container"
    if docker stop "$container"; then
        echo "✓ $container parado com sucesso"
    else
        echo "✗ Falha ao parar $container"
    fi
    echo ""
done

echo "Encerramento seguro de todos os contêineres do Nexus Project NOMAD concluído."
