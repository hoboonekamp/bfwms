const admin = require('firebase-admin');
const readline = require('readline');
const serviceAccount = require('./bf-werkzeug-tracker-firebase-adminsdk-fbsvc-32f7812506.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function getNextId() {
  const snapshot = await db.collection('auftraege').orderBy('auftragId', 'desc').limit(1).get();
  if (snapshot.empty) return 1;
  const lastCode = snapshot.docs[0].data().auftragId; // z.B. "AUF-007"
  const lastNum = parseInt(lastCode.split('-')[1], 10);
  return lastNum + 1;
}

// Interaktive Mitarbeiter-Auswahl mit Pfeiltasten
function selectMitarbeiter(mitarbeiterListe) {
  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set();

    function render() {
      console.clear();
      console.log('Mitarbeiter auswählen  (↑↓ navigieren, Enter = hinzufügen/entfernen, S = speichern & fertig)\n');
      mitarbeiterListe.forEach((m, i) => {
        const isCursor = i === cursor ? '➤ ' : '  ';
        const isSelected = selected.has(i) ? '[x]' : '[ ]';
        console.log(`${isCursor}${isSelected} ${m.name}  (${m.mitarbeiterId})`);
      });
      console.log('\nAusgewählt: ' + (selected.size === 0 ? '–' : [...selected].map(i => mitarbeiterListe[i].name).join(', ')));
    }

    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function onKeypress(str, key) {
      if (key.name === 'up') {
        cursor = (cursor - 1 + mitarbeiterListe.length) % mitarbeiterListe.length;
        render();
      } else if (key.name === 'down') {
        cursor = (cursor + 1) % mitarbeiterListe.length;
        render();
      } else if (key.name === 'return') {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        render();
      } else if (str && str.toLowerCase() === 's') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', onKeypress);
        const result = [...selected].map(i => mitarbeiterListe[i]);
        resolve(result);
      } else if (key.ctrl && key.name === 'c') {
        process.exit();
      }
    }

    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', onKeypress);
  });
}

async function main() {
  console.log('Neuen Auftrag anlegen\n');

  const auftraggeber = await ask('Auftraggeber: ');
  const datum = await ask('Datum: ');
  const ort = await ask('Ort: ');

  const snapshot = await db.collection('mitarbeiter').orderBy('mitarbeiterId').get();
  if (snapshot.empty) {
    console.log('\nKeine Mitarbeiter in der Datenbank gefunden. Bitte zuerst mit add-mitarbeiter.js anlegen.');
    rl.close();
    process.exit(0);
  }
  const mitarbeiterListe = snapshot.docs.map(doc => doc.data());

  const ausgewaehlteMitarbeiter = await selectMitarbeiter(mitarbeiterListe);

  const nextNum = await getNextId();
  const auftragId = `AUF-${String(nextNum).padStart(3, '0')}`;

  await db.collection('auftraege').doc(auftragId).set({
    auftragId,
    auftraggeber,
    datum,
    ort,
    mitarbeiter: ausgewaehlteMitarbeiter.map(m => ({ mitarbeiterId: m.mitarbeiterId, name: m.name })),
    status: 'offen',
    werkzeuge: []
  });

  console.clear();
  console.log(`✓ Auftrag ${auftragId} gespeichert`);
  console.log(`  Auftraggeber: ${auftraggeber}`);
  console.log(`  Datum: ${datum}`);
  console.log(`  Ort: ${ort}`);
  console.log(`  Mitarbeiter: ${ausgewaehlteMitarbeiter.map(m => m.name).join(', ') || '–'}`);

  rl.close();
  process.exit(0);
}

main();
