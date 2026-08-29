ALTER TABLE `produced_goods`
    ADD COLUMN `original_sale_price` DECIMAL(15,2) NULL AFTER `sale_price`;

CREATE TABLE `category_produced_good` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `produced_good_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `category_produced_good_unique` (`category_id`, `produced_good_id`),
    KEY `category_produced_good_produced_good_id_index` (`produced_good_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
