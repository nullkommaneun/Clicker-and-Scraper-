// --- Elemente holen ---
const suchButton = document.getElementById('suchButton');
const suchfeld = document.getElementById('suchfeld');
const radiusInput = document.getElementById('radius');
const blacklistInput = document.getElementById('blacklist');
const ergebnisContainer = document.getElementById('ergebnisContainer');

async function starteScan() {
    // 1. Alle Konfigurationen von der Seite einlesen
    const suchBegriff = suchfeld.value.trim();
    const radius = radiusInput.value.trim();
    const blacklist = blacklistInput.value.trim().toLowerCase().split(',').map(item => item.trim());

    if (!suchBegriff) {
        alert("Bitte gib einen Suchbegriff ein.");
        return;
    }
    ergebnisContainer.innerHTML = "Scanne Kleinanzeigen, bitte warten...";

    // 2. Die Such-URL dynamisch und korrekt zusammenbauen
    // Beispiel: /s-sachsen/zwickau/goldring/k0l3825r50
    // l3825 ist der Code für Sachsen, den behalten wir mal als Basis
    // r+radius ist der Code für den Umkreis
    const kleinanzeigenURL = `https://www.kleinanzeigen.de/s-sachsen/${suchBegriff}/k0l3825r${radius}`;
    
    const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(kleinanzeigenURL)}`;

    try {
        const response = await fetch(proxyURL);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const angebote = doc.querySelectorAll('article.aditem');
        
        ergebnisContainer.innerHTML = "";
        let gefundeneAnzeigen = 0;

        angebote.forEach(angebot => {
            const titel = angebot.querySelector('h2 a')?.textContent.trim() || "";
            const beschreibung = angebot.querySelector('.aditem-main--middle--description')?.textContent.trim() || "";
            const preis = angebot.querySelector('.aditem-main--middle--price-shipping--price')?.textContent.trim() || "Kein Preis";
            const ganzerText = (titel + beschreibung).toLowerCase();

            // 3. Den Suchbegriff und die Blacklist anwenden
            const suchbegriffEnthalten = suchBegriff.toLowerCase().split(' ').every(wort => ganzerText.includes(wort));
            
            if (!suchbegriffEnthalten) {
                return; // Überspringen, wenn nicht alle Wörter des Suchbegriffs vorkommen
            }

            const enthaeltNegativesWort = blacklist.some(keyword => keyword && ganzerText.includes(keyword));
            
            if (enthaeltNegativesWort) {
                return; // Überspringen, wenn ein Blacklist-Wort gefunden wird
            }
            
            gefundeneAnzeigen++;

            // (Die Schnäppchen-Logik lassen wir der Einfachheit halber mal weg, kann aber wieder rein)

            const anzeigeHTML = `
                <div class="aditem">
                    <h3>${titel}</h3>
                    <p><strong>Preis:</strong> ${preis}</p>
                    <p>${beschreibung}</p>
                </div>
            `;
            ergebnisContainer.innerHTML += anzeigeHTML;
        });

        if(gefundeneAnzeigen === 0){
             ergebnisContainer.innerHTML = "Keine passenden Anzeigen gefunden (oder alle wurden herausgefiltert).";
        }

    } catch (error) {
        ergebnisContainer.innerHTML = `Ein Fehler ist aufgetreten: ${error}.`;
    }
}

suchButton.addEventListener('click', starteScan);
 
