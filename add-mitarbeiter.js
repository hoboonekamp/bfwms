const admin = require('firebase-admin');
const readline = require('readline');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./bf-werkzeug-tracker-firebase-adminsdk-fbsvc-32f7812506.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const outputDir = './qr-codes-mitarbeiter';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function getNextId() {
  const snapshot = await db.collection('mitarbeiter').orderBy('mitarbeiterId', 'desc').limit(1).get();
  if (snapshot.empty) return 1;
  const lastCode = snapshot.docs[0].data().mitarbeiterId; // z.B. "MA-007"
  const lastNum = parseInt(lastCode.split('-')[1], 10);
  return lastNum + 1;
}

async function addMitarbeiter(name) {
  const nextNum = await getNextId();
  const mitarbeiterId = `MA-${String(nextNum).padStart(3, '0')}`;

  await db.collection('mitarbeiter').doc(mitarbeiterId).set({ name, mitarbeiterId });

  const safeName = name.replace(/[^a-z0-9äöüß]/gi, '_');
  const filePath = path.join(outputDir, `${safeName}_${mitarbeiterId}.png`);
  await QRCode.toFile(filePath, mitarbeiterId, { width: 400 });

  console.log(`✓ "${name}" → ${mitarbeiterId}  (${filePath})\n`);
}

async function main() {
  console.log('Mitarbeiter hinzufügen (leeren Namen eingeben zum Beenden)\n');

  while (true) {
    const name = await ask('Name: ');
    if (!name.trim()) break;

    await addMitarbeiter(name.trim());
  }

  console.log('Fertig.');
  rl.close();
  process.exit(0);
}

main();
