import re

INDEX_PATH = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities/index.html'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update filter buttons
old_filter_tabs = '''                <button
                  type="button"
                  data-filter="all"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs cursor-pointer transition-all"
                >
                  All Tools (26)
                </button>
                <button
                  type="button"
                  data-filter="image"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  Image Tools (13)
                </button>
                <button
                  type="button"
                  data-filter="pdf"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  PDF &amp; Docs (13)
                </button>'''

new_filter_tabs = '''                <button
                  type="button"
                  data-filter="all"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs cursor-pointer transition-all"
                >
                  All Tools (44)
                </button>
                <button
                  type="button"
                  data-filter="image"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  Image Tools (13)
                </button>
                <button
                  type="button"
                  data-filter="pdf"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  PDF &amp; Docs (13)
                </button>
                <button
                  type="button"
                  data-filter="text"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  Text Tools (6)
                </button>
                <button
                  type="button"
                  data-filter="calc"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  Calculators &amp; Time (6)
                </button>
                <button
                  type="button"
                  data-filter="dev"
                  class="tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
                >
                  Dev &amp; Utilities (6)
                </button>'''

if old_filter_tabs in content:
    content = content.replace(old_filter_tabs, new_filter_tabs)
    print("Replaced filter tabs")
else:
    print("WARNING: old_filter_tabs not found")

content = content.replace('Showing 26 of 26 utilities', 'Showing 44 of 44 utilities')

# 2. 18 Cards HTML
new_cards = '''
          <!-- Tool 27: Password Generator -->
          <article data-category="dev" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Security</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Password Generator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Generate cryptographically strong passwords with custom length, symbols, digits, and instant Shannon entropy scoring.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/password-generator.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Generate Password &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 28: Word Counter -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Text Analytics</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Word Counter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Analyze word count, character density, sentences, paragraphs, and reading and speaking times with real-time accuracy.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/word-counter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Count Words &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 29: Character Counter -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Social Limits</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Character Counter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Count total characters, spaces, letters, digits, UTF-8 byte size, and track live X/Twitter 280-char post limits.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/character-counter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Count Characters &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 30: Case Converter -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 5v14m6-8h6m-3 0v8"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Typography</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Case Converter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Instantly convert text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, and kebab-case.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/case-converter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Convert Case &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 31: Text Diff Checker -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Diff / Compare</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Text Diff Checker</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Compare two pieces of text or code side-by-side with color-coded additions, deletions, and line-by-line differences.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/text-diff.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Compare Text &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 32: Text Reverser -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">Text Utility</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Text Reverser</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Reverse text character-by-character, word-by-word, each word individually, or flip upside down into unicode text.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/text-reverser.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Reverse Text &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 33: Lorem Ipsum Generator -->
          <article data-category="text" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Placeholder Text</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Lorem Ipsum Generator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Generate authentic Latin dummy text by paragraphs, sentences, or word count with instant 1-click clipboard copy.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/lorem-ipsum.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Generate Lorem &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 34: UUID Generator -->
          <article data-category="dev" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">RFC 4122 v4</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">UUID Generator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Generate cryptographically secure Version 4 UUIDs (GUIDs) in bulk with standard, unhyphenated, or uppercase formats.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/uuid-generator.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Generate UUIDs &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 35: Timestamp Converter -->
          <article data-category="dev" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Epoch / Date</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Timestamp Converter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Convert Unix epoch seconds and milliseconds to human-readable UTC and local time dates, or convert any date to timestamp.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/timestamp-converter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Convert Timestamp &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 36: Unit Converter -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 18h12l3-18H3z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Conversion</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Unit Converter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Universal unit converter for length, weight/mass, digital data storage, speed, and temperature with high decimal precision.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/unit-converter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Convert Units &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 37: Age Calculator -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">Date &amp; Age</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Age Calculator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Compute exact age in years, months, and days, total weeks, days lived, countdown to next birthday, and astrological zodiac sign.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/age-calculator.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Calculate Age &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 38: Percentage Calculator -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Finance &amp; Math</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Percentage Calculator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                5-in-1 percentage calculations: percentage of numbers, ratio percentages, percent increases/decreases, and tax discounts.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/percentage-calculator.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Calculate Percent &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 39: Online Calculator -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Arithmetic</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Calculator</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Clean, full-featured scientific-style desktop calculator with keyboard shortcut support and calculation memory log.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/calculator.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Open Calculator &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 40: Stopwatch -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Timing</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Stopwatch</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Millisecond-precision online stopwatch with unlimited split and lap time recording and best/worst lap highlighting.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/stopwatch.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Start Stopwatch &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 41: Countdown Timer -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Alarm &amp; Focus</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Countdown Timer</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Set custom timer countdowns for cooking, workouts, and productivity with quick presets and an audible audio alarm chime.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/countdown-timer.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Set Timer &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 42: Timezone Converter -->
          <article data-category="calc" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">World Clock</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Timezone Converter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Compare local time across global cities (London, New York, Tokyo, Sydney, Dubai) side-by-side for international meetings.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/timezone-converter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Compare Timezones &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 43: URL Encoder / Decoder -->
          <article data-category="dev" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Web Developer</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">URL Encoder / Decoder</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Encode and decode URI strings, query components, and parse complex query parameters into an organized visual table.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/url-encoder.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Encode / Decode &rarr;
              </a>
            </div>
          </article>

          <!-- Tool 44: Base64 Converter -->
          <article data-category="dev" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Encoding</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Base64 Converter</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Encode text or binary files to Base64 strings, or decode Base64 back to clean UTF-8 plain text with instant copy.
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href="/base64-converter.html" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors shadow-xs">
                Convert Base64 &rarr;
              </a>
            </div>
          </article>
'''

