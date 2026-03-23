export interface Customer {
  id: string;
  name: string;
  country_code: string;
  total_spent: number | null;
  created_at: string | null;
}

export interface FinishedGood {
  id: string;
  sku: string;
  name: string;
  stock: number | null;
  price: number;
  created_at: string | null;
}

export interface Material {
  id: string;
  name: string;
  sku: string;
  quantity: number | null;
  unit: string;
  created_at: string | null;
}

export interface BomItem {
  id: string;
  product_id: string | null;
  material_id: string | null;
  quantity_required: number;
}

export type WorkOrderStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface WorkOrder {
  id: string;
  order_number: string;
  product_id: string | null;
  target_quantity: number;
  status: WorkOrderStatus | null;
  created_by: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export type WorkOrderWithFinishedGood = WorkOrder & {
  finished_goods: Pick<FinishedGood, "name"> | null;
};
