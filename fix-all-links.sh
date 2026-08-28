#!/bin/bash

echo "=== Fix WMS Links ==="

cd ~/werkzeug-tracker || exit 1

echo "Backup erstellen..."
cp -r public public_backup_$(date +%Y%m%d_%H%M%S)


echo "Inventar Links..."
sed -i 's#inventar.html#index.html#g' public/inventar/*.html


echo "Mitarbeiter Links..."
sed -i 's#mitarbeiter.html#index.html#g' public/mitarbeiter/*.html
sed -i 's#mitarbeiter-liste.html#liste.html#g' public/mitarbeiter/*.html
sed -i 's#mitarbeiter-detail.html#detail.html#g' public/mitarbeiter/*.html
sed -i 's#add-mitarbeiter.html#add.html#g' public/mitarbeiter/*.html


echo "Aufträge Links..."
sed -i 's#auftragsliste.html#liste.html#g' public/auftraege/*.html
sed -i 's#add-auftrag.html#add.html#g' public/auftraege/*.html


echo
echo "=== Alte Links suchen ==="

grep -R \
"inventar.html\|mitarbeiter.html\|mitarbeiter-liste.html\|mitarbeiter-detail.html\|add-mitarbeiter.html\|auftragsliste.html\|add-auftrag.html" \
public || echo "✓ Keine alten Links"


echo
echo "=== Fertig ==="
