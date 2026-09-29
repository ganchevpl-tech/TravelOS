
-- Leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    phone TEXT,
    email TEXT,
    source_channel TEXT CHECK (source_channel IN ('viber','whatsapp','web','facebook_lead','phone','walk_in','email')),
    intake_notes TEXT,
    conversation_id TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost','unsubscribed')),
    destination TEXT,
    travel_period TEXT,
    pax_adults INT,
    pax_children INT,
    budget_eur NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- For POC: allow all authenticated and anon to read/write (no auth yet)
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    booking_ref TEXT UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    hotel_name TEXT,
    destination TEXT,
    checkin TEXT,
    checkout TEXT,
    nights INT,
    board_type TEXT,
    pax_adults INT DEFAULT 1,
    pax_children INT DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL,
    vendor_cost NUMERIC(10,2),
    margin_pct NUMERIC(5,2),
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'inquiry' CHECK (status IN ('inquiry','offer_sent','confirmed','awaiting_payment','paid','voucher_issued','cancelled','refunded')),
    payment_method TEXT,
    voucher_path TEXT,
    voucher_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
