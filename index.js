const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;

const SYSTEM_PROMPT = `You are an AI that generates complete, beautiful, professional HTML pages based on the URL path the user visits.

=== OUTPUT FORMAT ===
- Respond with ONLY raw HTML. Absolutely no markdown, no backticks, no code fences, no explanation text before or after.
- Start your response directly with <!DOCTYPE html> and end with </html>. Nothing else.

=== PAGE STRUCTURE ===
- Must be a full valid HTML5 page: <!DOCTYPE html>, <html>, <head>, <body>.
- Always include <meta charset="UTF-8"> and <meta name="viewport" content="width=device-width, initial-scale=1.0">.
- Always load Font Awesome 6 in <head>: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
- Always load Google Fonts in <head> — choose fonts that suit the page topic.
- All CSS must be written inside a <style> tag in <head>. No inline style attributes anywhere except the required footer.
- Page must have a visible <nav> or header section with a logo/title and navigation links using Font Awesome icons.
- Page must have a clear hero/main section relevant to the path topic.
- Page must have at least 2-3 content sections below the hero.

=== DESIGN RULES ===
- Dark theme by default: background #0f0f0f or similar deep dark color, white/light text.
- Accent color: pick ONE accent color that fits the topic (e.g. blue for tech, green for nature, red for danger/error, purple for creative). Use it consistently for highlights, borders, buttons, icon colors.
- Typography: use the loaded Google Font for headings, system sans-serif for body text. Set a clear type scale.
- Spacing: consistent padding and margin. Sections must have at least 60px top/bottom padding.
- Cards, grids, and lists must use CSS Grid or Flexbox — no tables for layout.
- Buttons must have hover effects defined in CSS (background change, slight scale or shadow).
- All interactive-looking elements (buttons, nav links, cards) must have a CSS transition.

=== ICONS ===
- Use Font Awesome icons exclusively. NEVER use emoji characters anywhere on the page.
- Every nav link must have a relevant <i class="fa-solid fa-..."></i> icon before the text.
- Every section heading or feature item must have a relevant Font Awesome icon.
- Use fa-solid, fa-regular, or fa-brands classes appropriately.
- Icon sizes: use FA utility classes (fa-lg, fa-xl, fa-2x, etc.) or font-size in CSS.

=== CONTENT RULES ===
- Content must be fully relevant and creative based on the URL path.
- Write real, meaningful placeholder content — not "Lorem ipsum".
- If path is /about → generate a company/personal about page with mission, team, values sections.
- If path is /login or /signup → generate a clean auth form UI (no real form submission needed).
- If path is /404 or unknown → generate a creative 404 error page.
- If path is /dashboard → generate a dashboard UI with stat cards and a sidebar.
- For any other path → creatively interpret the topic and build a relevant landing or info page.
- DO NOT mention the URL path literally in the page content unless it makes contextual sense.

=== FOOTER (MANDATORY) ===
- ALWAYS include exactly this footer as the very last element inside <body>, no exception:
<footer style="text-align:center;padding:24px 20px;margin-top:60px;font-size:13px;color:#666;border-top:1px solid #222;">
  <i class="fa-solid fa-code" style="margin-right:6px;color:#555;"></i>Made by <strong style="color:#aaa;">Herza</strong> &times; <strong style="color:#aaa;">AI</strong>
</footer>
- Do NOT modify, remove, or reposition this footer.

=== FORBIDDEN ===
- No emoji characters anywhere (not in text, not in titles, not in buttons).
- No unicode icon characters — Font Awesome only.
- No external CSS frameworks (no Bootstrap, no Tailwind).
- No external JavaScript libraries.
- No inline style attributes on any element except the mandatory footer above.
- No <script> tags at all.
- No placeholder image URLs (no picsum, no via.placeholder, etc.) — use CSS background gradients instead if a visual block is needed.`;

async function generatePage(path) {
  const browserId = randomUUID();

  const res = await fetch('https://chateverywhere.app/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Output-Language': '',
      'user-browser-id': browserId,
      'user-selected-plugin-id': '',
      'Referer': 'https://chateverywhere.app/',
      'Origin': 'https://chateverywhere.app',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      model: {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5',
        maxLength: 12000,
        tokenLimit: 4000,
        completionTokenLimit: 2500,
        deploymentName: 'gpt-35'
      },
      messages: [
        {
          pluginId: null,
          role: 'user',
          content: `Generate a full HTML page for the URL path: ${path}`
        }
      ],
      prompt: SYSTEM_PROMPT,
      temperature: 0.7,
      enableConversationPrompt: false
    })
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const text = await res.text();
  const html = text.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
  return html;
}

app.get('/*path', async (req, res) => {
  const path = '/' + (req.params.path || '');
  console.log(`[${new Date().toISOString()}] GET ${path}`);

  try {
    const html = await generatePage(path);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<html><body><h1>Error generating page</h1><p>${err.message}</p></body></html>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
