import { supabase } from "@/integrations/supabase/client";
import type { Offer } from "./tokens";

// ── Leads ──────────────────────────────────────────────

export async function insertLead(data: {
  name?: string;
  phone?: string;
  source_channel: string;
  intake_notes?: string;
  destination?: string;
  travel_period?: string;
  pax_adults?: number;
  budget_eur?: number;
}) {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      name: data.name ?? null,
      phone: data.phone ?? null,
      source_channel: data.source_channel,
      intake_notes: data.intake_notes ?? null,
      destination: data.destination ?? null,
      travel_period: data.travel_period ?? null,
      pax_adults: data.pax_adults ?? null,
      budget_eur: data.budget_eur ?? null,
      status: "new",
    })
    .select()
    .single();

  if (error) throw error;
  return lead;
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw error;
}

// ── Bookings ───────────────────────────────────────────

export async function insertBooking(data: {
  lead_id?: string;
  booking_ref: string;
  client_name: string;
  client_phone?: string;
  offer: Offer;
}) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      lead_id: data.lead_id ?? null,
      booking_ref: data.booking_ref,
      client_name: data.client_name,
      client_phone: data.client_phone ?? null,
      hotel_name: data.offer.hotel,
      destination: data.offer.destination,
      checkin: data.offer.checkin,
      checkout: data.offer.checkout,
      nights: data.offer.nights,
      board_type: data.offer.board,
      pax_adults: data.offer.adults,
      total_price: data.offer.price_total,
      vendor_cost: data.offer.vendor_cost * data.offer.adults,
      margin_pct: data.offer.margin,
      status: "offer_sent",
    })
    .select()
    .single();

  if (error) throw error;
  return booking;
}

export async function updateBookingStatus(bookingRef: string, status: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("booking_ref", bookingRef);
  if (error) throw error;
}

// ── Real-time subscriptions ────────────────────────────

export function subscribeToLeads(callback: (payload: any) => void) {
  return supabase
    .channel("leads-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, callback)
    .subscribe();
}

export function subscribeToBookings(callback: (payload: any) => void) {
  return supabase
    .channel("bookings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, callback)
    .subscribe();
}
