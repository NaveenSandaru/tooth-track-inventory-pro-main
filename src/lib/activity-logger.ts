import { supabase } from "@/integrations/supabase/client";

type ActivityAction = 'Stock Added' | 'Stock Used' | 'New Item Added' | 'Stock Alert' | 'Item Updated' | 'Item Expired' | 'Item Deleted';

/**
 * Log an activity to the activity_log table
 * @param action The type of action performed
 * @param itemId The ID of the inventory item (optional)
 * @param itemName The name of the inventory item
 * @param quantity The quantity involved in the action (optional)
 * @param userName The name of the user who performed the action
 * @returns Promise with the result of the insert operation
 */
export const logActivity = async (
  action: ActivityAction,
  itemName: string,
  userName: string,
  itemId?: string,
  quantity?: string
) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .insert({
        action,
        item_id: itemId || null,
        item_name: itemName,
        quantity: quantity || null,
        user_name: userName
      });

    if (error) {
      console.error("Error logging activity:", error);
    }

    return { data, error };
  } catch (error) {
    console.error("Exception logging activity:", error);
    return { data: null, error };
  }
}; 