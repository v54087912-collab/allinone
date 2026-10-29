import os
from build_template import build_page

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'

# 1. Password Generator
pwd_ws = '''
<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
  <!-- Generated Password Display -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Generated Password</label>
      <div class="flex items-center gap-2">
        <span id="pwd-entropy" class="text-xs font-semibold text-blue-600 dark:text-blue-400">96 bits entropy</span>
        <span id="pwd-strength-text" class="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Strong</span>
      </div>
    </div>
    
    <div class="relative flex items-center">
      <input
        type="text"
        id="pwd-display"
        readonly
        class="w-full font-mono text-xl sm:text-2xl p-4 pr-24 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold select-all focus:outline-none"
        placeholder="Generating..."
      />
      <div class="absolute right-2.5 flex items-center gap-1.5">
        <button
          type="button"
          id="pwd-generate-btn"
          title="Regenerate Password"
          class="p-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <button
          type="button"
          id="pwd-copy-btn"
          title="Copy Password"
          class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
      </div>
    </div>

    <!-- Password Strength Meter Bar -->
    <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
      <div id="pwd-strength-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: 85%;"></div>
    </div>
  </div>

  <!-- Options Configuration -->
  <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <label class="text-sm font-bold text-slate-800 dark:text-slate-100">Password Length</label>
        <div class="text-xs text-slate-500">Longer passwords provide exponential security</div>
      </div>
      <div class="flex items-center gap-3">
        <input
          type="range"
          id="pwd-length-slider"
          min="6"
          max="64"
          value="16"
          class="w-40 sm:w-56 accent-blue-600 cursor-pointer"
        />
        <span id="pwd-length-val" class="w-10 text-center font-mono font-bold text-base text-blue-600 dark:text-blue-400">16</span>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
      <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <input type="checkbox" id="pwd-upper" checked class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Uppercase (A-Z)</span>
      </label>
      <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <input type="checkbox" id="pwd-lower" checked class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Lowercase (a-z)</span>
      </label>
      <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <input type="checkbox" id="pwd-digits" checked class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Numbers (0-9)</span>
      </label>
      <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <input type="checkbox" id="pwd-symbols" checked class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Symbols (!@#$)</span>
      </label>
    </div>

    <div>
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
        <input type="checkbox" id="pwd-avoid-ambiguous" class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
        <span>Avoid ambiguous characters (e.g., 0, O, I, l, 1)</span>
      </label>
    </div>
  </div>

  <!-- Bulk Passwords Section -->
  <div class="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">Bulk Password Generator</h3>
      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-500">Count:</label>
        <input type="number" id="pwd-bulk-count" min="1" max="50" value="5" class="w-16 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-center" />
        <button type="button" id="pwd-bulk-generate-btn" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold transition-colors cursor-pointer">Generate</button>
      </div>
    </div>
    <div class="relative">
      <textarea id="pwd-bulk-output" rows="4" readonly class="w-full font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none" placeholder="Bulk generated passwords will appear here..."></textarea>
      <button type="button" id="pwd-bulk-copy-btn" class="absolute top-2 right-2 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors cursor-pointer">Copy All</button>
    </div>
  </div>
</div>
'''

# 2. Word Counter
wc_ws = '''
<div class="space-y-6">
  <!-- Stats Cards Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-words" class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Words</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-chars" class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Characters</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-chars-nospace" class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">No Spaces</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-sentences" class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Sentences</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-paragraphs" class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Paragraphs</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="wc-readtime" class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">0s</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Read Time</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs col-span-2 sm:col-span-1">
      <div id="wc-speaktime" class="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">0s</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Speak Time</div>
    </div>
  </div>

  <!-- Text Input Area -->
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
    <div class="flex items-center justify-between">
      <label for="wc-textarea" class="text-xs font-bold uppercase tracking-wider text-slate-500">Your Text</label>
      <div class="flex items-center gap-2">
        <button type="button" id="wc-copy-btn" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">Copy Text</button>
        <button type="button" id="wc-clear-btn" class="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer">Clear</button>
      </div>
    </div>
    <textarea
      id="wc-textarea"
      rows="12"
      class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type or paste your text here to analyze words, characters, reading speed, and paragraphs..."
    ></textarea>
  </div>
</div>
'''

