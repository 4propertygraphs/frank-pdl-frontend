const fs = require('fs');
const path = require('path');

// Načti data z JSON souboru (agencies.json) ve stejné složce
const agenciesFilePath = path.join(__dirname, 'agencies.json');

// Načti data z JSON souboru (agencies.json)
fs.readFile(agenciesFilePath, 'utf8', (err, data) => {
  if (err) {
    console.log('Chyba při načítání souboru:', err);
    return;
  }

  // Parsuj JSON data
  const jsonData = JSON.parse(data);
  
  // Vytvoříme přímo pole agentur (pokud jsou v jsonData na správném místě)
  const agencies = jsonData; // Předpokládáme, že agentury jsou přímo v jsonData (ne v nějakém 'data' poli)

  // Zkontroluj, zda jsou data o agenturách k dispozici
  if (!agencies || agencies.length === 0) {
    console.log('Agentury nebyly nalezeny nebo data nejsou správně načtena.');
    return;
  }

  // Vytvoř pole URL pro agentury
  const urls = agencies.map(agency => {
    return {
      SitePrefix: agency.SitePrefix,
      SiteID: agency.SiteID,
      url: `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${agency.SitePrefix}-${agency.SiteID}.xml`
    };
  });

  // Ulož vytvořený výstup do souboru (urls.json)
  fs.writeFile('urls.json', JSON.stringify(urls, null, 2), (err) => {
    if (err) {
      console.log('Chyba při ukládání souboru:', err);
    } else {
      console.log('Soubor urls.json byl úspěšně vytvořen!');
    }
  });
});
