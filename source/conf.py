# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

from urllib.parse import urlencode

import lzstring
from docutils import nodes
from docutils.parsers.rst import Directive, directives


LEAN_PLAYGROUND_BASE = "https://live.lean-lang.org/"
LEAN_PLAYGROUND_DEFAULT_QUERY = {
    "abbreviationCharacter": "\\",
    "acceptSuggestionOnEnter": "false",
    "showGoalNames": "true",
    "showExpectedType": "true",
    "compress": "true",
    "theme": "light",
    "wordWrap": "true",
}

_LZ = lzstring.LZString()


def _encode_lean_source(src: str) -> str:
    """Compress Lean source the same way live.lean-lang.org expects in #codez."""
    return _LZ.compressToEncodedURIComponent(src.rstrip("\n"))


class LeanPlaygroundDirective(Directive):
    """Embed the Lean 4 web playground.

    Three calling styles (in order of precedence):

    1. Body content = raw Lean source; it is LZ-String compressed at build time::

           ```{lean-playground}
           :height: 600px

           example : 1 + 1 = 2 := by rfl
           ```

    2. Argument is a full ``http(s)://`` URL — used verbatim::

           ```{lean-playground} https://live.lean-lang.org/?...#codez=...
           ```

    3. Argument is an already-encoded ``codez`` payload (backwards compatible)::

           ```{lean-playground} C4Cwpg9gTmC2AEYC...
           ```
    """

    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = False
    has_content = True
    option_spec = {
        "width": directives.unchanged,
        "height": directives.unchanged,
        "max-width": directives.unchanged,
        "title": directives.unchanged,
        "theme": directives.unchanged,         # light | dark
        "word-wrap": directives.unchanged,     # true | false
    }

    def _build_src(self) -> str:
        arg = self.arguments[0].strip() if self.arguments else ""
        body = "\n".join(self.content).strip("\n") if self.content else ""

        if body:
            codez = _encode_lean_source(body)
        elif arg.startswith(("http://", "https://")):
            return arg
        elif arg:
            codez = arg  # already-encoded payload
        else:
            raise self.error(
                "lean-playground: needs either a Lean source body, a full URL "
                "argument, or an encoded codez argument."
            )

        query = dict(LEAN_PLAYGROUND_DEFAULT_QUERY)
        if "theme" in self.options:
            query["theme"] = self.options["theme"]
        if "word-wrap" in self.options:
            query["wordWrap"] = self.options["word-wrap"]
        return f"{LEAN_PLAYGROUND_BASE}?{urlencode(query)}#codez={codez}"

    def run(self):
        src = self._build_src()
        width = self.options.get("width", "99%")
        height = self.options.get("height", "600px")
        max_width = self.options.get("max-width", "1000px")
        title = self.options.get("title", "Lean Playground")

        # Always crop the top 40px (cross-origin iframe top menu bar):
        # render the iframe 40px taller, pull it up via negative margin so the
        # layout box stays `height` tall, then clip-path hides the overflowing
        # top strip visually.
        offset = "40px"
        style = (
            f"display:block; width:{width}; max-width:{max_width}; "
            f"height:calc({height} + {offset}); margin-top:-{offset}; "
            f"clip-path:inset({offset} 0 0 0); "
            f"border:0; contain:layout size; transition:none;"
        )

        html = (
            f'<iframe src="{src}" class="lean-playground" tabindex="-1" '
            f'style="{style}" loading="lazy" title="{title}"></iframe>'
        )
        return [nodes.raw("", html, format="html")]


def setup(app):
    app.add_directive("lean-playground", LeanPlaygroundDirective)
    app.add_js_file("lean-playground.js")
    return {"version": "0.4", "parallel_read_safe": True}


# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = '随便写写'
copyright = '2026, shizhilvren@foxmail.com'
author = 'shizhilvren@foxmail.com'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration


extensions = [
    'myst_parser',
    'sphinx.ext.mathjax',
]

myst_enable_extensions = [
    'dollarmath',   # $...$ and $$...$$
    'amsmath',      # \begin{align} ... \end{align} blocks
]

source_suffix = {
    '.rst': 'restructuredtext',
    '.txt': 'markdown',
    '.md': 'markdown',
    '.ipynb': 'markdown',
}

templates_path = ['_templates']
exclude_patterns = []

language = 'zh_CN'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "furo"
# html_theme = 'alabaster'
html_static_path = ['_static']

html_title = "shizhilvren的一些记录"