# 3. Character Counter
cc_ws = '''
<div class="space-y-6">
  <!-- Main Text Area -->
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="cc-textarea" class="text-xs font-bold uppercase tracking-wider text-slate-500">Input Content</label>
      <span class="text-xs text-slate-400">Live automatic count</span>
    </div>
    <textarea
      id="cc-textarea"
      rows="10"
      class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type or paste text to inspect detailed character composition and platform limits..."
    ></textarea>
  </div>

  <!-- Detailed Metric Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-total" class="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Total Chars</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-no-space" class="text-2xl font-mono font-bold text-slate-900 dark:text-white">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">No Spaces</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-letters" class="text-2xl font-mono font-bold text-slate-900 dark:text-white">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Letters</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-numbers" class="text-2xl font-mono font-bold text-slate-900 dark:text-white">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Numbers</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-spaces" class="text-2xl font-mono font-bold text-slate-900 dark:text-white">0</div>
      <div class="text-xs font-medium text-slate-500 mt-1">Spaces</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
      <div id="cc-bytes" class="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">0 B</div>
      <div class="text-xs font-medium text-slate-500 mt-1">UTF-8 Size</div>
    </div>
  </div>

  <!-- Social Platform Limits -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Social Media &amp; Messaging Limits</h3>
    <div class="space-y-4">
      <div>
        <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span class="text-slate-700 dark:text-slate-300">X (Twitter) Post (280 max)</span>
          <span id="cc-twitter-count" class="text-blue-600 dark:text-blue-400 font-mono">280 left</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div id="cc-twitter-bar" class="h-full bg-blue-500 rounded-full transition-all duration-200" style="width: 0%;"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span class="text-xs text-slate-600 dark:text-slate-300">SMS Segments (160/part):</span>
          <span id="cc-sms-count" class="font-mono font-bold text-xs text-slate-900 dark:text-white">0 part (0/160)</span>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span class="text-xs text-slate-600 dark:text-slate-300">Instagram Caption (2,200 max):</span>
          <span id="cc-insta-count" class="font-mono font-bold text-xs text-slate-900 dark:text-white">2200 left</span>
        </div>
      </div>
    </div>
  </div>
</div>
'''

# 4. Case Converter
case_ws = '''
<div class="space-y-6">
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="case-input" class="text-xs font-bold uppercase tracking-wider text-slate-500">Input Text</label>
      <div class="flex items-center gap-2">
        <button type="button" id="case-copy-btn" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Copy</button>
        <button type="button" id="case-clear-btn" class="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer">Clear</button>
      </div>
    </div>
    <textarea
      id="case-input"
      rows="8"
      class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      placeholder="Type or paste your text here, then choose a case format below..."
    ></textarea>
  </div>

  <!-- Transform Actions -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Choose Target Format</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      <button type="button" data-case="upper" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">UPPERCASE</button>
      <button type="button" data-case="lower" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-semibold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">lowercase</button>
      <button type="button" data-case="title" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-semibold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">Title Case</button>
      <button type="button" data-case="sentence" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-semibold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">Sentence case</button>
      <button type="button" data-case="camel" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-mono text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">camelCase</button>
      <button type="button" data-case="pascal" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-mono text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">PascalCase</button>
      <button type="button" data-case="snake" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-mono text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">snake_case</button>
      <button type="button" data-case="kebab" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-mono text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">kebab-case</button>
      <button type="button" data-case="constant" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 font-mono font-bold text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">CONSTANT_CASE</button>
      <button type="button" data-case="alternating" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer">aLtErNaTiNg</button>
    </div>
  </div>
</div>
'''

# 5. Text Diff
diff_ws = '''
<div class="space-y-6">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <button type="button" id="diff-compare-btn" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Compare Diff &rarr;</button>
      <button type="button" id="diff-swap-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">Swap Texts</button>
    </div>
    <button type="button" id="diff-sample-btn" class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">Load Sample</button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
      <label for="diff-orig" class="text-xs font-bold uppercase tracking-wider text-slate-500">Original Text</label>
      <textarea id="diff-orig" rows="10" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed focus:outline-none" placeholder="Paste original text here..."></textarea>
    </div>
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
      <label for="diff-mod" class="text-xs font-bold uppercase tracking-wider text-slate-500">Modified Text</label>
      <textarea id="diff-mod" rows="10" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed focus:outline-none" placeholder="Paste modified text here..."></textarea>
    </div>
  </div>

  <!-- Diff Visual Output -->
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-3">
    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Comparison Result</h3>
    <div id="diff-output" class="font-mono text-xs rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 min-h-[140px] overflow-x-auto space-y-1">
      <div class="text-slate-400 italic">Click "Compare Diff" to view line-by-line differences...</div>
    </div>
  </div>
</div>
'''

# 6. Text Reverser
rev_ws = '''
<div class="space-y-6">
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <label for="rev-input" class="text-xs font-bold uppercase tracking-wider text-slate-500">Input Text</label>
      <div class="flex items-center gap-2">
        <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Mode:</label>
        <select id="rev-mode" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
          <option value="letters">Reverse Letters / Characters</option>
          <option value="words">Reverse Words</option>
          <option value="each-word">Reverse Each Word</option>
          <option value="flip">Flip Upside Down (Unicode)</option>
        </select>
      </div>
    </div>
    <textarea id="rev-input" rows="6" class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base leading-relaxed focus:outline-none" placeholder="Enter text to reverse instantly..."></textarea>
  </div>

  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="rev-output" class="text-xs font-bold uppercase tracking-wider text-slate-500">Reversed Output</label>
      <button type="button" id="rev-copy-btn" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Copy</button>
    </div>
    <textarea id="rev-output" rows="6" readonly class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base leading-relaxed font-mono focus:outline-none" placeholder="Reversed text will appear here..."></textarea>
  </div>
</div>
'''

