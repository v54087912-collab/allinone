import os
import re
import glob

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'

# Target 1: Top bar home button without logo -> replace with logo only (no Toolora text)
OLD_TOPBAR_PATTERNS = [
    r'<a\s+href="/index\.html"\s+class="flex items-center gap-2 px-3 py-1\.5 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors group"\s+title="Home"\s+aria-label="Home">\s*<svg[^>]*>.*?</svg>\s*<span class="font-bold text-base tracking-tight">Home</span>\s*</a>',
    r'<a\s+href="/index\.html"\s+class="flex items-center gap-2\.5 font-bold text-xl tracking-tight text-slate-900 dark:text-white group">\s*<img src="/logo\.jpg"[^>]*>\s*<span[^>]*>Toolora</span>\s*</a>'
]

NEW_TOPBAR_LOGO_ONLY = '''<a href="/index.html" class="flex items-center gap-2.5 group" title="Toolora Home" aria-label="Toolora Home">
          <img src="/logo-light.jpg" alt="Toolora" class="h-9 w-auto rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform logo-light dark:hidden" />
          <img src="/logo-dark.jpg" alt="Toolora" class="h-9 w-auto rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform logo-dark hidden dark:block" />
          <span class="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Toolora</span>
        </a>'''

# Target 2: Drawer header
OLD_DRAWER_PATTERNS = [
    r'<a\s+href="/index\.html"\s+class="flex items-center gap-2 text-slate-900 dark:text-white font-bold">\s*<svg[^>]*>.*?</svg>\s*<span class="font-bold text-base">Home</span>\s*</a>',
    r'<div class="flex items-center gap-2\.5">\s*<img src="/logo[^>]*>\s*<span class="font-extrabold text-lg text-slate-900 dark:text-white">Toolora</span>\s*</div>'
]

NEW_DRAWER_LOGO_ONLY = '''<a href="/index.html" class="flex items-center gap-2.5 group" title="Toolora Home" aria-label="Toolora Home">
            <img src="/logo-light.jpg" alt="Toolora" class="h-8 w-auto rounded-lg object-contain shadow-xs logo-light dark:hidden" />
            <img src="/logo-dark.jpg" alt="Toolora" class="h-8 w-auto rounded-lg object-contain shadow-xs logo-dark hidden dark:block" />
            <span class="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Toolora</span>
          </a>'''

def update_headers():
    files = glob.glob(os.path.join(PROJECT_DIR, '*.html'))
    count = 0
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        orig = content
        for pat in OLD_TOPBAR_PATTERNS:
            content = re.sub(pat, NEW_TOPBAR_LOGO_ONLY, content, flags=re.DOTALL)
        for pat in OLD_DRAWER_PATTERNS:
            content = re.sub(pat, NEW_DRAWER_LOGO_ONLY, content, flags=re.DOTALL)

        if content != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            count += 1
            print(f"Updated logo in header of {os.path.basename(fpath)}")

    print(f"Total HTML files updated with logo: {count}")

def remove_banner_from_index():
    index_path = os.path.join(PROJECT_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for the hero visual banner block
    banner_pattern = r'<!-- Hero Visual Banner -->\s*<div class="mt-10 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-2 sm:p-3 transition-transform hover:scale-\[1\.01\]">\s*<img\s+src="/banner\.jpg"[^>]*/>\s*</div>'
    
    if re.search(banner_pattern, content):
        content = re.sub(banner_pattern, '', content)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully removed hero banner image below multicrop/remove-bg/compress buttons in index.html!")
    else:
        # Fallback substring replace
        sub = '''              <!-- Hero Visual Banner -->
        <div class="mt-10 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-2 sm:p-3 transition-transform hover:scale-[1.01]">
          <img
            src="/banner.jpg"
            alt="Toolora In-Browser Image and PDF Suite Banner"
            class="w-full h-auto rounded-2xl object-cover shadow-sm max-h-[420px]"
            loading="eager"
          />
        </div>'''
        if sub in content:
            content = content.replace(sub, '')
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("Successfully removed hero banner via exact substring match!")
        else:
            print("WARNING: Hero visual banner not found in index.html")

update_headers()
remove_banner_from_index()
