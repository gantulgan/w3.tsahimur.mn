#!/usr/bin/env python3
"""Builds the static site from src/ templates.

Usage:  python3 src/build.py

- Page templates live in src/pages, shared parts in src/partials.
- All copy lives in src/strings.py (English + Mongolian).
- In templates, an empty element with t="key" gets data-i18n="key" and the English text;
  site.js swaps in Mongolian when the visitor switches language.
- Output: index.html, services/, solutions/, about/, contact/, 404.html and assets/js/i18n.js
"""
import json, os, re, sys, time

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
sys.path.insert(0, SRC)
from strings import EN, MN  # noqa: E402

missing = sorted(set(EN) - set(MN))
if missing:
    print('warning: missing Mongolian strings:', ', '.join(missing))

VER = time.strftime('%Y%m%d%H%M')
MARK = ('<g fill="none" stroke="#8636DF" stroke-width="70" stroke-linecap="round" stroke-linejoin="round">'
        '<polyline points="358,86 504,226 646,366 776,228"/><polyline points="646,366 512,500 380,640 228,500 86,362"/></g>'
        '<g fill="#8636DF"><circle cx="358" cy="86" r="82"/><circle cx="504" cy="226" r="84"/><circle cx="646" cy="366" r="82"/>'
        '<circle cx="776" cy="228" r="84"/><circle cx="512" cy="500" r="84"/><circle cx="380" cy="640" r="88"/>'
        '<circle cx="228" cy="500" r="82"/><circle cx="86" cy="362" r="80"/></g>'
        '<g fill="#D8D7DC"><circle cx="222" cy="224" r="76"/><circle cx="358" cy="356" r="78"/></g>')
ARROW = ('<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11L11 3M5 3h6v6" stroke="currentColor" '
         'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')

def read(*p):
    with open(os.path.join(SRC, *p), encoding='utf-8') as f:
        return f.read()

# ---------- generated blocks ----------
def strip(hidden=False):
    items = ''.join('<span t="strip%d"></span><b>●</b>' % i for i in range(1, 9))
    return '<span%s style="display:inline-flex;gap:56px;align-items:center;padding-right:56px">%s</span>' % (' aria-hidden="true"' if hidden else '', items)

def service_cards():
    out = []
    for i in range(1, 7):
        if i == 6:
            out.append('      <a class="card pad feature" data-stagger href="/services/#s6" style="min-height:300px">'
                       '<span class="mono" style="font-size:13px;color:#EBDDFF" t="svc6_badge"></span>'
                       '<h3 class="h3" t="svc6_t"></h3><p style="margin:0;font-size:16px;line-height:1.65;color:#F1E9FF" t="svc6_d"></p>'
                       '<span style="margin-top:auto;font-weight:600;font-size:15px" t="learn_more"></span></a>')
        else:
            out.append('      <a class="card pad" data-stagger href="/services/#s%d" style="min-height:300px">'
                       '<span class="mono ac" style="font-size:13px">0%d</span><h3 class="h3" t="svc%d_t"></h3>'
                       '<p class="body" t="svc%d_d"></p><span class="arrow-link" style="margin-top:auto" t="learn_more"></span></a>' % (i, i, i, i))
    return '\n'.join(out)

STACKS = {
    1: ['Solution architecture', 'Enterprise architecture', 'Roadmaps', 'Audits'],
    2: ['.NET', 'Java · Spring Boot', 'Node.js', 'Nuxt · Vue', 'Angular', 'PostgreSQL', 'MS SQL'],
    3: ['Refactoring', 'Data migration', 'CMS', 'Cloud migration'],
    4: ['Remittance', 'Payment gateways', 'Webhooks', 'Security'],
    5: ['CTO / CIO', 'Scrum', 'DevOps', 'Governance'],
    6: ['ESL', 'POS / ERP', 'Automation', 'SaaS'],
}

def service_rows():
    out = []
    for i in range(1, 7):
        gets = ''.join('<li><span class="dot"></span><span t="sv%d_g%d"></span></li>' % (i, g) for g in range(1, 5))
        chips = ''.join('<span class="chip">%s</span>' % c for c in STACKS[i])
        out.append('''    <article id="s%d" class="svc-row" data-stagger>
      <div style="display:flex;flex-direction:column;gap:20px">
        <span class="svc-num" aria-hidden="true">0%d</span>
        <h2 class="h3" style="font-size:34px;line-height:1.12%s" t="svc%d_t"></h2>
        <p class="lead" style="font-size:17px" t="sv%d_who"></p>
      </div>
      <div style="display:flex;flex-direction:column;gap:28px">
        <div class="foot-label" t="sv_get"></div>
        <ul class="list" style="gap:14px;font-size:17px">%s</ul>
        <div style="display:flex;flex-wrap:wrap;gap:8px">%s</div>
      </div>
    </article>''' % (i, i, ';color:var(--signal)' if i == 6 else '', i, i, gets, chips))
    return '\n'.join(out)

ICONS = [
    '<path d="M10 14h20M24 8l6 6-6 6M30 30H10M16 24l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<rect x="6" y="10" width="28" height="20" rx="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M6 16h28M11 24h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M8 14l3-6h18l3 6M8 14v18h24V14M8 14h24M17 32v-8h6v8" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    '<path d="M6 32h28M9 32V18M16 32V18M24 32V18M31 32V18M5 18l15-10 15 10z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    '<path d="M20 30v-8M13 14a10 10 0 0 1 14 0M9 10a16 16 0 0 1 22 0M17 18a4 4 0 0 1 6 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="22" r="2" fill="currentColor"/>',
    '<path d="M6 30l8-9 6 5 12-14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 34h28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
]

