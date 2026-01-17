-- Make room_number nullable in customers and orders to support 'ask_room = false'
ALTER TABLE public.customers ALTER COLUMN room_number DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN room_number DROP NOT NULL;
