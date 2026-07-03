// Prevent the parent page from auto-scrolling to a Lean playground iframe.
// Sources of unwanted scroll:
//   1. iframe (re)load — browser scrolls the iframe into view.
//   2. iframe gains focus — same.
//   3. Monaco editor inside the iframe calls scrollIntoView() on almost
//      every keystroke/cursor move, which propagates to the parent page.
// Strategy: remember the user's last intentional scroll position and, any
// time the page scrolls while a Lean iframe is the active element, snap
// back to that position.
(function () {
  let savedY = window.scrollY;
  let reverting = false;

  const isIframeActive = () => {
    const el = document.activeElement;
    return !!el && el.tagName === 'IFRAME' && el.classList.contains('lean-playground');
  };

  // Any wheel/touch/keydown/mousedown that reaches the parent window means
  // the user is interacting with the parent page (not with the iframe's
  // internals — those events are trapped inside the iframe). Blur the
  // iframe so the ensuing scroll is not misread as iframe-initiated, and
  // refresh savedY to the position the user is scrolling to.
  const parentIntent = (ev) => {
    if (isIframeActive()) {
      // Don't steal focus back on a click that lands inside the iframe —
      // the browser will just refocus it. For everything else, blur.
      if (!(ev.type === 'mousedown' && ev.target && ev.target.classList &&
            ev.target.classList.contains('lean-playground'))) {
        document.activeElement.blur();
      }
    }
    requestAnimationFrame(() => { savedY = window.scrollY; });
    setTimeout(() => { savedY = window.scrollY; }, 120);
  };
  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => {
    window.addEventListener(ev, parentIntent, { passive: true, capture: true });
  });

  // If a scroll happens while the iframe holds focus, it came from inside
  // the iframe (Monaco scrollIntoView etc.) — undo it.
  window.addEventListener('scroll', () => {
    if (reverting) { reverting = false; return; }
    if (isIframeActive()) {
      if (window.scrollY !== savedY) {
        reverting = true;
        window.scrollTo(0, savedY);
      }
    } else {
      savedY = window.scrollY;
    }
  }, { passive: true });

  const restore = () => {
    const y = savedY;
    // Two rAFs to beat the browser's own scroll-into-view for the iframe.
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  };

  const guard = (iframe) => {
    if (iframe.dataset.leanGuarded) return;
    iframe.dataset.leanGuarded = '1';
    iframe.addEventListener('load', restore);
  };

  const scan = () => {
    document.querySelectorAll('iframe.lean-playground').forEach(guard);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // In case iframes are added later (e.g. by other extensions).
  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
