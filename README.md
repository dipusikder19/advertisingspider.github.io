# Advertising Spider

Static marketing website hosted with GitHub Pages. Service content can be managed from the protected admin dashboard after connecting a Supabase project.

- Public website: https://dipusikder19.github.io/advertisingspider.github.io/
- Admin area: https://dipusikder19.github.io/advertisingspider.github.io/admin/
- Backend setup: [backend/SETUP.md](backend/SETUP.md)
- Database schema and row-level security: [backend/supabase-schema.sql](backend/supabase-schema.sql)

The Supabase browser config uses only a publishable/anon key protected by database RLS. Never add a Supabase secret/service-role key to this public repository.
