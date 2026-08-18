export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_media: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string
          expiry_notified_at: string | null
          id: string
          kind: string
          moderation_status: string
          sender_id: string
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at?: string
          expiry_notified_at?: string | null
          id?: string
          kind?: string
          moderation_status?: string
          sender_id: string
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string
          expiry_notified_at?: string | null
          id?: string
          kind?: string
          moderation_status?: string
          sender_id?: string
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_media_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_media_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_media_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_media_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          post_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          cleared_at: string | null
          conversation_id: string
          hidden: boolean | null
          joined_at: string
          unread_count: number
          user_id: string
        }
        Insert: {
          cleared_at?: string | null
          conversation_id: string
          hidden?: boolean | null
          joined_at?: string
          unread_count?: number
          user_id: string
        }
        Update: {
          cleared_at?: string | null
          conversation_id?: string
          hidden?: boolean | null
          joined_at?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_done: {
        Row: {
          client_confirmed: boolean
          client_id: string
          conversation_id: string | null
          created_at: string
          description: string | null
          id: string
          skiller_confirmed: boolean
          skiller_id: string
          verified_at: string | null
        }
        Insert: {
          client_confirmed?: boolean
          client_id: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          skiller_confirmed?: boolean
          skiller_id: string
          verified_at?: string | null
        }
        Update: {
          client_confirmed?: boolean
          client_id?: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          skiller_confirmed?: boolean
          skiller_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_done_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_done_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_done_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_done_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_done_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_done_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_done_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          deleted_at: string | null
          deleted_for_sender: boolean | null
          edited_at: string | null
          id: string
          image_url: string | null
          media_id: string | null
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_sender?: boolean | null
          edited_at?: string | null
          id?: string
          image_url?: string | null
          media_id?: string | null
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_sender?: boolean | null
          edited_at?: string | null
          id?: string
          image_url?: string | null
          media_id?: string | null
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "chat_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_jobs: {
        Row: {
          attempts: number
          chat_media_id: string | null
          created_at: string
          error: string | null
          gcs_object_name: string
          id: string
          kind: string
          operation_name: string
          post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          chat_media_id?: string | null
          created_at?: string
          error?: string | null
          gcs_object_name: string
          id?: string
          kind: string
          operation_name: string
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          chat_media_id?: string | null
          created_at?: string
          error?: string | null
          gcs_object_name?: string
          id?: string
          kind?: string
          operation_name?: string
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_jobs_chat_media_id_fkey"
            columns: ["chat_media_id"]
            isOneToOne: false
            referencedRelation: "chat_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "moderation_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_scans: {
        Row: {
          adult: string | null
          chat_media_id: string | null
          created_at: string
          error: string | null
          frames_scanned: number
          id: string
          pornography_likelihood: string | null
          post_id: string | null
          profile_id: string | null
          provider: string
          racy: string | null
          raw: Json | null
          verdict: string
        }
        Insert: {
          adult?: string | null
          chat_media_id?: string | null
          created_at?: string
          error?: string | null
          frames_scanned?: number
          id?: string
          pornography_likelihood?: string | null
          post_id?: string | null
          profile_id?: string | null
          provider?: string
          racy?: string | null
          raw?: Json | null
          verdict: string
        }
        Update: {
          adult?: string | null
          chat_media_id?: string | null
          created_at?: string
          error?: string | null
          frames_scanned?: number
          id?: string
          pornography_likelihood?: string | null
          post_id?: string | null
          profile_id?: string | null
          provider?: string
          racy?: string | null
          raw?: Json | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_scans_chat_media_id_fkey"
            columns: ["chat_media_id"]
            isOneToOne: false
            referencedRelation: "chat_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_scans_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "moderation_scans_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_scans_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_scans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_scans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_scans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          order_index: number
          post_id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          post_id: string
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          post_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string
          comments_count: number
          comments_disabled: boolean
          created_at: string
          id: string
          likes_count: number
          location: string | null
          media_url: string | null
          moderation_status: string
          recommend_count: number
          saved_count: number
          skill: string | null
          text_overlays: Json | null
          thumbnail_gradient: string
          thumbnail_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          caption?: string
          comments_count?: number
          comments_disabled?: boolean
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          media_url?: string | null
          moderation_status?: string
          recommend_count?: number
          saved_count?: number
          skill?: string | null
          text_overlays?: Json | null
          thumbnail_gradient?: string
          thumbnail_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          caption?: string
          comments_count?: number
          comments_disabled?: boolean
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          media_url?: string | null
          moderation_status?: string
          recommend_count?: number
          saved_count?: number
          skill?: string | null
          text_overlays?: Json | null
          thumbnail_gradient?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_waitlist: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pro_waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_gradient: string
          avatar_initial: string
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          business_address: string | null
          created_at: string
          display_name: string
          email: string | null
          expo_push_token: string | null
          followers_count: number
          following_count: number
          happy_percent: number
          id: string
          is_client: boolean
          is_early_bird: boolean | null
          is_verified: boolean
          jobs_done: number
          lat: number | null
          lat_public: number | null
          lng: number | null
          lng_public: number | null
          location: string | null
          location_display_type: string
          location_private: boolean
          notify_connections: boolean | null
          notify_email_follows: boolean | null
          notify_email_messages: boolean | null
          notify_email_moderation: boolean
          notify_email_weekly: boolean | null
          notify_follows: boolean | null
          notify_jobs: boolean | null
          notify_messages: boolean | null
          onboarding_completed_at: string | null
          pending_skill: string | null
          pending_skill_decided_at: string | null
          pending_skill_status: string | null
          pending_skill_submitted_at: string | null
          post_count: number
          rating_count: number
          role: string | null
          skill: string | null
          updated_at: string
          username: string
        }
        Insert: {
          availability?: string | null
          avatar_gradient?: string
          avatar_initial?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_address?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          expo_push_token?: string | null
          followers_count?: number
          following_count?: number
          happy_percent?: number
          id: string
          is_client?: boolean
          is_early_bird?: boolean | null
          is_verified?: boolean
          jobs_done?: number
          lat?: number | null
          lat_public?: number | null
          lng?: number | null
          lng_public?: number | null
          location?: string | null
          location_display_type?: string
          location_private?: boolean
          notify_connections?: boolean | null
          notify_email_follows?: boolean | null
          notify_email_messages?: boolean | null
          notify_email_moderation?: boolean
          notify_email_weekly?: boolean | null
          notify_follows?: boolean | null
          notify_jobs?: boolean | null
          notify_messages?: boolean | null
          onboarding_completed_at?: string | null
          pending_skill?: string | null
          pending_skill_decided_at?: string | null
          pending_skill_status?: string | null
          pending_skill_submitted_at?: string | null
          post_count?: number
          rating_count?: number
          role?: string | null
          skill?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          availability?: string | null
          avatar_gradient?: string
          avatar_initial?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_address?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          expo_push_token?: string | null
          followers_count?: number
          following_count?: number
          happy_percent?: number
          id?: string
          is_client?: boolean
          is_early_bird?: boolean | null
          is_verified?: boolean
          jobs_done?: number
          lat?: number | null
          lat_public?: number | null
          lng?: number | null
          lng_public?: number | null
          location?: string | null
          location_display_type?: string
          location_private?: boolean
          notify_connections?: boolean | null
          notify_email_follows?: boolean | null
          notify_email_messages?: boolean | null
          notify_email_moderation?: boolean
          notify_email_weekly?: boolean | null
          notify_follows?: boolean | null
          notify_jobs?: boolean | null
          notify_messages?: boolean | null
          onboarding_completed_at?: string | null
          pending_skill?: string | null
          pending_skill_decided_at?: string | null
          pending_skill_status?: string | null
          pending_skill_submitted_at?: string | null
          post_count?: number
          rating_count?: number
          role?: string | null
          skill?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          job_id: string
          rater_id: string
          rating: string
          skiller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id: string
          rater_id: string
          rating: string
          skiller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rater_id?: string
          rating?: string
          skiller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_done"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_skiller_id_fkey"
            columns: ["skiller_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_id: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "visible_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      username_history: {
        Row: {
          changed_at: string
          id: number
          old_username: string
          profile_id: string
        }
        Insert: {
          changed_at?: string
          id?: never
          old_username: string
          profile_id: string
        }
        Update: {
          changed_at?: string
          id?: never
          old_username?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "username_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      moderation_queue: {
        Row: {
          adult: string | null
          caption: string | null
          created_at: string | null
          display_name: string | null
          frames_scanned: number | null
          media_url: string | null
          post_id: string | null
          racy: string | null
          scan_error: string | null
          scanned_at: string | null
          thumbnail_url: string | null
          type: string | null
          username: string | null
        }
        Relationships: []
      }
      pending_skill_queue: {
        Row: {
          display_name: string | null
          pending_skill: string | null
          pending_skill_status: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          display_name?: string | null
          pending_skill?: string | null
          pending_skill_status?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          display_name?: string | null
          pending_skill?: string | null
          pending_skill_status?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      visible_posts: {
        Row: {
          author_id: string | null
          caption: string | null
          comments_count: number | null
          comments_disabled: boolean | null
          created_at: string | null
          id: string | null
          likes_count: number | null
          location: string | null
          media_url: string | null
          recommend_count: number | null
          saved_count: number | null
          skill: string | null
          text_overlays: Json | null
          thumbnail_gradient: string | null
          thumbnail_url: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          comments_count?: number | null
          comments_disabled?: boolean | null
          created_at?: string | null
          id?: string | null
          likes_count?: number | null
          location?: string | null
          media_url?: string | null
          recommend_count?: number | null
          saved_count?: number | null
          skill?: string | null
          text_overlays?: Json | null
          thumbnail_gradient?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          comments_count?: number | null
          comments_disabled?: boolean | null
          created_at?: string | null
          id?: string | null
          likes_count?: number | null
          location?: string | null
          media_url?: string | null
          recommend_count?: number | null
          saved_count?: number | null
          skill?: string | null
          text_overlays?: Json | null
          thumbnail_gradient?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pending_skill_queue"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "visible_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visible_profiles: {
        Row: {
          availability: string | null
          avatar_gradient: string | null
          avatar_initial: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          business_address: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number | null
          following_count: number | null
          happy_percent: number | null
          id: string | null
          is_client: boolean | null
          is_early_bird: boolean | null
          is_verified: boolean | null
          jobs_done: number | null
          lat: number | null
          lng: number | null
          location: string | null
          location_display_type: string | null
          location_private: boolean | null
          post_count: number | null
          rating_count: number | null
          role: string | null
          skill: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          availability?: string | null
          avatar_gradient?: string | null
          avatar_initial?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_address?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          happy_percent?: number | null
          id?: string | null
          is_client?: boolean | null
          is_early_bird?: boolean | null
          is_verified?: boolean | null
          jobs_done?: number | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_display_type?: string | null
          location_private?: boolean | null
          post_count?: number | null
          rating_count?: number | null
          role?: string | null
          skill?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          availability?: string | null
          avatar_gradient?: string | null
          avatar_initial?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_address?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          happy_percent?: number | null
          id?: string | null
          is_client?: boolean | null
          is_early_bird?: boolean | null
          is_verified?: boolean | null
          jobs_done?: number | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_display_type?: string | null
          location_private?: boolean | null
          post_count?: number | null
          rating_count?: number | null
          role?: string | null
          skill?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_conversation_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_pending_skill: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      approve_post: { Args: { target_post_id: string }; Returns: undefined }
      auth_providers_for_email: {
        Args: { target_email: string }
        Returns: string[]
      }
      blocked_user_ids: { Args: never; Returns: string[] }
      change_username: { Args: { new_username: string }; Returns: string }
      claim_early_bird: { Args: { user_id: string }; Returns: boolean }
      claim_moderation_jobs: {
        Args: { batch_size: number; stale_after?: string }
        Returns: {
          attempts: number
          chat_media_id: string | null
          created_at: string
          error: string | null
          gcs_object_name: string
          id: string
          kind: string
          operation_name: string
          post_id: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "moderation_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      clear_conversation: {
        Args: { target_conversation_id: string }
        Returns: undefined
      }
      coarsen_coord: { Args: { value: number }; Returns: number }
      conversation_member_count: { Args: { conv_id: string }; Returns: number }
      create_conversation: { Args: never; Returns: string }
      current_user_has_password: { Args: never; Returns: boolean }
      delete_own_post: { Args: { target_post_id: string }; Returns: string[] }
      delete_rows_for_user: {
        Args: {
          candidate_columns: string[]
          target_schema: string
          target_table: string
          target_user_id: string
        }
        Returns: undefined
      }
      delete_user_account: {
        Args: { target_user_id: string }
        Returns: string[]
      }
      find_existing_conversation: {
        Args: { p_participant_id: string }
        Returns: string
      }
      get_gcp_moderation_key: { Args: never; Returns: string }
      get_my_location: {
        Args: never
        Returns: {
          lat: number
          lng: number
        }[]
      }
      get_my_threads: {
        Args: never
        Returns: {
          conversation_id: string
          last_message_at: string
          last_message_text: string
          unread_count: number
        }[]
      }
      get_own_coordinates: {
        Args: never
        Returns: {
          lat: number
          lng: number
        }[]
      }
      get_own_email: { Args: never; Returns: string }
      get_own_notification_prefs: {
        Args: never
        Returns: {
          notify_connections: boolean
          notify_email_follows: boolean
          notify_email_messages: boolean
          notify_email_moderation: boolean
          notify_email_weekly: boolean
          notify_follows: boolean
          notify_jobs: boolean
          notify_messages: boolean
        }[]
      }
      get_thread_participants: {
        Args: { p_conversation_ids: string[] }
        Returns: {
          avatar_gradient: string
          avatar_initial: string
          avatar_url: string
          conversation_id: string
          display_name: string
          followers_count: number
          is_verified: boolean
          jobs_done: number
          location: string
          skill: string
          user_id: string
          username: string
        }[]
      }
      guard_delete_user_account_caller: { Args: never; Returns: undefined }
      has_completed_onboarding: { Args: never; Returns: boolean }
      hide_conversation: {
        Args: { target_conversation_id: string }
        Returns: undefined
      }
      is_blocked_with: { Args: { other_id: string }; Returns: boolean }
      is_chat_folder_member: { Args: { folder: string }; Returns: boolean }
      is_conversation_member: { Args: { conv_id: string }; Returns: boolean }
      message_preview_text: {
        Args: { m: Database["public"]["Tables"]["messages"]["Row"] }
        Returns: string
      }
      notify_auth_change: {
        Args: { _endpoint: string; _payload: Json }
        Returns: undefined
      }
      notify_credential_change: {
        Args: {
          edge_function: string
          previous_email?: string
          target_user_id: string
        }
        Returns: undefined
      }
      post_comments_disabled: {
        Args: { target_post_id: string }
        Returns: boolean
      }
      recalc_happy_percent: { Args: { target: string }; Returns: undefined }
      recommend_post: { Args: { target_post_id: string }; Returns: number }
      refresh_conversation_preview: {
        Args: { conv_id: string }
        Returns: undefined
      }
      reject_pending_skill: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      reject_post: { Args: { target_post_id: string }; Returns: undefined }
      resolve_handle: {
        Args: { handle: string }
        Returns: {
          is_current: boolean
          profile_id: string
        }[]
      }
      send_daily_moderation_summary: { Args: never; Returns: undefined }
      send_skill_push: {
        Args: {
          body: string
          notification_type: string
          target_user_id: string
          title: string
        }
        Returns: undefined
      }
      set_post_like: {
        Args: { liked: boolean; target_post_id: string }
        Returns: number
      }
      set_post_saved: {
        Args: { saved: boolean; target_post_id: string }
        Returns: number
      }
      shares_conversation_with: { Args: { other_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      skill_review_admin_id: { Args: never; Returns: string }
      skill_reviewer_id: { Args: never; Returns: string }
      submit_pending_skill: {
        Args: { requested_skill: string }
        Returns: undefined
      }
      unfollow_both_ways: {
        Args: { other_user_id: string }
        Returns: undefined
      }
      username_change_available_at: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
