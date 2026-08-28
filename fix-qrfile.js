const admin = require('firebase-admin');
admin.initializeApp({credential: admin.credential.cert(require('./bf-werkzeug-tracker-firebase-adminsdk-fbsvc-32f7812506.json'))});
const fs = require('fs');
const db = admin.firestore();

db.collection('mitarbeiter').get().then(async snap => {
  for (const doc of snap.docs) {
    const m = doc.data();
    if (m.qrFile === undefined) {
      const files = fs.readdirSync('./qr-codes-mitarbeiter');
      const match = files.find(f => f.endsWith('_' + m.mitarbeiterId + '.png'));
      if (match) {
        await doc.ref.update({ qrFile: match });
        console.log('Nachgetragen:', m.mitarbeiterId, '→', match);
      } else {
        console.log('Keine Datei gefunden für', m.mitarbeiterId);
      }
    }
  }
  console.log('Fertig.');
});
