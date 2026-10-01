/*
# Normalize existing product units

1. Data correction
- Updates every existing row in `products` so `unit` is exactly `Sft`.
- This corrects legacy values such as `SQFT` and ensures the admin and public catalog use one consistent label.

2. Data safety
- No products are deleted.
- Product names, prices, images, stock, categories, and all other fields remain unchanged.

3. Future behavior
- The admin product form already uses the approved unit dropdown, with `Sft` as the default.
*/

UPDATE products
SET unit = 'Sft'
WHERE unit IS DISTINCT FROM 'Sft';