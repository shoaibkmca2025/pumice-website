# Pumice Auto Parking — website

A static, Apple-style rebuild of pumiceautoparking.com. Plain HTML, CSS and a little JavaScript: no frameworks, no build step, no web fonts.

## Files

| File | Page |
| --- | --- |
| `index.html` | Home: full-screen split hero (tower parking photo), product tiles and a scrollable lineup of all 11 systems, animated stacker demo, "Why go vertical", "Built for", how we work with factory photos, installations, presence and stats |
| `systems.html` | "Which system fits?" chooser, all 11 parking systems with specs, shared specifications and a comparison table |
| `about.html` | Company profile, factory, leadership (Prashant Patil), vision and mission |
| `gallery.html` | Installation and factory photos, with a full-screen photo viewer |
| `contact.html` | Enquiry form, phone, WhatsApp, email and the three office addresses |
| `images/` | All images, compressed to WebP. `tower-*`, `basement-*`, `curved-*`, `spiral-*` and `night-*` are the new HD stock photos (see Photo credits); `images/t/` holds 480 px gallery thumbnails |
| `sitemap.xml`, `robots.txt` | For search engines (they assume the site lives at https://pumiceautoparking.com/) |

Each page carries its own CSS in the `<head>`, so every page loads in a single request plus its images. Images further down a page load only when the visitor scrolls to them. The shared part of that CSS, the header and the footer are the same on every page, so a change to them has to be made in all five files.

The header follows the old site's menu: a top bar with e-mail support and phone, then Home, About Us (About Pumice, Our CEO), Our Products (all 11 systems), Gallery (Product Gallery, Factory Gallery) and Contact Us. On phones it becomes a full-screen menu with expandable groups.

Lighthouse (mobile, throttled, served with gzip as on a normal host): Performance 96–100, Accessibility, Best Practices and SEO 100 on every page.

## Put it online

Upload the whole folder as it is to any static host, keeping the file names:

- **cPanel / shared hosting:** upload the contents into `public_html`.
- **Netlify, Vercel or Cloudflare Pages:** drag the folder in, or deploy it from a Git repository.

`index.html` is the home page, so the site works at the domain root.

## Before going live

1. **Enquiry form.** The form opens the visitor's email app with the enquiry filled in, addressed to info@pumiceautoparking.com. To receive enquiries directly instead, open `contact.html`, find `var FORM_ENDPOINT = '';` near the bottom and paste in an endpoint from a form service (for example Formspree or Web3Forms) or your own server.
2. **Social links.** The old site's Facebook, Twitter and YouTube icons had no links, so they are left out. Add them to the footer once you have the real URLs.
3. **Photos.** The home page now shows Pumice's own installation photos. `images/pg1.webp` to `pg7.webp` (which look like supplier or stock images) are no longer used by any page; delete them, or confirm Pumice has the rights before using them again.
4. **WhatsApp button.** Every page has a floating WhatsApp button for +91 86554 36851. Change the `wa.me` number in each page's footer if enquiries should go elsewhere.
5. **Stock photos.** The page heroes and a few section images are free stock photos of parking systems and car parks, not Pumice installations, so they are never captioned as Pumice work. Replace them with the client's own HD photos whenever those are available, keeping the same file names and proportions.
6. **Caching.** Set long cache headers for `images/` on the host (for example one year). Lighthouse's only remaining suggestions are about caching and about serving smaller gallery images to phones.
7. **Figures to confirm.** The stats (500 clients, 476 projects, 260 employees, 20 awards) and a few specs carried over from the old site (cantilever capacity, "four pallets" on the double-pit system, puzzle lift and slide times) should be checked with the client.

## Editing

- Text is plain HTML: open a page in any editor and change the words.
- Colours are CSS variables at the top of each page's `<style>`: text `#1D1D1F` (`--ink`) and `#6E6E73` (`--ink3`), light grey `#F5F5F7` (`--bg2`) for alternate sections and cards, brand blue `#0070C9` (`--blue`, buttons and links, 5:1 contrast on white), and the logo's sky blue `#36B7FB` (`--sky`) used only on dark backgrounds. The navigation, menus and footer text follow the same set.
- To swap an image, replace the file in `images/` with one of the same name, or change the `src` in the page.
- Animations respect the visitor's "reduce motion" setting: the hero demo then shows its final state and nothing slides in. Blocks marked `rv` fade in once as they scroll into view; without JavaScript they are simply shown.

## Photo credits

Free stock photos, used under the [Unsplash License](https://unsplash.com/license) and the [Pexels License](https://www.pexels.com/license/) (commercial use allowed, no attribution required; credited here as good practice):

| File | Photo | Photographer |
| --- | --- | --- |
| `tower-*.webp` | [A tall tower of cars](https://unsplash.com/photos/a-tall-tower-of-cars-in-a-parking-lot-nFZvSbHYeUA) (Unsplash) | Tom Ru |
| `basement-*.webp` | [Modern underground parking garage](https://unsplash.com/photos/modern-underground-parking-garage-with-parked-cars-and-elevators-HfSJz23_BOM) (Unsplash) | Aalo Lens |
| `curved-*.webp` | [Car parked on multi level parking lot](https://www.pexels.com/photo/car-parked-on-multi-level-parking-lot-17809396/) (Pexels) | Blue Arauz |
| `spiral-*.webp` | [Multistory parking with curvy ramp](https://www.pexels.com/photo/multistory-parking-with-curvy-ramp-7465126/) (Pexels) | David Selbert |
| `night-*.webp` | [Urban parking garage at night](https://www.pexels.com/photo/urban-parking-garage-at-night-in-houston-31570332/) (Pexels) | Ian Findley |
