// ─────────────────────────────────────────────
// SkillSnap — Supabase Database Types
// Auto-generate with: npx supabase gen types typescript --project-id <id>
// Keep in sync with schema in supabase/migrations/
// ─────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          avatar_gradient: string;
          avatar_initial: string;
          location: string | null;
          bio: string | null;
          skill: string | null;
          is_verified: boolean;
          jobs_done: number;
          followers_count: number;
          following_count: number;
          post_count: number;
          is_client: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "jobs_done" | "followers_count" | "following_count" | "post_count" | "created_at" | "updated_at"> & {
          jobs_done?: number;
          followers_count?: number;
          following_count?: number;
          post_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: "video" | "photo";
          media_url: string | null;
          thumbnail_url: string | null;
          thumbnail_gradient: string;
          caption: string;
          likes_count: number;
          skill: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["posts"]["Row"], "likes_count" | "created_at" | "updated_at"> & {
          likes_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          url: string;
          type: "video" | "photo";
          order_index: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["post_media"]["Row"], "created_at"> & { order_index?: number };
        Update: Partial<Database["public"]["Tables"]["post_media"]["Insert"]>;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "created_at">;
        Update: never;
      };
      likes: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["likes"]["Row"], "created_at">;
        Update: never;
      };
      saved_posts: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["saved_posts"]["Row"], "created_at">;
        Update: never;
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          last_message_text: string | null;
          last_message_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          unread_count: number;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversation_members"]["Row"], "joined_at"> & { unread_count?: number };
        Update: Partial<Database["public"]["Tables"]["conversation_members"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "created_at">;
        Update: never;
      };
      jobs_done: {
        Row: {
          id: string;
          skiller_id: string;
          client_id: string;
          conversation_id: string | null;
          description: string | null;
          skiller_confirmed: boolean;
          client_confirmed: boolean;
          verified_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["jobs_done"]["Row"], "skiller_confirmed" | "client_confirmed" | "verified_at" | "created_at"> & {
          skiller_confirmed?: boolean;
          client_confirmed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["jobs_done"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "like" | "follow" | "message" | "job_verified";
          from_user_id: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "read" | "created_at"> & { read?: boolean };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
