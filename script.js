// --- Elemente und Konfiguration ---
const suchButton = document.getElementById('suchButton');
const suchfeld = document.getElementById('suchfeld'); // NEU
const ergebnisContainer = document.getElementById('ergebnisContainer');

// NEU: Unser "Spickzettel" für die Kategorie-Auswahl
const KATEGORIE_MAP = {
    'gold': 'c23-l3825',        // Kategorie: Schmuck & Accessoires in Sachsen
    'schmuck': 'c23-l3825',     // Alias für Schmuck
    'fahrrad': 'c217-l3825',    // Kategorie: Fahrräder in Sachsen
    'handy': 'c173-l3825'       // Kategorie: Handy & Telefon in Sachsen
};

// NEU: Unsere "Blacklist" für irrelevante Begriffe
const NEGATIVE_KEYWORDS = {
    'gold': ['porzellan', 'rand', 'dekor', 'geschirr', 'teller', 'tasse', 'goldrand']
    // Hier könnten wir Listen für andere Begriffe hinzufügen
};

// Unsere Schnäppchen-Regeln
const SCHNAEPPCHEN_KEYWORDS = ["dringend", "notverkauf", "schnell", "nachlass", "auflösung"];

// --- Die Hauptfunktion ---
async function starteScan() {
    const suchBegriff = suchfeld.value.trim().toLowerCase();
    if (!suchBegriff) {
        alert("Bitte gib einen Suchbegriff ein.");
        return;
    }
    ergebnisContainer.innerHTML = `Scanne Kleinanzeigen nach "${suchBegriff}", bitte warten...`;

    // NEU: Dynamische URL bauen
    let kleinanzeigenURL;
    const kategorie = KATEGORIE_MAP[suchBegriff];
    if (kategorie) {
        // Wenn wir eine Kategorie kennen, suchen wir direkt dort
        kleinanzeigenURL = `https://www.kleinanzeigen.de/s-anzeige:angebote/${kategorie}/anzeige:${suchBegriff}`;
    } else {
        // Ansonsten eine allgemeine Suche
        kleinanzeigenURL = `https://www.kleinanzeigen.de/s-sachsen/${suchBegriff}/k0l3825`;
    }
    
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

            // NEU: Filter für negative Keywords anwenden
            const negativeFilter = NEGATIVE_KEYWORDS[suchBegriff] || [];
            const enthaeltNegativesWort = negativeFilter.some(keyword => ganzerText.includes(keyword));
            
            if (enthaeltNegativesWort) {
                return; // Diese Anzeige überspringen
            }
            
            gefundeneAnzeigen++;

            // Schnäppchen-Logik
            let istSchnaeppchen = false;
            for (const keyword of SCHNAEPPCHEN_KEYWORDS) {
                if (ganzerText.includes(keyword)) {
                    istSchnaeppchen = true;
                    break;
                }
            }

            const anzeigeHTML = `
                <div class="aditem ${istSchnaeppchen ? 'schnaeppchen' : ''}">
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

// --- Verbinde die Funktion mit dem Button ---
suchButton.addEventListener('click', starteScan);
