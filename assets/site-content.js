import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "./supabase-config.js";

if (isSupabaseConfigured) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const getSlugFromHref = (href) => {
    const match = href && href.match(/services\/([^/]+)\//);
    return match ? match[1] : null;
  };

  const loadPublishedServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("slug,title,card_description,page_headline,page_description,sort_order")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return;
    const services = new Map(data.map((service) => [service.slug, service]));

    document.querySelectorAll(".service-card").forEach((card) => {
      const service = services.get(getSlugFromHref(card.getAttribute("href")));
      if (!service) {
        card.hidden = true;
        return;
      }
      const title = card.querySelector("h3");
      const description = card.querySelector("p");
      const link = card.querySelector(".service-link");
      if (title) title.textContent = service.title;
      if (description) description.textContent = service.card_description;
      if (link) link.firstChild.textContent = "Explore " + service.title + " ";
    });

    document.querySelectorAll(".service-menu a").forEach((link) => {
      const slug = getSlugFromHref(link.getAttribute("href"));
      if (!slug) return;
      const service = services.get(slug);
      if (!service) {
        link.hidden = true;
        return;
      }
      const title = link.querySelector("span");
      const description = link.querySelector("small");
      if (title) title.textContent = service.title;
      if (description) description.textContent = service.card_description;
    });

    const pageMatch = window.location.pathname.match(/\/services\/([^/]+)\/?(?:index\.html)?$/);
    if (pageMatch) {
      const service = services.get(pageMatch[1]);
      if (!service) {
        const main = document.querySelector("main");
        if (main) {
          main.innerHTML = '<section class="section"><div class="shell"><h1>Service unavailable</h1><p>This service is not currently published.</p><a href="../../#services">Back to all services</a></div></section>';
        }
        return;
      }
      const title = document.querySelector(".service-copy h1");
      const description = document.querySelector(".service-copy .lead");
      const breadcrumb = document.querySelector('.breadcrumb [aria-current="page"]');
      if (title) title.textContent = service.page_headline;
      if (description) description.textContent = service.page_description;
      if (breadcrumb) breadcrumb.textContent = service.title;
    }
  };

  loadPublishedServices().catch(() => {});
}