# Find insertion point before `        </div>\n        <!-- No matching utilities found -->`
target_tag = '        </div>\n        <!-- No matching utilities found -->'
if target_tag in content:
    content = content.replace(target_tag, new_cards + target_tag)
    print("Inserted 18 new cards into index.html")
else:
    # Alternative target
    target_tag2 = '        <!-- No matching utilities found -->'
    if target_tag2 in content:
        idx = content.rfind('</div>', 0, content.find(target_tag2))
        content = content[:idx] + new_cards + content[idx:]
        print("Inserted 18 new cards using alternative target")
    else:
        print("ERROR: could not locate end of tools-grid")

# 3. Also update mobile drawer in index.html to list all tools
old_drawer_nav = '''          <nav class="flex flex-col space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            <a href="/index.html" class="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Home</a>

            <div class="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Image Tools</div>
            <a href="/multicrop.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">MultiCrop Studio</a>
            <a href="/remove-background.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Remove Background</a>
            <a href="/compress-image.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Image Compressor</a>
            <a href="/convert-image.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Image Converter</a>'''

new_drawer_nav = '''          <nav class="flex flex-col space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            <a href="/index.html" class="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400">Home</a>

            <div class="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Text &amp; Content Tools</div>
            <a href="/word-counter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Word Counter</a>
            <a href="/character-counter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Character Counter</a>
            <a href="/case-converter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Case Converter</a>
            <a href="/text-diff.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Text Diff Checker</a>
            <a href="/text-reverser.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Text Reverser</a>
            <a href="/lorem-ipsum.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Lorem Ipsum Generator</a>

            <div class="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Calculators &amp; Time</div>
            <a href="/calculator.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Calculator</a>
            <a href="/age-calculator.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Age Calculator</a>
            <a href="/percentage-calculator.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Percentage Calculator</a>
            <a href="/unit-converter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Unit Converter</a>
            <a href="/stopwatch.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Stopwatch</a>
            <a href="/countdown-timer.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Countdown Timer</a>
            <a href="/timezone-converter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Timezone Converter</a>

            <div class="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Developer Utilities</div>
            <a href="/password-generator.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Password Generator</a>
            <a href="/uuid-generator.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">UUID Generator</a>
            <a href="/timestamp-converter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Timestamp Converter</a>
            <a href="/url-encoder.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">URL Encoder / Decoder</a>
            <a href="/base64-converter.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Base64 Converter</a>

            <div class="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Image Tools</div>
            <a href="/multicrop.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">MultiCrop Studio</a>
            <a href="/remove-background.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Remove Background</a>
            <a href="/compress-image.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Image Compressor</a>
            <a href="/convert-image.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Image Converter</a>'''

if old_drawer_nav in content:
    content = content.replace(old_drawer_nav, new_drawer_nav)
    print("Updated mobile drawer in index.html")

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html update complete!")
