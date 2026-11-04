export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "payment_pending"
  | "verified"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface TrackingDetails {
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  dispatched_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
}

export interface ShippingAddress {
  [key: string]: Json | undefined;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Artwork {
  [key: string]: unknown;
  id: string;
  title: string;
  artist_name: string;
  description: string;
  price: number;
  medium: string;
  dimensions: string;
  image_url: string;
  quantity?: number;
  total_stock?: number;
  is_available: boolean;
  created_at: string;
}


export interface Order {
  [key: string]: unknown;
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress | Json;
  total_amount: number;
  payment_method: string;
  transaction_ref: string | null;
  receipt_url: string | null;
  status: OrderStatus;
  tracking_details?: TrackingDetails | null;
  created_at: string;
}

export interface OrderItem {
  [key: string]: unknown;
  id: string;
  order_id: string;
  artwork_id: string;
  price_at_purchase: number;
}

export interface Database {
  public: {
    Tables: {
      artworks: {
        Row: Artwork;
        Insert: {
          id?: string;
          title: string;
          artist_name: string;
          description?: string | null;
          price: number;
          medium?: string | null;
          dimensions?: string | null;
          image_url: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist_name?: string;
          description?: string | null;
          price?: number;
          medium?: string | null;
          dimensions?: string | null;
          image_url?: string;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: {
          id?: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
          total_amount: number;
          payment_method?: string;
          transaction_ref?: string | null;
          receipt_url?: string | null;
          status?: OrderStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: Json;
          total_amount?: number;
          payment_method?: string;
          transaction_ref?: string | null;
          receipt_url?: string | null;
          status?: OrderStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: {
          id?: string;
          order_id: string;
          artwork_id: string;
          price_at_purchase: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          artwork_id?: string;
          price_at_purchase?: number;
        };
        Relationships: [
          {
            foreignKeyName: string;
            columns: string[];
            isOneToOne?: boolean;
            referencedRelation: string;
            referencedColumns: string[];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
