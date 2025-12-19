import { supabase } from "@/integrations/supabase/client";

export interface SystemUpdate {
  id: string;
  title: string;
  description: string | null;
  version: string;
  update_type: string;
  is_optional: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolFeature {
  id: string;
  school_id: string;
  update_id: string;
  is_enabled: boolean;
  enabled_at: string | null;
  created_at: string;
  update?: SystemUpdate;
}

// Get all available updates
export const getSystemUpdates = async (): Promise<SystemUpdate[]> => {
  const { data, error } = await supabase
    .from('system_updates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching system updates:', error);
    return [];
  }

  return data || [];
};

// Get school features
export const getSchoolFeatures = async (schoolId: string): Promise<SchoolFeature[]> => {
  const { data, error } = await supabase
    .from('school_features')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    console.error('Error fetching school features:', error);
    return [];
  }

  return data || [];
};

// Enable a feature for a school
export const enableFeature = async (schoolId: string, updateId: string): Promise<boolean> => {
  // Check if feature already exists
  const { data: existing } = await supabase
    .from('school_features')
    .select('id')
    .eq('school_id', schoolId)
    .eq('update_id', updateId)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('school_features')
      .update({ is_enabled: true, enabled_at: new Date().toISOString() })
      .eq('id', existing.id);

    return !error;
  }

  // Create new
  const { error } = await supabase
    .from('school_features')
    .insert({
      school_id: schoolId,
      update_id: updateId,
      is_enabled: true,
      enabled_at: new Date().toISOString()
    });

  return !error;
};

// Disable a feature for a school
export const disableFeature = async (schoolId: string, updateId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('school_features')
    .update({ is_enabled: false, enabled_at: null })
    .eq('school_id', schoolId)
    .eq('update_id', updateId);

  return !error;
};

// Create a new system update (admin only)
export const createSystemUpdate = async (update: {
  title: string;
  description?: string;
  version: string;
  update_type: string;
  is_optional: boolean;
}): Promise<SystemUpdate | null> => {
  const { data, error } = await supabase
    .from('system_updates')
    .insert(update)
    .select()
    .single();

  if (error) {
    console.error('Error creating system update:', error);
    return null;
  }

  return data;
};

// Update a system update
export const updateSystemUpdate = async (
  id: string,
  update: Partial<SystemUpdate>
): Promise<boolean> => {
  const { error } = await supabase
    .from('system_updates')
    .update(update)
    .eq('id', id);

  return !error;
};

// Delete a system update
export const deleteSystemUpdate = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('system_updates')
    .delete()
    .eq('id', id);

  return !error;
};

// Get enabled features for current school
export const getEnabledFeatures = async (schoolId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('school_features')
    .select('update_id')
    .eq('school_id', schoolId)
    .eq('is_enabled', true);

  if (error) {
    console.error('Error fetching enabled features:', error);
    return [];
  }

  return data?.map(f => f.update_id) || [];
};
