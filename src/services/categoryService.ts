import { supabase } from '../../lib/supabaseClient';

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .neq('slug', 'fiestas')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data as Category[];
};

export const getAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as Category[];
};

export const createCategory = async (input: Omit<Category, 'id'>) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
};

export const updateCategory = async (id: string, input: Partial<Omit<Category, 'id'>>) => {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};
