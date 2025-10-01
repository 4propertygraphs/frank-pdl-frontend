const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const filePath = "./GetAgency.json"; // cesta k souboru JSON

// Načtení souboru
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the JSON file:", err);
    return;
  }

  const agencies = JSON.parse(data);

  // Přidání UUID k každé agentuře
  const updatedAgencies = agencies.map((agency) => ({
    ...agency,
    uuid: uuidv4()  // Generování UUID pro každou agenturu
  }));

  // Uložení nového souboru s UUID
  fs.writeFile(filePath, JSON.stringify(updatedAgencies, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error writing the updated JSON file:", err);
    } else {
      console.log("UUIDs added and file updated successfully!");
    }
  });
});
