#!/bin/bash

# Script de Rotación Automática
# Rota el valor de API_KEY en el archivo .env cada 2 minutos (120 segundos)

echo "Iniciando servicio de rotación automática de llaves..."
echo "Presiona Ctrl+C para detener."

while true; do
  # Obtener timestamp o cadena aleatoria
  RANDOM_STR=$(head -c 12 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')
  NUEVO_SECRETO="key_${RANDOM_STR}"
  
  # Reemplazar la llave actual en el archivo .env
  # NOTA: Usamos sed compatible con Mac y Linux
  sed -i "s/^API_KEY=.*/API_KEY=$NUEVO_SECRETO/" .env 2>/dev/null || sed -i '' "s/^API_KEY=.*/API_KEY=$NUEVO_SECRETO/" .env
  
  # Imprimir la hora exacta y los valores
  echo "----------------------------------------"
  echo "🔄 [$(date +'%H:%M:%S')] Rotación Ejecutada:"
  echo "🔑 Nueva API_KEY = $NUEVO_SECRETO"
  
  # Extraer la llave de base de datos para demostrar que no cambió
  DB_KEY=$(grep "DATABASE_ENCRYPTION_KEY" .env | cut -d '=' -f2)
  echo "🛡️  DATABASE_ENCRYPTION_KEY = $DB_KEY (INTACTA)"
  
  # Dormir 2 minutos (120 segundos) antes de la siguiente rotación
  sleep 120
done
