alter table public.guest_notes
  drop constraint guest_notes_message_check,
  add constraint guest_notes_message_check
    check (char_length(btrim(message)) between 1 and 1000);
