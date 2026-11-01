import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "../assets/supabase-config.js";

const setupNotice = document.querySelector("#setupNotice");
const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const dashboardMessage = document.querySelector("#dashboardMessage");
const serviceList = document.querySelector("#serviceList");
const signOutButton = document.querySelector("#signOutButton");

if (!isSupabaseConfigured) {
  setupNotice.hidden = false;
  loginView.hidden = true;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const showLogin = (message) => {
    setupNotice.hidden = true;
    loginView.hidden = false;
    dashboardView.hidden = true;
    loginMessage.textContent = message || "";
  };

  const showDashboard = () => {
    setupNotice.hidden = true;
    loginView.hidden = true;
    dashboardView.hidden = false;
  };

  const renderServices = (services) => {
    if (!services.length) {
      serviceList.innerHTML = '<div class="empty-state">No service categories were found.</div>';
      return;
    }
    serviceList.innerHTML = services.map((service) => {
      const slug = escapeHtml(service.slug);
      const title = escapeHtml(service.title);
      const cardDescription = escapeHtml(service.card_description);
      const headline = escapeHtml(service.page_headline);
      const pageDescription = escapeHtml(service.page_description);
      const published = service.is_published ? " checked" : "";
      return '<article class="editor-card"><form class="service-form" data-slug="' + slug + '">' +
        '<header class="editor-title"><h2>' + title + '</h2><label class="status-label"><input name="is_published" type="checkbox"' + published + '> Published</label></header>' +
        '<div class="field-grid">' +
        '<div class="field-full"><label>Service name<input name="title" value="' + title + '" maxlength="80" required></label></div>' +
        '<div class="field-full"><label>Homepage summary<textarea name="card_description" maxlength="280" required>' + cardDescription + '</textarea></label><small class="field-hint">This appears in the service card and navigation.</small></div>' +
        '<div class="field-full"><label>Service page headline<input name="page_headline" value="' + headline + '" maxlength="140" required></label></div>' +
        '<div class="field-full"><label>Service page description<textarea name="page_description" maxlength="600" required>' + pageDescription + '</textarea></label></div>' +
        '</div><div class="save-row"><button class="button" type="submit">Save changes</button><span class="save-status" aria-live="polite"></span></div></form></article>';
    }).join("");
  };

  const loadDashboard = async (user) => {
    dashboardMessage.textContent = "Checking administrator access…";
    const { data: admin, error: adminError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (adminError || !admin) {
      await supabase.auth.signOut();
      showLogin("This account is not approved as a website administrator.");
      return;
    }

    showDashboard();
    dashboardMessage.textContent = "Loading service categories…";
    const { data, error } = await supabase
      .from("services")
      .select("slug,title,card_description,page_headline,page_description,is_published,sort_order")
      .order("sort_order", { ascending: true });
    if (error) {
      dashboardMessage.textContent = "Could not load content: " + error.message;
      return;
    }
    dashboardMessage.textContent = "";
    renderServices(data || []);
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    loginMessage.textContent = "Signing in…";
    const formData = new FormData(loginForm);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")).trim(),
      password: String(formData.get("password"))
    });
    submit.disabled = false;
    if (error) {
      loginMessage.textContent = "Sign in failed. Check the email and password and try again.";
      return;
    }
    loginForm.reset();
    await loadDashboard(data.user);
  });

  serviceList.addEventListener("submit", async (event) => {
    const form = event.target.closest(".service-form");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".save-status");
    const values = new FormData(form);
    button.disabled = true;
    status.textContent = "Saving…";
    const { error } = await supabase.from("services").update({
      title: String(values.get("title")).trim(),
      card_description: String(values.get("card_description")).trim(),
      page_headline: String(values.get("page_headline")).trim(),
      page_description: String(values.get("page_description")).trim(),
      is_published: values.get("is_published") === "on",
      updated_at: new Date().toISOString()
    }).eq("slug", form.dataset.slug);
    button.disabled = false;
    status.textContent = error ? "Save failed. " + error.message : "Saved. Refresh the public site to see changes.";
  });

  signOutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin("You have signed out.");
  });

  supabase.auth.getSession().then(({ data }) => {
    if (data.session) loadDashboard(data.session.user);
  }).catch(() => {});
}
