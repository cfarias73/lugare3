import { supabase } from '../../lib/supabaseClient';
import { Guest } from '../../types';

export interface InvitationRow {
  id: string;
  user_id: string;
  design_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  created_at: string;
  guests?: Guest[];
}

export const createInvitation = async (
  userId: string,
  payload: {
    designId: string;
    eventName: string;
    date: string;
    time: string;
    location: string;
    guests: Guest[];
    coverImage?: string | null;
  }
): Promise<InvitationRow | null> => {
  const insertPayload: any = {
    user_id: userId,
    design_id: payload.designId,
    event_name: payload.eventName,
    event_date: payload.date,
    event_time: payload.time,
    location: payload.location,
    location_text: payload.location,
  };
  if (payload.coverImage) insertPayload.cover_image_url = payload.coverImage;

  const { data: inv, error } = await supabase
    .from('invitations')
    .insert(insertPayload)
    .select('*')
    .single();
  if (error || !inv) {
    console.error('createInvitation error', error?.message || error, error);
    return null;
  }
  if (payload.guests.length > 0) {
    const rows = payload.guests.map((g) => ({
      invitation_id: inv.id,
      name: g.name,
      email: g.email,
    }));
    const { error: gErr } = await supabase.from('invitation_guests').insert(rows);
    if (gErr) console.error('insert guests error', gErr?.message || gErr, gErr);
  }
  return inv;
};

export interface PublicInvitation {
  id: string;
  design_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
}

export const getPublicInvitation = async (id: string): Promise<PublicInvitation | null> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, design_id, event_name, event_date, event_time, location, cover_image_url')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('getPublicInvitation error', error);
    return null;
  }
  return data as PublicInvitation | null;
};

export const listInvitations = async (userId: string): Promise<InvitationRow[]> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, invitation_guests(id, name, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('listInvitations error', error);
    return [];
  }
  return (data || []).map((inv: any) => ({
    ...inv,
    guests: (inv.invitation_guests || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      email: g.email,
    })),
  }));
};
