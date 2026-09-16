const crypto = require('node:crypto');

// ALGORITHM FOR ENCRYPTION
const ALGORITHM = 'aes-256-cbc';

// STEP 3: First we use a hardcoded key. 
// STEP 4: Then we will move to process.env.DATABASE_ENCRYPTION_KEY
function getEncryptionKey() {
  const secret = process.env.DATABASE_ENCRYPTION_KEY || 'esta-es-una-llave-hardcodeada-32-!!';
  // We hash it to ensure it's exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Return IV and encrypted data
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
