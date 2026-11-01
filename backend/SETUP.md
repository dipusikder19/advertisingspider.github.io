# Advertising Spider admin backend setup

The site is hosted on GitHub Pages, so it cannot run a private server by itself. This admin area uses Supabase Auth and Postgres. The browser uses only the Supabase project URL and its publishable/anon key; Row Level Security protects the database.

## 1. Create a Supabase project

Create a project in your Supabase account. Keep the database password and any secret/service-role key private.

## 2. Create the tables and security rules

In the Supabase dashboard, open **SQL Editor**, paste the contents of [supabase-schema.sql](./supabase-schema.sql), and run it once. It creates the service content table, administrator allow-list, security policies, and initial four service categories.

## 3. Create the administrator login

In **Authentication → Users**, create a user with your email and a strong password. Copy that user UUID. Then run this in **SQL Editor**, replacing the example UUID:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Only users whose UUID is in `admin_users` can edit content. There is no public sign-up form.

## 4. Connect the website

In **Project Settings → API**, copy the Project URL and the publishable key (older projects may call it the anon/public key). Put them in `assets/supabase-config.js`:

```js
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "YOUR-PUBLISHABLE-OR-ANON-KEY";
```

These two browser values are intended to be public; database access is limited by the RLS policies. **Never put a secret key, service-role key, database password, or administrator password in this file.**

## 5. Set the allowed website URL

In **Authentication → URL Configuration**, set the Site URL to:

`https://dipusikder19.github.io/advertisingspider.github.io/`

Add the same site URL to the allowed redirect URLs. Email/password sign-in does not use a third-party redirect, but this keeps the project URL configuration aligned with the website.

## 6. Deploy and log in

Commit the config file to the repository and wait for the GitHub Pages deployment to succeed. Then open:

`https://dipusikder19.github.io/advertisingspider.github.io/admin/`

Sign in using the email and password created in step 3. The dashboard edits service names, homepage summaries, service-page headlines and descriptions, and whether a category is published. Saved content appears on the public pages after refresh.

## Security notes

- Keep Supabase email/password sign-up disabled for the public website. Create administrators manually in the Supabase dashboard, then allow-list each account UUID in `admin_users`.
- The SQL does not grant browser users permission to create or remove categories or administrator accounts.
- Public visitors can read published service text. Only allow-listed administrator accounts can read drafts or edit it.
