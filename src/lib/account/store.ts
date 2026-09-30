import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/catalog/types";
import { mutateLocalDb, readLocalDb } from "@/lib/local-db";
import { authMode } from "@/lib/auth/viewer";
import { sessionSupabase } from "@/lib/supabase/server-client";
import type { MeasurementProfile, SavedAddress } from "./types";

export type ProfileInput = { fullName: string | null; phone: string | null; locale: Locale };
export type AddressInput = Omit<SavedAddress, "id"> & { id?: string };
export type MeasurementProfileInput = Omit<MeasurementProfile, "id" | "updatedAt"> & { id?: string };

/**
 * A signed-in customer's own data. The Supabase backend uses her session, so Row Level
 * Security enforces ownership a second time; every method also filters by userId.
 */
export interface AccountStore {
  updateProfile(userId: string, input: ProfileInput): Promise<void>;
  addresses(userId: string): Promise<SavedAddress[]>;
  saveAddress(userId: string, input: AddressInput): Promise<SavedAddress>;
  deleteAddress(userId: string, id: string): Promise<void>;
  measurementProfiles(userId: string): Promise<MeasurementProfile[]>;
  saveMeasurementProfile(userId: string, input: MeasurementProfileInput): Promise<MeasurementProfile>;
  deleteMeasurementProfile(userId: string, id: string): Promise<void>;
}

type AddressRow = {
  id: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string | null;
  city: string;
  postal_code: string | null;
  region: string | null;
  country: string;
  phone: string | null;
  is_default: boolean;
};

const addressFromRow = (r: AddressRow): SavedAddress => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  line1: r.line1,
  line2: r.line2 ?? undefined,
  city: r.city,
  postalCode: r.postal_code ?? undefined,
  region: r.region ?? undefined,
  country: r.country,
  phone: r.phone,
  isDefault: r.is_default,
});

type ProfileRow = { id: string; name: string; unit: "cm" | "in"; measurements: Record<string, number>; notes: string | null; updated_at: string };
const profileFromRow = (r: ProfileRow): MeasurementProfile => ({
  id: r.id,
  name: r.name,
  unit: r.unit,
  measurements: r.measurements,
  notes: r.notes,
  updatedAt: r.updated_at,
});

class SupabaseAccountStore implements AccountStore {
  constructor(private db: SupabaseClient) {}

  async updateProfile(userId: string, input: ProfileInput) {
    const { error } = await this.db
      .from("profiles")
      .update({ full_name: input.fullName, phone: input.phone, locale: input.locale })
      .eq("id", userId);
    if (error) throw new Error(`Profile update failed: ${error.message}`);
  }

  async addresses(userId: string) {
    const { data, error } = await this.db.from("addresses").select("*").eq("user_id", userId).order("created_at");
    if (error) throw new Error(`Addresses failed: ${error.message}`);
    return (data as AddressRow[]).map(addressFromRow);
  }

  async saveAddress(userId: string, a: AddressInput) {
    // One default per customer (unique index): clear the old one first.
    if (a.isDefault) {
      await this.db.from("addresses").update({ is_default: false }).eq("user_id", userId).eq("is_default", true);
    }
    const row = {
      user_id: userId,
      first_name: a.firstName,
      last_name: a.lastName,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      postal_code: a.postalCode ?? null,
      region: a.region ?? null,
      country: a.country,
      phone: a.phone,
      is_default: a.isDefault,
    };
    const q = a.id
      ? this.db.from("addresses").update(row).eq("id", a.id).eq("user_id", userId)
      : this.db.from("addresses").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) throw new Error(`Address save failed: ${error.message}`);
    return addressFromRow(data as AddressRow);
  }

  async deleteAddress(userId: string, id: string) {
    const { error } = await this.db.from("addresses").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Address delete failed: ${error.message}`);
  }

  async measurementProfiles(userId: string) {
    const { data, error } = await this.db
      .from("measurement_profiles")
      .select("id, name, unit, measurements, notes, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`Measurement profiles failed: ${error.message}`);
    return (data as ProfileRow[]).map(profileFromRow);
  }

  async saveMeasurementProfile(userId: string, p: MeasurementProfileInput) {
    const row = { user_id: userId, name: p.name, unit: p.unit, measurements: p.measurements, notes: p.notes };
    const q = p.id
      ? this.db.from("measurement_profiles").update(row).eq("id", p.id).eq("user_id", userId)
      : this.db.from("measurement_profiles").insert(row);
    const { data, error } = await q.select("id, name, unit, measurements, notes, updated_at").single();
    if (error) throw new Error(`Measurement profile save failed: ${error.message}`);
    return profileFromRow(data as ProfileRow);
  }

  async deleteMeasurementProfile(userId: string, id: string) {
    const { error } = await this.db.from("measurement_profiles").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Measurement profile delete failed: ${error.message}`);
  }
}

function omitUser<T extends { userId: string }>(record: T): Omit<T, "userId"> {
  const { userId, ...rest } = record;
  void userId;
  return rest;
}

class LocalAccountStore implements AccountStore {
  updateProfile(userId: string, input: ProfileInput) {
    return mutateLocalDb((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (u) Object.assign(u, input);
    });
  }

  async addresses(userId: string) {
    return (await readLocalDb()).addresses.filter((a) => a.userId === userId).map(omitUser);
  }

  saveAddress(userId: string, input: AddressInput) {
    return mutateLocalDb((db) => {
      if (input.isDefault) db.addresses.forEach((a) => a.userId === userId && (a.isDefault = false));
      const existing = input.id ? db.addresses.find((a) => a.id === input.id && a.userId === userId) : undefined;
      const record = { ...input, id: existing?.id ?? randomUUID(), userId };
      if (existing) Object.assign(existing, record);
      else db.addresses.push(record);
      return omitUser(record);
    });
  }

  deleteAddress(userId: string, id: string) {
    return mutateLocalDb((db) => {
      db.addresses = db.addresses.filter((a) => !(a.id === id && a.userId === userId));
    });
  }

  async measurementProfiles(userId: string) {
    return (await readLocalDb()).profiles
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(omitUser);
  }

  saveMeasurementProfile(userId: string, input: MeasurementProfileInput) {
    return mutateLocalDb((db) => {
      const existing = input.id ? db.profiles.find((p) => p.id === input.id && p.userId === userId) : undefined;
      const record = { ...input, id: existing?.id ?? randomUUID(), userId, updatedAt: new Date().toISOString() };
      if (existing) Object.assign(existing, record);
      else db.profiles.push(record);
      return omitUser(record);
    });
  }

  deleteMeasurementProfile(userId: string, id: string) {
    return mutateLocalDb((db) => {
      db.profiles = db.profiles.filter((p) => !(p.id === id && p.userId === userId));
    });
  }
}

export async function accountStore(): Promise<AccountStore | null> {
  const mode = authMode();
  if (mode === "supabase") {
    const db = await sessionSupabase();
    return db ? new SupabaseAccountStore(db) : null;
  }
  return mode === "local" ? new LocalAccountStore() : null;
}
