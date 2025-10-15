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
    const blacklist = blacklistInput.value.trim().toLowerCase().split(',').map(item => item.trim()).filter(item => item); // Filtert leere Einträge raus

    if (!suchBegriff) {
        alert("Bitte gib einen Suchbegriff ein.");
        return;
    }
    ergebnisContainer.innerHTML = "Scanne Kleinanzeigen, bitte warten...";

    // 2. Die Such-URL dynamisch und korrekt zusammenbauen
    // l3825 ist der Code für Sachsen, r+radius ist der Code für den Umkreis
    const kleinanzeigenURL = `https://www.kleinanzeigen.de/s-sachsen/${encodeURIComponent(suchBegriff)}/k0l3825r${encodeURIComponent(radius)}`;
    
    // Wir nutzen einen CORS-Proxy, um die Sicherheitsbeschränkungen des Browsers zu umgehen
    const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(kleinanzeigenURL)}`;

    try {
        const response = await fetch(proxyURL);
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.statusText}`);
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const angebote = doc.querySelectorAll('article.aditem');
        
        ergebnisContainer.innerHTML = "";
        let gefundeneAnzeigen = 0;

        angebote.forEach(angebot => {
            const titelElement = angebot.querySelector('h2 a');
            const titel = titelElement?.textContent.trim() || "Kein Titel";
            
            // Link aus dem 'href'-Attribut holen und zu einer vollen URL machen
            const link = titelElement?.getAttribute('href') || '#';
            const vollstaendigerLink = `https://www.kleinanzeigen.de${link}`;

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

            // Das HTML für die Anzeige erstellen
            const anzeigeHTML = `
                <div class="aditem">
                    <h3><a href="${vollstaendigerLink}" target="_blank" rel="noopener noreferrer">${titel}</a></h3>
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
        ergebnisContainer.innerHTML = `Ein Fehler ist aufgetreten: ${error}. Möglicherweise blockiert der CORS-Proxy die Anfrage. Versuche es später erneut.`;
        console.error("Fehler beim Scrapen:", error);
    }
}

// Die Funktion mit dem Button verbinden
suchButton.addEventListener('click', starteScan);
