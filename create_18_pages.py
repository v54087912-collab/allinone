import os
import re
import glob

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'

# 1. Update existing 32 HTML files:
# Replace top bar brand link with clean Home button:
# <a href="/index.html" class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors group" title="Home" aria-label="Home">
#   <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
#     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
#   </svg>
#   <span class="font-bold text-base tracking-tight">Home</span>
# </a>

OLD_TOPBAR_PATTERNS = [
    r'<a\s+href="/index\.html"\s+class="flex items-center gap-2\.5 font-bold text-xl tracking-tight text-slate-900 dark:text-white group">.*?</a>',
    r'<!-- Logo -->\s*<a\s+href="/index\.html"\s+class="flex items-center gap-2\.5 font-bold text-xl tracking-tight text-slate-900 dark:text-white group">.*?</a>'
]

NEW_TOPBAR = '''<a href="/index.html" class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors group" title="Home" aria-label="Home">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span class="font-bold text-base tracking-tight">Home</span>
        </a>'''

OLD_DRAWER_HEADER_PATTERN = r'<div class="flex items-center gap-2\.5">\s*<img src="/logo\.jpg"[^>]*>\s*<span class="font-extrabold text-lg text-slate-900 dark:text-white">Toolora</span>\s*</div>'

NEW_DRAWER_HEADER = '''<a href="/index.html" class="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span class="font-bold text-base">Home</span>
          </a>'''

def update_existing_html():
    files = glob.glob(os.path.join(PROJECT_DIR, '*.html'))
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        orig = content
        for pat in OLD_TOPBAR_PATTERNS:
            content = re.sub(pat, NEW_TOPBAR, content, flags=re.DOTALL)
        content = re.sub(OLD_DRAWER_HEADER_PATTERN, NEW_DRAWER_HEADER, content, flags=re.DOTALL)

        if content != orig:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated header/drawer in {os.path.basename(fpath)}")

update_existing_html()
