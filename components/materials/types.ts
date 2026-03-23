import type { Material } from "@/types/database";

export type MaterialRecord = Omit<Material, "quantity"> & {
  quantity: number;
};