# 7. Lorem Ipsum
lorem_ws = '''
<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Generate By</label>
      <select id="lorem-type" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
        <option value="paragraphs">Paragraphs</option>
        <option value="sentences">Sentences</option>
        <option value="words">Words</option>
      </select>
    </div>
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Count</label>
      <input type="number" id="lorem-count" min="1" max="50" value="3" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-900 dark:text-white" />
    </div>
    <div class="flex flex-col justify-end">
      <button type="button" id="lorem-generate-btn" class="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Generate Lorem Ipsum &rarr;</button>
    </div>
  </div>

  <div>
    <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
      <input type="checkbox" id="lorem-start" checked class="w-4 h-4 rounded text-blue-600 accent-blue-600" />
      <span>Start with "Lorem ipsum dolor sit amet..."</span>
    </label>
  </div>

  <div class="space-y-3 pt-2">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Generated Text</label>
      <button type="button" id="lorem-copy-btn" class="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">Copy All</button>
    </div>
    <textarea id="lorem-output" rows="10" readonly class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-none"></textarea>
  </div>
</div>
'''

# 8. UUID Generator
uuid_ws = '''
<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Quantity (1 to 100)</label>
      <input type="number" id="uuid-qty" min="1" max="100" value="5" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-900 dark:text-white" />
    </div>
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Format</label>
      <select id="uuid-format" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
        <option value="standard">Standard Hyphenated (8-4-4-4-12)</option>
        <option value="nohyphen">No Hyphens (32 chars)</option>
        <option value="uppercase">Uppercase</option>
      </select>
    </div>
    <div class="flex flex-col justify-end">
      <button type="button" id="uuid-gen-btn" class="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Generate UUIDs &rarr;</button>
    </div>
  </div>

  <div class="space-y-3 pt-2">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Output</label>
      <button type="button" id="uuid-copy-btn" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Copy All</button>
    </div>
    <textarea id="uuid-output" rows="8" readonly class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none"></textarea>
  </div>
</div>
'''

# 9. Timestamp Converter
ts_ws = '''
<div class="space-y-6">
  <!-- Live Epoch Bar -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
      <div class="text-xs font-bold uppercase tracking-wider text-slate-500">Current Unix Epoch</div>
      <div class="text-2xl sm:text-3xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-0.5" id="ts-live-epoch">0</div>
    </div>
    <button type="button" id="ts-copy-live" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer">Copy Current Timestamp</button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Convert Epoch to Human Date -->
    <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">Timestamp &rarr; Human Date</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="number" id="ts-epoch-input" placeholder="e.g., 1774000000" class="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none" />
          <button type="button" id="ts-epoch-btn" class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer">Convert</button>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div><strong class="text-slate-500">UTC:</strong> <span id="ts-utc-res" class="font-mono text-slate-800 dark:text-slate-200 font-semibold">-</span></div>
          <div><strong class="text-slate-500">Local:</strong> <span id="ts-local-res" class="font-mono text-slate-800 dark:text-slate-200 font-semibold">-</span></div>
          <div><strong class="text-slate-500">Relative:</strong> <span id="ts-relative-res" class="text-blue-600 dark:text-blue-400 font-semibold">-</span></div>
        </div>
      </div>
    </div>

    <!-- Convert Human Date to Epoch -->
    <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">Human Date &rarr; Timestamp</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="datetime-local" id="ts-date-input" class="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none" />
          <button type="button" id="ts-date-btn" class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer">Convert</button>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div><strong class="text-slate-500">Epoch Seconds:</strong> <span id="ts-date-epoch-sec" class="font-mono text-slate-800 dark:text-slate-200 font-bold">-</span></div>
          <div><strong class="text-slate-500">Epoch Millis:</strong> <span id="ts-date-epoch-ms" class="font-mono text-slate-800 dark:text-slate-200 font-bold">-</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
'''

# 10. Unit Converter
unit_ws = '''
<div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
  <div>
    <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
    <select id="unit-category" class="w-full sm:w-72 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
      <option value="length">Length &amp; Distance</option>
      <option value="weight">Weight &amp; Mass</option>
      <option value="storage">Digital Storage</option>
      <option value="speed">Speed &amp; Velocity</option>
      <option value="temperature">Temperature</option>
    </select>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-7 gap-4 items-center">
    <!-- From Column -->
    <div class="sm:col-span-3 space-y-2">
      <label class="text-xs font-semibold text-slate-500">From</label>
      <select id="unit-from-type" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"></select>
      <input type="number" id="unit-from-val" value="1" step="any" class="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <!-- Swap Button -->
    <div class="sm:col-span-1 text-center flex justify-center py-2 sm:py-0">
      <button type="button" id="unit-swap-btn" title="Swap Units" class="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
      </button>
    </div>

    <!-- To Column -->
    <div class="sm:col-span-3 space-y-2">
      <label class="text-xs font-semibold text-slate-500">To</label>
      <select id="unit-to-type" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"></select>
      <input type="text" id="unit-to-val" readonly class="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-xl font-bold text-blue-600 dark:text-blue-400 focus:outline-none" />
    </div>
  </div>
</div>
'''

