# Nastavení Supabase pro produkci

## Krok 1: Vytvoř Supabase projekt
1. Jdi na https://supabase.com
2. Vytvoř nový projekt
3. Poznamenej si:
   - Project URL (např. https://xxxxx.supabase.co)
   - Anon/Public key

## Krok 2: Aktualizuj .env soubor
Nahraď hodnoty v .env:

```
VITE_SUPABASE_URL=tvoje-supabase-url
VITE_SUPABASE_ANON_KEY=tvoje-anon-key
```

## Krok 3: Aplikuj migrace
Všechny migrace jsou v `supabase/migrations/`

V Supabase Dashboard:
1. Jdi do SQL Editor
2. Spusť každou migraci v pořadí (podle timestamp v názvu):
   - 20251001105215_create_properties_and_sync_tables.sql
   - 20251001105817_fix_rls_policies_for_public_access.sql
   - atd...

## Krok 4: Nastav Storage (pro ShareBank)
1. V Supabase Dashboard > Storage
2. Vytvořený bucket "sharebank" už by měl existovat z migrace
3. Zkontroluj RLS policies

## Krok 5: Edge Functions
Pokud používáš edge functions:
```bash
supabase functions deploy fetch-xml-proxy
supabase functions deploy google-drive-upload
```

## Důležité
- Bolt databáze funguje POUZE v Bolt prostředí
- Pro vlastní doménu MUSÍŠ mít vlastní Supabase projekt
- Klíče NIKDY nedávej do veřejného gitu