def industry_cards():
    out = []
    for i in range(1, 7):
        items = ''.join('<li><span class="dot"></span><span t="in%d_%d"></span></li>' % (i, k) for k in range(1, 5))
        out.append('''    <article class="card pad hov" data-stagger style="padding:40px;gap:22px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="icon-circle"><svg aria-hidden="true" viewBox="0 0 40 40" style="width:30px;height:30px">%s</svg></span>
        <span class="mono" style="font-size:12px;color:var(--mist)">0%d</span>
      </div>
      <h2 class="h3" style="font-size:28px;line-height:1.15" t="in%d_t"></h2>
      <p class="body" style="font-size:17px" t="in%d_l"></p>
      <div class="line"></div>
      <ul class="list">%s</ul>
      <a class="arrow-link" href="/contact/" style="margin-top:auto" t="so_discuss"></a>
    </article>''' % (ICONS[i - 1], i, i, i, items))
    return '\n'.join(out)

def why_rows():
    out = []
    for i in range(1, 5):
        last = ';border-bottom:1px solid var(--line)' if i == 4 else ''
        out.append('      <div data-reveal style="display:grid;grid-template-columns:60px minmax(0,1fr);gap:20px;padding:28px 0;'
                   'border-top:1px solid var(--line)%s"><span class="mono ac">0%d</span><div><h3 class="h3" style="margin-bottom:8px" '
                   't="wy%d_t"></h3><p class="body" t="wy%d_d"></p></div></div>' % (last, i, i, i))
    return '\n'.join(out)

BLOCKS = {
    'STRIP': strip(), 'STRIP_HIDDEN': strip(True), 'SERVICE_CARDS': service_cards(), 'SERVICE_ROWS': service_rows(),
    'INDUSTRY_CARDS': industry_cards(), 'WHY_ROWS': why_rows(), 'ARROW': ARROW, 'MARK': MARK, 'VER': VER, 'EXTRA_HEAD': '',
}

ORG_LD = '''  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"Tsahim-Ur LLC","url":"https://tsahimur.mn/",
   "logo":"https://tsahimur.mn/assets/tsahimur_logo_transparent.png","email":"hello@tsahimur.mn","foundingDate":"2014",
   "address":{"@type":"PostalAddress","addressLocality":"Ulaanbaatar","addressCountry":"MN"},
   "description":"IT consulting, solution architecture and system development company in Ulaanbaatar, Mongolia."}
  </script>'''

SEO_LINKS = '''  <link rel="canonical" href="https://tsahimur.mn{{PATH}}">
  <link rel="alternate" hreflang="en" href="https://tsahimur.mn{{PATH}}?lang=en">
  <link rel="alternate" hreflang="mn" href="https://tsahimur.mn{{PATH}}?lang=mn">
  <link rel="alternate" hreflang="x-default" href="https://tsahimur.mn{{PATH}}">'''

PAGES = [  # (template, output, path, seo key)
    ('home', 'index.html', '/', 'home'),
    ('services', 'services/index.html', '/services/', 'services'),
    ('solutions', 'solutions/index.html', '/solutions/', 'solutions'),
    ('about', 'about/index.html', '/about/', 'about'),
    ('contact', 'contact/index.html', '/contact/', 'contact'),
    ('404', '404.html', '/', 'notfound'),
]

ROOT_ATTR = re.compile(r'\b(href|src)="/(?!/)([^"]*)"')
T_ATTR = re.compile(r'\st="([a-z0-9_]+)"([^>]*)>')

def relative(html, out):
    """Root paths (/assets/x) become relative (../assets/x) so pages also open straight from disk."""
    base = '../' * out.count('/')
    return ROOT_ATTR.sub(lambda m: '%s="%s"' % (m.group(1), base + m.group(2) or './'), html)

def fill(html, page, path, seo):
    vals = dict(BLOCKS)
    vals.update({'TITLE': EN['seo_%s_title' % seo], 'DESC': EN['seo_%s_desc' % seo], 'PATH': path, 'PAGE': seo})
    indexed = seo != 'notfound'
    vals.update({'ROBOTS': 'index,follow' if indexed else 'noindex', 'SEO_LINKS': SEO_LINKS if indexed else ''})
    if seo == 'home':
        vals['EXTRA_HEAD'] = ORG_LD
    for k in ['services', 'solutions', 'about', 'contact']:
        vals['CUR_' + k] = 'aria-current="page"' if k == seo else ''
    for _ in range(3):  # blocks can contain placeholders
        html = re.sub(r'\{\{([A-Za-z_]+)\}\}', lambda m: vals.get(m.group(1), m.group(0)), html)

    def sub(m):
        key = m.group(1)
        if key not in EN:
            raise SystemExit('unknown string key: ' + key)
        return ' data-i18n="%s"%s>%s' % (key, m.group(2), EN[key])
    return T_ATTR.sub(sub, html)

def main():
    head, header, footer = read('partials', 'head.html'), read('partials', 'header.html'), read('partials', 'footer.html')
    for tpl, out, path, seo in PAGES:
        html = fill(head + header + read('pages', tpl + '.html') + footer, tpl, path, seo)
        if out != '404.html':  # served at any depth, so its paths stay absolute
            html = relative(html, out)
        dest = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(html)
        print('built', out)
    with open(os.path.join(ROOT, 'assets', 'js', 'i18n.js'), 'w', encoding='utf-8') as f:
        f.write('/* Generated by src/build.py from src/strings.py — do not edit by hand. */\n')
        f.write('window.I18N = ' + json.dumps({'en': EN, 'mn': MN}, ensure_ascii=False, indent=1) + ';\n')
    print('built assets/js/i18n.js')

if __name__ == '__main__':
    main()