# 11. Age Calculator
age_ws = '''
<div class="space-y-6">
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="age-birth" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date of Birth</label>
        <input type="date" id="age-birth" class="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white" />
      </div>
      <div>
        <label for="age-target" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Age at the Date of</label>
        <input type="date" id="age-target" class="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white" />
      </div>
    </div>
    <button type="button" id="age-calc-btn" class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Calculate Exact Age &rarr;</button>
  </div>

  <!-- Results Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="md:col-span-3 p-6 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
      <div class="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Primary Age</div>
      <div id="age-primary-res" class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Select your birthdate above</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
      <div class="text-xs text-slate-500">Total Months</div>
      <div id="age-months-res" class="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">-</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
      <div class="text-xs text-slate-500">Total Weeks</div>
      <div id="age-weeks-res" class="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">-</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
      <div class="text-xs text-slate-500">Total Days</div>
      <div id="age-days-res" class="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">-</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center md:col-span-2">
      <div class="text-xs text-slate-500">Next Birthday Countdown</div>
      <div id="age-next-bday" class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">-</div>
    </div>
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
      <div class="text-xs text-slate-500">Zodiac Sign</div>
      <div id="age-zodiac" class="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">-</div>
    </div>
  </div>
</div>
'''

# 12. Percentage Calculator
pct_ws = '''
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Formula 1: What is X% of Y? -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
    <h3 class="text-sm font-bold text-slate-900 dark:text-white">What is X% of Y?</h3>
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-500">What is</span>
      <input type="number" id="pct1-a" placeholder="15" class="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
      <span class="text-xs text-slate-500">% of</span>
      <input type="number" id="pct1-b" placeholder="200" class="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
    </div>
    <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <span class="text-xs text-slate-500">Result:</span>
      <span id="pct1-res" class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">-</span>
    </div>
  </div>

  <!-- Formula 2: X is what % of Y? -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
    <h3 class="text-sm font-bold text-slate-900 dark:text-white">X is what % of Y?</h3>
    <div class="flex items-center gap-2">
      <input type="number" id="pct2-a" placeholder="25" class="w-24 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
      <span class="text-xs text-slate-500">is what % of</span>
      <input type="number" id="pct2-b" placeholder="100" class="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
    </div>
    <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <span class="text-xs text-slate-500">Result:</span>
      <span id="pct2-res" class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">-</span>
    </div>
  </div>

  <!-- Formula 3: % Increase/Decrease from X to Y -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
    <h3 class="text-sm font-bold text-slate-900 dark:text-white">% Change from X to Y</h3>
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-500">From</span>
      <input type="number" id="pct3-a" placeholder="80" class="w-24 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
      <span class="text-xs text-slate-500">to</span>
      <input type="number" id="pct3-b" placeholder="100" class="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
    </div>
    <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <span class="text-xs text-slate-500">Change:</span>
      <span id="pct3-res" class="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">-</span>
    </div>
  </div>

  <!-- Formula 4: Add / Subtract X% to Y -->
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Add/Subtract % (e.g. Tax / Discount)</h3>
    <div class="flex items-center gap-2">
      <input type="number" id="pct4-b" placeholder="150" class="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
      <span class="text-xs text-slate-500">&plusmn;</span>
      <input type="number" id="pct4-a" placeholder="10" class="w-20 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-center" />
      <span class="text-xs text-slate-500">%</span>
    </div>
    <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <span class="text-xs text-slate-500">Added / Subtracted:</span>
      <span id="pct4-res" class="text-base font-mono font-bold text-purple-600 dark:text-purple-400">-</span>
    </div>
  </div>
</div>
'''

# 13. Calculator
calc_ws = '''
<div class="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
  <!-- Screen -->
  <div class="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right space-y-1">
    <div id="calc-history" class="h-5 text-xs font-mono text-slate-400 overflow-hidden"></div>
    <div id="calc-display" class="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-tight overflow-x-auto">0</div>
  </div>

  <!-- Keypad -->
  <div class="grid grid-cols-4 gap-2.5">
    <button type="button" data-calc-key="C" class="p-4 rounded-2xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-lg transition-colors cursor-pointer">C</button>
    <button type="button" data-calc-key="+/-" class="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-lg transition-colors cursor-pointer">&plusmn;</button>
    <button type="button" data-calc-key="%" class="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-lg transition-colors cursor-pointer">%</button>
    <button type="button" data-calc-key="/" class="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl transition-colors cursor-pointer">&divide;</button>

    <button type="button" data-calc-key="7" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">7</button>
    <button type="button" data-calc-key="8" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">8</button>
    <button type="button" data-calc-key="9" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">9</button>
    <button type="button" data-calc-key="*" class="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl transition-colors cursor-pointer">&times;</button>

    <button type="button" data-calc-key="4" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">4</button>
    <button type="button" data-calc-key="5" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">5</button>
    <button type="button" data-calc-key="6" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">6</button>
    <button type="button" data-calc-key="-" class="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl transition-colors cursor-pointer">&minus;</button>

    <button type="button" data-calc-key="1" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">1</button>
    <button type="button" data-calc-key="2" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">2</button>
    <button type="button" data-calc-key="3" class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">3</button>
    <button type="button" data-calc-key="+" class="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl transition-colors cursor-pointer">&plus;</button>

    <button type="button" data-calc-key="0" class="col-span-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer text-left pl-6">0</button>
    <button type="button" data-calc-key="." class="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xl transition-colors cursor-pointer">.</button>
    <button type="button" data-calc-key="=" class="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl transition-colors cursor-pointer">&equals;</button>
  </div>
</div>
'''

