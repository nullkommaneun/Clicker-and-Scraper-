// --- Elemente und Konfiguration ---
const startButton = document.getElementById('startButton');
const ergebnisContainer = document.getElementById('ergebnisContainer');

// Die URL, die wir scrapen wollen
const kleinanzeigenURL = "https://www.kleinanzeigen.de/s-sachsen/goldring-585/k0l3825";

// Unser "Bote", der CORS-Proxy
const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(kleinanzeigenURL)}`;

// Unsere Schnäppchen-Regeln
const SCHNAEPPCHEN_KEYWORDS = ["dringend", "notverkauf", "schnell", "nachlass", "auflösung"];

// --- Die Hauptfunktion ---
async function starteScan() {
    ergebnisContainer.innerHTML = "Scanne Kleinanzeigen, bitte warten...";

    try {
        // 1. Daten über den Proxy holen
        const response = await fetch(proxyURL);
        const htmlText = await response.text();

        // 2. Den HTML-Text in ein durchsuchbares Dokument umwandeln
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // 3. Alle Anzeigen finden (Kleinanzeigen nutzt <article class="aditem">)
        const angebote = doc.querySelectorAll('article.aditem');
        
        ergebnisContainer.innerHTML = ""; // Alte Ergebnisse löschen

        if (angebote.length === 0) {
            ergebnisContainer.innerHTML = "Konnte keine Anzeigen finden. Möglicherweise blockiert.";
            return;
        }

        // 4. Jedes Angebot analysieren und anzeigen
        angebote.forEach(angebot => {
            const titel = angebot.querySelector('h2 a').textContent.trim();
            const preis = angebot.querySelector('.aditem-main--middle--price-shipping--price').textContent.trim();
            const beschreibung = angebot.querySelector('.aditem-main--middle--description').textContent.trim();
            
            // Überprüfe, ob es ein Schnäppchen ist
            let istSchnaeppchen = false;
            const ganzerText = (titel + beschreibung).toLowerCase();
            for (const keyword of SCHNAEPPCHEN_KEYWORDS) {
                if (ganzerText.includes(keyword)) {
                    istSchnaeppchen = true;
                    break;
                }
            }

            // Erstelle das HTML für die Anzeige
            const anzeigeHTML = `
                <div class="aditem ${istSchnaeppchen ? 'schnaeppchen' : ''}">
                    <h3>${titel}</h3>
                    <p><strong>Preis:</strong> ${preis}</p>
                    <p>${beschreibung}</p>
                </div>
            `;
            ergebnisContainer.innerHTML += anzeigeHTML;
        });

    } catch (error) {
        ergebnisContainer.innerHTML = `Ein Fehler ist aufgetreten: ${error}. Versuche es später erneut.`;
        console.error("Fehler beim Scrapen:", error);
    }
}

// --- Verbinde die Funktion mit dem Button ---
startButton.addEventListener('click', starteScan);
