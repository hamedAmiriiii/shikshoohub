ALTER TABLE `oil_products`
    ADD COLUMN `purchase_price` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `name`,
    ADD COLUMN `sale_price` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `purchase_price`;
