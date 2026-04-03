import { createClient } from "./supabase/server";

export async function verifyToken(token: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("Token verification failed:", error);
      return null;
    }
    
    return { userId: user.id, email: user.email };
  } catch (e) {
    console.error("Token verification failed:", e);
    return null;
  }
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  
  return user;
}
