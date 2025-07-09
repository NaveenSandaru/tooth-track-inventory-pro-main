# Regenerate TypeScript Types

After running the `fix-database.sql` script in your Supabase dashboard, you need to regenerate the TypeScript types to match the new database schema.

## Steps to Regenerate Types:

1. **Run the database fix script first:**
   - Go to your Supabase dashboard: https://supabase.com/dashboard/project/zaizrscurbgnvpvuxzlz
   - Navigate to the SQL Editor
   - Copy and paste the contents of `fix-database.sql` and run it

2. **Generate new TypeScript types:**
   ```bash
   npx supabase gen types typescript --project-id zaizrscurbgnvpvuxzlz --schema public > src/integrations/supabase/types.ts
   ```

3. **Alternative method using the Supabase dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Scroll down to "TypeScript"
   - Copy the generated types and replace the content in `src/integrations/supabase/types.ts`

## What the fix does:

1. **Creates missing base tables:**
   - `suppliers` - for vendor management
   - `inventory_items` - for inventory tracking
   - `inventory_categories` - for organizing inventory

2. **Creates all dependent tables:**
   - `purchase_orders` and `purchase_order_items`
   - `stock_receipts` and `stock_receipt_items`
   - `equipment_assets` and `equipment_maintenance`
   - `inventory_batches` for batch tracking

3. **Sets up proper relationships:**
   - Foreign key constraints between tables
   - Row Level Security (RLS) policies
   - Helper functions for generating IDs

4. **Adds sample data:**
   - Default suppliers
   - Default inventory categories
   - Sample inventory items

## After running the fix:

- The "fail to add" errors should be resolved
- All forms should work properly
- The database will have the correct schema
- TypeScript types will match the actual database structure

## Verification:

After running the fix, you can verify it worked by:
1. Checking that you can add new inventory items
2. Adding new suppliers
3. Creating purchase orders
4. Adding equipment
5. No more "fail to add" error messages 