# 14. Stopwatch
sw_ws = '''
<div class="max-w-xl mx-auto space-y-6">
  <div class="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
    <div id="sw-display" class="font-mono text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">00:00:00.00</div>
    <div class="flex items-center justify-center gap-3">
      <button type="button" id="sw-start" class="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Start</button>
      <button type="button" id="sw-pause" class="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Pause</button>
      <button type="button" id="sw-lap" class="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Lap</button>
      <button type="button" id="sw-reset" class="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer">Reset</button>
    </div>
  </div>

  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Lap Times</h3>
    <div id="sw-laps-list" class="space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300">
      <div class="text-slate-400 italic text-center py-4">No laps recorded yet</div>
    </div>
  </div>
</div>
'''

# 15. Countdown Timer
timer_ws = '''
<div class="max-w-xl mx-auto space-y-6">
  <div class="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
    <div id="timer-display" class="font-mono text-5xl sm:text-6xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">00:00:00</div>
    
    <div class="flex items-center justify-center gap-2">
      <div class="text-center">
        <label class="text-[10px] uppercase font-bold text-slate-400">Hours</label>
        <input type="number" id="timer-hours" min="0" max="99" value="0" class="w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center text-sm" />
      </div>
      <span class="text-lg font-bold text-slate-400 mt-3">:</span>
      <div class="text-center">
        <label class="text-[10px] uppercase font-bold text-slate-400">Mins</label>
        <input type="number" id="timer-mins" min="0" max="59" value="5" class="w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center text-sm" />
      </div>
      <span class="text-lg font-bold text-slate-400 mt-3">:</span>
      <div class="text-center">
        <label class="text-[10px] uppercase font-bold text-slate-400">Secs</label>
        <input type="number" id="timer-secs" min="0" max="59" value="0" class="w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center text-sm" />
      </div>
    </div>

    <!-- Quick Presets -->
    <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
      <button type="button" data-timer-secs="60" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">1 min</button>
      <button type="button" data-timer-secs="180" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">3 min</button>
      <button type="button" data-timer-secs="300" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">5 min</button>
      <button type="button" data-timer-secs="600" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">10 min</button>
      <button type="button" data-timer-secs="900" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">15 min</button>
      <button type="button" data-timer-secs="1800" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold">30 min</button>
    </div>

    <div class="flex items-center justify-center gap-3 pt-2">
      <button type="button" id="timer-start" class="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Start</button>
      <button type="button" id="timer-pause" class="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer">Pause</button>
      <button type="button" id="timer-reset" class="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer">Reset</button>
    </div>
  </div>
</div>
'''

# 16. Timezone Converter
tz_ws = '''
<div class="space-y-6">
  <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
      <label for="tz-base-time" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Reference Time</label>
      <input type="datetime-local" id="tz-base-time" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white" />
    </div>
    <span class="text-xs text-slate-500">Synchronizes live across all world timezones</span>
  </div>

  <div id="tz-clocks-wrap" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Populated by timezone-conv.ts -->
  </div>
</div>
'''

# 17. URL Encoder
url_ws = '''
<div class="space-y-6">
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="url-input" class="text-xs font-bold uppercase tracking-wider text-slate-500">Input URL or Text</label>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" id="url-encode-btn" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Encode URI</button>
        <button type="button" id="url-decode-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer">Decode URI</button>
        <button type="button" id="url-parse-btn" class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer">Parse Query</button>
      </div>
    </div>
    <textarea id="url-input" rows="5" class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none" placeholder="https://example.com/search?q=hello%20world&category=tools"></textarea>
  </div>

  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="url-output" class="text-xs font-bold uppercase tracking-wider text-slate-500">Output</label>
      <button type="button" id="url-copy-btn" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Copy</button>
    </div>
    <textarea id="url-output" rows="5" readonly class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none"></textarea>
  </div>

  <div id="url-parse-table" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-6 hidden">
    <!-- Populated by url-encoder.ts -->
  </div>
</div>
'''

# 18. Base64 Converter
b64_ws = '''
<div class="space-y-6">
  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <label for="b64-input" class="text-xs font-bold uppercase tracking-wider text-slate-500">Text or File Input</label>
      <div class="flex items-center gap-2">
        <label class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer">
          <span>Upload File</span>
          <input type="file" id="b64-file-input" class="hidden" />
        </label>
        <button type="button" id="b64-encode-btn" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Encode Base64</button>
        <button type="button" id="b64-decode-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer">Decode Base64</button>
      </div>
    </div>
    <textarea id="b64-input" rows="6" class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none" placeholder="Enter plain text to encode, or base64 string to decode..."></textarea>
  </div>

  <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <label for="b64-output" class="text-xs font-bold uppercase tracking-wider text-slate-500">Output Result</label>
      <button type="button" id="b64-copy-btn" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer">Copy</button>
    </div>
    <textarea id="b64-output" rows="6" readonly class="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:outline-none"></textarea>
  </div>
</div>
'''

