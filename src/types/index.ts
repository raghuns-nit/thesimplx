export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  category_id: string;
  size: string | null;
  finish: string | null;
  price: number | null;
  unit: string | null;
  stock_quantity: number;
  liquidate_stock: boolean;
  stock_status: string | null;
  image_urls: string[] | null;
  specifications: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  visual_signature: number[] | null;
}

export interface Settings {
  id: number;
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  upi_id: string | null;
  google_review_url: string | null;
  low_stock_threshold: number;
  visual_search_threshold: number;
  visual_search_max_results: number;
  visual_search_color_weight: number;
  visual_search_brightness_weight: number;
  visual_search_texture_weight: number;
  visual_search_variance_weight: number;
  updated_at: string | null;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string;
  assignee: string | null;
  status: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ActivityLog {
  id: string;
  username: string | null;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}
