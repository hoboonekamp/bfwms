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
const outputDir = './qr-codes';

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
  const snapshot = await db.collection('werkzeuge').orderBy('qrCode', 'desc').limit(1).get();
  if (snapshot.empty) return 1;
  const lastCode = snapshot.docs[0].data().qrCode; // z.B. "WZ-007"
  const lastNum = parseInt(lastCode.split('-')[1], 10);
  return lastNum + 1;
}

async function addTool(name) {
  const nextNum = await getNextId();
  const qrCode = `WZ-${String(nextNum).padStart(3, '0')}`;

  await db.collection('werkzeuge').doc(qrCode).set({ name, qrCode });

  const safeName = name.replace(/[^a-z0-9äöüß]/gi, '_');
  const filePath = path.join(outputDir, `${safeName}_${qrCode}.png`);
  await QRCode.toFile(filePath, qrCode, { width: 400 });

  console.log(`✓ "${name}" → ${qrCode}  (${filePath})\n`);
}

async function main() {
  console.log('Werkzeug hinzufügen (leeren Namen eingeben zum Beenden)\n');

  while (true) {
    const name = await ask('Name: ');
    if (!name.trim()) break;

    await addTool(name.trim());
  }

  console.log('Fertig.');
  rl.close();
  process.exit(0);
}

main();
