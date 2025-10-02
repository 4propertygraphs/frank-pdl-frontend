# Jak aplikovat migrace do tvého Supabase projektu

## Krok za krokem:

1. Otevři tvůj Supabase projekt:
   https://supabase.com/dashboard/project/cuirkrmvnhsiqqeplmdj

2. Jdi do **SQL Editor** (v levém menu)

3. Spusť migrace v tomto pořadí (zkopíruj a spusť každou):

### Migrace 1: Základní tabulky properties a sync
```
Soubor: supabase/migrations/20251001105215_create_properties_and_sync_tables.sql
```

### Migrace 2: RLS policies pro veřejný přístup
```
Soubor: supabase/migrations/20251001105817_fix_rls_policies_for_public_access.sql
```

### Migrace 3: Přidání sloupců do properties
```
Soubor: supabase/migrations/20251001112329_add_missing_columns_to_properties.sql
```

### Migrace 4: Tabulka agencies
```
Soubor: supabase/migrations/20251001143617_create_agencies_table.sql
```

### Migrace 5: RLS pro agencies
```
Soubor: supabase/migrations/20251001145428_fix_agencies_rls_for_anon.sql
```

### Migrace 6: ShareBank storage a tabulky
```
Soubor: supabase/migrations/20251001163957_create_sharebank_storage_and_tables.sql
```

### Migrace 7: RLS pro ShareBank
```
Soubor: supabase/migrations/20251001164536_fix_sharebank_rls_for_anon_users.sql
```

### Migrace 8: Google Drive fields
```
Soubor: supabase/migrations/20251001192752_add_google_drive_fields_to_sharebank.sql
```

### Migrace 9: Reports tabulka
```
Soubor: supabase/migrations/20251001203816_create_reports_table.sql
```

### Migrace 10: Kyra chat historie
```
Soubor: supabase/migrations/20251002081137_create_kyra_chat_history.sql
```

### Migrace 11: Users tabulka
```
Soubor: supabase/migrations/20251002100000_create_users_table.sql
```

## Jak to udělat:
1. Otevři každý soubor v editoru
2. Zkopíruj celý obsah SQL
3. Vlož do SQL Editor v Supabase
4. Klikni "Run"
5. Pokračuj další migrací

## Po dokončení:
- Rebuild aplikaci: `npm run build`
- Přihlášení by mělo fungovat
