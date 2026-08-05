ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_menu_categories_is_deleted
  ON menu_categories(is_deleted);

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
