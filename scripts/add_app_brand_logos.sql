-- Cria tabela para múltiplas logos da bandeira (Mai Drive)
CREATE TABLE IF NOT EXISTS app_brand_logos (
  id TEXT PRIMARY KEY,
  app_brand_id TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT app_brand_logos_app_brand_id_fkey
    FOREIGN KEY (app_brand_id)
    REFERENCES app_brands(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS app_brand_logos_app_brand_id_is_active_idx
  ON app_brand_logos(app_brand_id, is_active);

CREATE INDEX IF NOT EXISTS app_brand_logos_app_brand_id_sort_order_idx
  ON app_brand_logos(app_brand_id, sort_order);

-- Backfill: cria um item ativo a partir da logo antiga, quando existir.
INSERT INTO app_brand_logos (
  id,
  app_brand_id,
  logo_url,
  label,
  is_active,
  sort_order
)
SELECT
  lower(hex(randomblob(16))),
  b.id,
  b.logo,
  'Logo principal',
  true,
  0
FROM app_brands b
WHERE b.logo IS NOT NULL
  AND trim(b.logo) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM app_brand_logos l
    WHERE l.app_brand_id = b.id
  );
