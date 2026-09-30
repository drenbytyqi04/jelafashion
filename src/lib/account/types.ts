import type { Locale } from "@/lib/catalog/types";
import type { Address } from "@/lib/commerce/types";
import type { Unit } from "@/lib/units";

export type Role = "customer" | "admin";

/** The signed-in person, as every server check sees them. */
export type Viewer = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  locale: Locale;
  role: Role;
};

export type SavedAddress = Address & { id: string; phone: string | null; isDefault: boolean };

export type MeasurementProfile = {
  id: string;
  name: string;
  unit: Unit;
  /** cm, keyed by measurement id */
  measurements: Record<string, number>;
  notes: string | null;
  updatedAt: string;
};
