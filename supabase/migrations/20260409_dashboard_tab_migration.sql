-- Dashboard tab migration: add new columns for Dashboard tab schema
-- contract_usd: USD contract amounts (column R in Dashboard tab)
-- operation_sheet: link to operation sheet (column I in Dashboard tab)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_usd numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS operation_sheet text;
