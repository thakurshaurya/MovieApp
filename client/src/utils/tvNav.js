/**
 * D-Pad & TV Remote Spatial Navigation Helper
 * Handles UP, DOWN, LEFT, RIGHT, ENTER/OK, and BACK on Android TV remotes.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
  ".movie-card",
  ".continue-watching-card",
  ".hero-actions a",
  ".cast-card",
  ".episode-card"
].join(", ");

function getVisibleFocusableElements() {
  const elements = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    // Check if element is attached and visible
    if (!el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

function findBestCandidate(currentEl, direction, candidates) {
  const currentRect = currentEl.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2
  };

  let bestCandidate = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    if (el === currentEl) continue;
    const r = el.getBoundingClientRect();
    const c = {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2
    };

    const dx = c.x - currentCenter.x;
    const dy = c.y - currentCenter.y;

    // Check direction validity
    let isValidDirection = false;
    let primaryDist = 0;
    let secondaryDist = 0;

    switch (direction) {
      case "right":
        if (c.x > currentCenter.x + 4) {
          isValidDirection = true;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
        }
        break;
      case "left":
        if (c.x < currentCenter.x - 4) {
          isValidDirection = true;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
        }
        break;
      case "down":
        if (c.y > currentCenter.y + 4) {
          isValidDirection = true;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
        }
        break;
      case "up":
        if (c.y < currentCenter.y - 4) {
          isValidDirection = true;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
        }
        break;
    }

    if (!isValidDirection) continue;

    // Weighted distance score: heavily penalize distance along the secondary axis
    // to preserve row/column affinity
    const score = primaryDist + secondaryDist * 2.5;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = el;
    }
  }

  return bestCandidate;
}

export function initTvNavigation() {
  if (typeof window === "undefined") return () => {};

  function handleKeyDown(e) {
    if (window.__TV_NAV_PAUSED__) return;

    const key = e.key;
    const keyCode = e.keyCode;

    // Detect DPAD / Remote keys
    // Left: ArrowLeft (37), Right: ArrowRight (39), Up: ArrowUp (38), Down: ArrowDown (40)
    // Enter/Select: Enter (13), Back: Escape (27) or BrowserBack
    let direction = null;
    if (key === "ArrowRight" || keyCode === 39) direction = "right";
    else if (key === "ArrowLeft" || keyCode === 37) direction = "left";
    else if (key === "ArrowDown" || keyCode === 40) direction = "down";
    else if (key === "ArrowUp" || keyCode === 38) direction = "up";

    if (direction) {
      const candidates = getVisibleFocusableElements();
      if (candidates.length === 0) return;

      let active = document.activeElement;
      if (!active || active === document.body || !candidates.includes(active)) {
        // Set focus to the first visible candidate (or hero action / first card)
        const first = candidates.find(c => {
          const r = c.getBoundingClientRect();
          return r.top >= 0 && r.top < window.innerHeight;
        }) || candidates[0];
        if (first) {
          e.preventDefault();
          first.focus();
          first.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
        }
        return;
      }

      const next = findBestCandidate(active, direction, candidates);
      if (next) {
        e.preventDefault();
        next.focus();
        next.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });

        // If inside a scroll row, ensure row scrolls to show focused item
        const scrollParent = next.closest(".movie-row, .cast-scroll-row, .continue-watching-row, .tv-rail-row, .tv-episodes-row");
        if (scrollParent) {
          const nextRect = next.getBoundingClientRect();
          const parentRect = scrollParent.getBoundingClientRect();
          if (nextRect.left < parentRect.left) {
            scrollParent.scrollLeft += nextRect.left - parentRect.left - 32;
          } else if (nextRect.right > parentRect.right) {
            scrollParent.scrollLeft += nextRect.right - parentRect.right + 32;
          }
        }
      }
      return;
    }

    // Remote Select / Enter
    if (key === "Enter" || keyCode === 13) {
      const active = document.activeElement;
      if (active && active !== document.body) {
        // Trigger click if it's an actionable element
        active.click();
      }
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}
