import { supabase } from '../../lib/supabaseClient';

export interface ProfileData {
  id: string;
  name: string | null;
  email?: string | null;
  phone: string | null;
  location: string | null;
  description: string | null;
  avatar_url: string | null;
  rfc: string | null;
  business_name: string | null;
  fiscal_doc_url: string | null;
  member_since: string | null;
}

export const getProfile = async (userId: string): Promise<ProfileData | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone, location, description, avatar_url, rfc, business_name, fiscal_doc_url, member_since')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileData | null;
};

export const updateProfile = async (
  userId: string,
  patch: Partial<Omit<ProfileData, 'id' | 'email' | 'member_since'>>
) => {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId);
  if (error) throw error;
};

const uploadToProfiles = async (userId: string, file: File, prefix: string): Promise<string> => {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('profiles').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('profiles').getPublicUrl(path);
  return data.publicUrl;
};

export const uploadAvatar = (userId: string, file: File) =>
  uploadToProfiles(userId, file, 'avatar');

export const uploadFiscalDoc = (userId: string, file: File) =>
  uploadToProfiles(userId, file, 'fiscal');
