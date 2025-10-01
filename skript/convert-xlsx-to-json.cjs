// convert-xlsx-to-json.js
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// cesta k tvému Excel souboru (leží ve stejné složce)
const inputFile = path.join(__dirname, "book1.xlsx");
const outputFile = path.join(__dirname, "agencies.json");

try {
  // Načti Excel
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0]; // první list
  const sheet = workbook.Sheets[sheetName];

  // Převeď na JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // Uprav formát
  const agencies = data.map((row) => ({
    SitePrefix: String(row.SitePrefix || "").trim(),
    SiteID: Number(row.SiteID) || 0,
    SiteName: String(row.SiteName || "").trim(),
  }));

  // Ulož jako JSON
  fs.writeFileSync(outputFile, JSON.stringify(agencies, null, 2), "utf-8");

  console.log(`✅ Hotovo! Exportováno ${agencies.length} agencies do: ${outputFile}`);
} catch (err) {
  console.error("❌ Chyba při konverzi:", err.message);
}
