#!/bin/bash

FILE="server.js"

echo "Backup erstellen..."
cp "$FILE" "$FILE.backup-$(date +%Y%m%d-%H%M%S)"

echo "Suche delete-qr Route..."

if grep -q "api/delete-mitarbeiter" "$FILE"; then
    echo "Route existiert bereits."
    exit 0
fi


cat >> "$FILE" <<'EOF'


// Mitarbeiter löschen
app.post('/api/delete-mitarbeiter', async (req, res) => {
  try {
    const id = req.body.id;

    if (!id) {
      return res.json({ok:false, error:"Keine ID"});
    }

    const doc = await db.collection('mitarbeiter').doc(id).get();

    if (!doc.exists) {
      return res.json({ok:false, error:"Mitarbeiter nicht gefunden"});
    }

    const data = doc.data();

    // QR Datei löschen
    if (data.qrFile) {
      const fs = require('fs');
      const path = require('path');

      const file = path.join(
        __dirname,
        'qr-codes-mitarbeiter',
        data.qrFile
      );

      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    // Firestore löschen
    await db.collection('mitarbeiter').doc(id).delete();


    res.json({
      ok:true,
      message:"Mitarbeiter gelöscht"
    });


  } catch(e) {

    console.error(e);

    res.json({
      ok:false,
      error:e.message
    });

  }
});

EOF


echo "Fertig."
echo "Jetzt Server neu starten:"
echo "systemctl restart dein-service"
echo "oder node server.js"
