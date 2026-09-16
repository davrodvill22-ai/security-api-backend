const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');

console.log("==========================================");
console.log("🔄 Iniciando servicio de rotación de llaves");
console.log("==========================================");

function rotateKey() {
  if (!fs.existsSync(envPath)) {
    console.error("No se encontró el archivo .env");
    return;
  }

  // Leer archivo .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Generar nueva contraseña aleatoria
  const randomStr = crypto.randomBytes(8).toString('hex');
  const nuevoSecreto = `key_${randomStr}`;

  // Reemplazar solo la línea de API_KEY
  envContent = envContent.replace(/^API_KEY=.*$/m, `API_KEY=${nuevoSecreto}`);
  
  // Escribir el cambio
  fs.writeFileSync(envPath, envContent);

  // Extraer la llave de DB para demostrar que sigue intacta
  const dbKeyMatch = envContent.match(/^DATABASE_ENCRYPTION_KEY=(.*)$/m);
  const dbKey = dbKeyMatch ? dbKeyMatch[1] : 'No encontrada';

  // Mostrar resultados en consola
  const hora = new Date().toLocaleTimeString();
  console.log(`\n[${hora}] Rotación Ejecutada Exitosamente:`);
  console.log(`🔑 Nueva API_KEY = ${nuevoSecreto}`);
  console.log(`🛡️  DATABASE_ENCRYPTION_KEY = ${dbKey} (Intacta)`);
}

// Ejecutar la primera rotación de inmediato
rotateKey();

// Ejecutar cada 2 minutos (120,000 milisegundos)
setInterval(rotateKey, 120000);