# Tool Definitions List
TOOLS = [
    {
        'filename': 'password-generator.html',
        'title': 'Strong Password Generator & Entropy Checker – Toolora',
        'meta_desc': 'Generate strong, cryptographically secure passwords and calculate entropy directly in your browser with zero server transmission.',
        'canonical': 'password-generator.html',
        'id': 'password-generator',
        'name': 'Password Generator',
        'subtitle': 'Generate cryptographically random passwords with custom lengths, symbols, and instant Shannon entropy scoring.',
        'script': '/src/tools/password-gen.ts',
        'ws': pwd_ws,
        'faq': [
            ("Are these passwords generated securely?", "Yes. Passwords use window.crypto.getRandomValues, the browser's hardware-backed cryptographic random number generator."),
            ("Does any password leave my device?", "No. Everything runs strictly in local JavaScript memory. No logs or requests are transmitted to any server.")
        ]
    },
    {
        'filename': 'word-counter.html',
        'title': 'Word Counter & Reading Time Estimator – Toolora',
        'meta_desc': 'Count words, characters, sentences, paragraphs, and calculate reading and speaking time online for free with 100% private text analysis.',
        'canonical': 'word-counter.html',
        'id': 'word-counter',
        'name': 'Word Counter',
        'subtitle': 'Analyze word count, character density, sentences, paragraphs, and reading and speaking times in real-time.',
        'script': '/src/tools/word-counter.ts',
        'ws': wc_ws,
        'faq': [
            ("How is reading time calculated?", "Standard adult reading speed is measured at an average of 200 words per minute."),
            ("Is my text confidential?", "100%. All processing occurs within your browser memory; nothing is uploaded or stored.")
        ]
    },
    {
        'filename': 'character-counter.html',
        'title': 'Character Counter & Social Media Limits – Toolora',
        'meta_desc': 'Count characters with and without spaces, track X/Twitter 280 limits, SMS segments, and Instagram caption quotas.',
        'canonical': 'character-counter.html',
        'id': 'character-counter',
        'name': 'Character Counter',
        'subtitle': 'Accurately count characters, letters, digits, whitespace, UTF-8 byte sizes, and monitor social media character constraints.',
        'script': '/src/tools/character-counter.ts',
        'ws': cc_ws,
        'faq': [
            ("Why does UTF-8 byte count differ from character count?", "Standard ASCII characters use 1 byte, while emojis and non-Latin scripts use 2 to 4 bytes per character."),
            ("What is an SMS segment?", "Standard GSM-7 text messages allow 160 characters per SMS part.")
        ]
    },
    {
        'filename': 'case-converter.html',
        'title': 'Case Converter – UPPERCASE, Title Case, camelCase – Toolora',
        'meta_desc': 'Convert text case instantly: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case.',
        'canonical': 'case-converter.html',
        'id': 'case-converter',
        'name': 'Case Converter',
        'subtitle': 'Easily transform text into 10 formats including UPPERCASE, lowercase, Title Case, camelCase, snake_case, and kebab-case.',
        'script': '/src/tools/case-converter.ts',
        'ws': case_ws,
        'faq': [
            ("What is the difference between camelCase and PascalCase?", "camelCase starts with a lowercase letter (e.g. myVariable), whereas PascalCase starts with an uppercase letter (e.g. MyVariable)."),
            ("Does Title Case follow standard capitalization?", "Yes, Title Case capitalizes the first letter of each significant word.")
        ]
    },
    {
        'filename': 'text-diff.html',
        'title': 'Text Diff Checker – Compare Text Differences Online – Toolora',
        'meta_desc': 'Compare two text snippets side-by-side or line-by-line with highlighted additions, deletions, and modifications.',
        'canonical': 'text-diff.html',
        'id': 'text-diff',
        'name': 'Text Diff Checker',
        'subtitle': 'Compare two blocks of code or prose line-by-line with color-coded difference highlights using the Longest Common Subsequence algorithm.',
        'script': '/src/tools/text-diff.ts',
        'ws': diff_ws,
        'faq': [
            ("How does line diffing work?", "The tool calculates differences using the classic Longest Common Subsequence (LCS) algorithm to find minimal additions and removals."),
            ("Can I use this for source code?", "Yes! It works seamlessly for JSON, JavaScript, Python, Markdown, and plain text.")
        ]
    },
    {
        'filename': 'text-reverser.html',
        'title': 'Text Reverser – Reverse Characters, Words & Flip – Toolora',
        'meta_desc': 'Reverse text letters, reverse words order, reverse each word individually, or flip text upside down with unicode characters.',
        'canonical': 'text-reverser.html',
        'id': 'text-reverser',
        'name': 'Text Reverser',
        'subtitle': 'Reverse letters, word order, individual words, or flip text upside down for fun and social media bios.',
        'script': '/src/tools/text-reverser.ts',
        'ws': rev_ws,
        'faq': [
            ("How does upside-down flipping work?", "It maps standard Latin alphabet characters to corresponding inverted unicode symbols."),
            ("Can it handle multi-line text?", "Yes, all modes preserve paragraph and line breaks.")
        ]
    },
    {
        'filename': 'lorem-ipsum.html',
        'title': 'Lorem Ipsum Generator – Dummy Placeholder Text – Toolora',
        'meta_desc': 'Generate dummy placeholder Latin text by paragraphs, sentences, or word count with instant copy for designers and developers.',
        'canonical': 'lorem-ipsum.html',
        'id': 'lorem-ipsum',
        'name': 'Lorem Ipsum Generator',
        'subtitle': 'Generate authentic Cicero Latin dummy placeholder text for website mockups, layouts, and typography testing.',
        'script': '/src/tools/lorem-ipsum.ts',
        'ws': lorem_ws,
        'faq': [
            ("What is Lorem Ipsum?", "Lorem Ipsum is standard placeholder text derived from sections 1.10.32 and 1.10.33 of Cicero's 'de Finibus Bonorum et Malorum' written in 45 BC."),
            ("Is there a limit on generation?", "You can generate up to 50 paragraphs or 500 words at once.")
        ]
    },
    {
        'filename': 'uuid-generator.html',
        'title': 'UUID Generator – Version 4 (v4) RFC 4122 GUIDs – Toolora',
        'meta_desc': 'Generate cryptographically random RFC 4122 v4 UUID / GUID strings in bulk with hyphenated, unhyphenated, and uppercase options.',
        'canonical': 'uuid-generator.html',
        'id': 'uuid-generator',
        'name': 'UUID Generator',
        'subtitle': 'Generate cryptographically secure Version 4 UUIDs (GUIDs) in bulk using browser-native crypto.randomUUID().',
        'script': '/src/tools/uuid-generator.ts',
        'ws': uuid_ws,
        'faq': [
            ("What version UUIDs are produced?", "Standard RFC 4122 Version 4 (v4) UUIDs which are randomly generated with 122 bits of entropy."),
            ("Are duplicate UUIDs possible?", "The odds of generating a duplicate UUID v4 are approximately 1 in 2^122, which is practically zero.")
        ]
    },
    {
        'filename': 'timestamp-converter.html',
        'title': 'Unix Timestamp Converter – Epoch to Date & Date to Epoch – Toolora',
        'meta_desc': 'Convert Unix timestamps in seconds or milliseconds to human-readable UTC and local time, or convert dates to Unix epoch.',
        'canonical': 'timestamp-converter.html',
        'id': 'timestamp-converter',
        'name': 'Timestamp Converter',
        'subtitle': 'Seamlessly convert between Unix Epoch seconds/milliseconds and human-readable UTC and local date formats.',
        'script': '/src/tools/timestamp-conv.ts',
        'ws': ts_ws,
        'faq': [
            ("What is Unix Epoch time?", "Unix Epoch is the number of seconds that have elapsed since January 1, 1970 00:00:00 UTC, excluding leap seconds."),
            ("Does this support milliseconds?", "Yes, both 10-digit second timestamps and 13-digit millisecond timestamps are supported.")
        ]
    },
    {
        'filename': 'unit-converter.html',
        'title': 'Universal Unit Converter – Length, Weight, Storage, Speed – Toolora',
        'meta_desc': 'Convert between length, weight, digital storage, speed, and temperature units instantly with zero server latency.',
        'canonical': 'unit-converter.html',
        'id': 'unit-converter',
        'name': 'Unit Converter',
        'subtitle': 'Convert across standard metric and imperial units for length, weight, data storage, speed, and temperature.',
        'script': '/src/tools/unit-converter.ts',
        'ws': unit_ws,
        'faq': [
            ("Which unit categories are supported?", "Length (meters, feet, inches, km, miles), Weight (kg, pounds, ounces, grams), Storage (B, KB, MB, GB, TB), Speed (km/h, mph, m/s), and Temperature (C, F, K)."),
            ("Does it convert decimal values?", "Yes, floating-point and scientific numbers are fully supported with double precision.")
        ]
    },
    {
        'filename': 'age-calculator.html',
        'title': 'Exact Age Calculator & Birthday Countdown – Toolora',
        'meta_desc': 'Calculate your exact age in years, months, days, total weeks, hours, and find your next birthday countdown and astrological zodiac.',
        'canonical': 'age-calculator.html',
        'id': 'age-calculator',
        'name': 'Age Calculator',
        'subtitle': 'Calculate exact age in years, months, and days with breakdown of total days lived, next birthday countdown, and zodiac sign.',
        'script': '/src/tools/age-calculator.ts',
        'ws': age_ws,
        'faq': [
            ("Does this account for leap years?", "Yes, all leap years and variable month lengths (28, 29, 30, 31 days) are accurately calculated."),
            ("Can I calculate age on a past or future date?", "Yes, select any custom target date in the 'Age at the Date of' field.")
        ]
    },
    {
        'filename': 'percentage-calculator.html',
        'title': 'Percentage Calculator – 5-in-1 Percentage Tool – Toolora',
        'meta_desc': 'Calculate percentage of a number, percentage change, what percent X is of Y, and discounts or taxes with instant mathematical precision.',
        'canonical': 'percentage-calculator.html',
        'id': 'percentage-calculator',
        'name': 'Percentage Calculator',
        'subtitle': 'Compute percentage of numbers, percentage increases/decreases, ratios, and taxes or discounts in real-time.',
        'script': '/src/tools/percentage-calc.ts',
        'ws': pct_ws,
        'faq': [
            ("How do I calculate a discount?", "Use the 'Add/Subtract %' sub-calculator with the original price and discount percentage."),
            ("What is the formula for percentage change?", "Percentage change = ((New Value - Old Value) / |Old Value|) * 100%.")
        ]
    },
    {
        'filename': 'calculator.html',
        'title': 'Online Scientific Calculator – Clean & Private – Toolora',
        'meta_desc': 'Fast, clean online scientific calculator with keyboard input support, calculation history, and error-free client-side math.',
        'canonical': 'calculator.html',
        'id': 'calculator',
        'name': 'Calculator',
        'subtitle': 'Clean, responsive online calculator with keyboard support, calculation history, and precise arithmetic.',
        'script': '/src/tools/calculator.ts',
        'ws': calc_ws,
        'faq': [
            ("Can I use my physical keyboard?", "Yes! You can type numbers, +, -, *, /, Enter for equals, and Backspace or Escape to clear."),
            ("Does it handle decimal precision accurately?", "Yes, results are rounded to prevent floating-point binary inaccuracies.")
        ]
    },
    {
        'filename': 'stopwatch.html',
        'title': 'Online Stopwatch with Lap & Split Times – Toolora',
        'meta_desc': 'Precise millisecond online stopwatch with lap recording, fastest/slowest lap detection, and keyboard controls.',
        'canonical': 'stopwatch.html',
        'id': 'stopwatch',
        'name': 'Stopwatch',
        'subtitle': 'High-precision online stopwatch with millisecond timing, split lap recording, and keyboard controls.',
        'script': '/src/tools/stopwatch.ts',
        'ws': sw_ws,
        'faq': [
            ("How accurate is the stopwatch?", "It uses performance.now() to measure time with sub-millisecond precision."),
            ("Does it keep running if I switch tabs?", "Yes, elapsed time is calculated from wall-clock timestamps rather than interval counts.")
        ]
    },
    {
        'filename': 'countdown-timer.html',
        'title': 'Online Countdown Timer with Audio Alarm – Toolora',
        'meta_desc': 'Customizable online countdown timer with quick presets, progress display, and a synthesizer audio alarm tone upon finish.',
        'canonical': 'countdown-timer.html',
        'id': 'countdown-timer',
        'name': 'Countdown Timer',
        'subtitle': 'Set customizable countdown timers for productivity, workouts, cooking, or study with quick presets and an audio alarm.',
        'script': '/src/tools/countdown-timer.ts',
        'ws': timer_ws,
        'faq': [
            ("Does the audio alert work offline?", "Yes, the audio tone is generated locally via Web Audio API without downloading external audio files."),
            ("Can I set timers longer than 60 minutes?", "Yes, you can configure hours, minutes, and seconds up to 99 hours.")
        ]
    },
    {
        'filename': 'timezone-converter.html',
        'title': 'World Timezone Converter & Meeting Planner – Toolora',
        'meta_desc': 'Compare current local time across major world timezones (UTC, New York, London, Tokyo, Sydney, Dubai, Mumbai) side-by-side.',
        'canonical': 'timezone-converter.html',
        'id': 'timezone-converter',
        'name': 'Timezone Converter',
        'subtitle': 'Compare times across major world cities side-by-side to plan meetings, webinars, and international travel.',
        'script': '/src/tools/timezone-conv.ts',
        'ws': tz_ws,
        'faq': [
            ("Are Daylight Saving Time (DST) changes handled?", "Yes, your browser's Intl.DateTimeFormat engine automatically accounts for regional daylight saving schedules."),
            ("Can I pick a future time to compare?", "Yes, pick any date and time in the reference picker to see the corresponding times across all cities.")
        ]
    },
    {
        'filename': 'url-encoder.html',
        'title': 'URL Encoder & Decoder with Query Parser – Toolora',
        'meta_desc': 'Encode and decode URLs, query strings, and URI components with query parameter breakdown table.',
        'canonical': 'url-encoder.html',
        'id': 'url-encoder',
        'name': 'URL Encoder / Decoder',
        'subtitle': 'Encode and decode URI strings, query components, and inspect URL parameters in a structured table.',
        'script': '/src/tools/url-encoder.ts',
        'ws': url_ws,
        'faq': [
            ("What does URI encoding do?", "It replaces unsafe ASCII characters with a % followed by two hexadecimal digits (e.g. space becomes %20)."),
            ("Can it parse complex query strings?", "Yes, the Query Parser decomposes URLs into origin, pathname, and all search parameters.")
        ]
    },
    {
        'filename': 'base64-converter.html',
        'title': 'Base64 Encoder & Decoder (UTF-8 & File) – Toolora',
        'meta_desc': 'Encode text and files to Base64 or decode Base64 strings back to clean UTF-8 text with instant copy and byte statistics.',
        'canonical': 'base64-converter.html',
        'id': 'base64-converter',
        'name': 'Base64 Converter',
        'subtitle': 'Encode and decode text and binary files to and from Base64 with full UTF-8 Unicode support.',
        'script': '/src/tools/base64-conv.ts',
        'ws': b64_ws,
        'faq': [
            ("Does this support Unicode and non-Latin characters?", "Yes, it uses TextEncoder and TextDecoder to support all UTF-8 characters without btoa() character errors."),
            ("Can I convert images or files to Base64 data URLs?", "Yes, use the 'Upload File' button to convert any file into a Base64 string.")
        ]
    }
]

for t in TOOLS:
    content = build_page(
        title=t['title'],
        meta_desc=t['meta_desc'],
        canonical=t['canonical'],
        tool_id=t['id'],
        tool_name=t['name'],
        tool_subtitle=t['subtitle'],
        script_path=t['script'],
        workspace_html=t['ws'],
        faq_items=t['faq']
    )
    fpath = os.path.join(PROJECT_DIR, t['filename'])
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created HTML page {t['filename']}")

print("All 18 HTML pages created successfully!")
