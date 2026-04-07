#!/usr/bin/env python3
"""
CADI Agentic Search — Site Crawler
Crawls a website and outputs a structured JSON index for use with
the Claude-powered agentic search interface.

Usage:
  python crawl.py --url https://cadi.port.ac.uk --max-pages 300 --output search-index.json
"""

import argparse
import json
import re
import time
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

# ── Configuration ─────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "AgenticSearchCrawler/1.0 (+https://github.com/your-org/your-repo)"
}
REQUEST_TIMEOUT = 15
CRAWL_DELAY = 0.5  # seconds between requests — be polite

# Tags/classes that typically hold main content (adjust per CMS)
CONTENT_SELECTORS = [
    "main", "article", ".main-content", ".field--name-body",
    ".node__content", "#content", ".content", "[role='main']"
]

# Tags to strip from extracted text
NOISE_TAGS = [
    "script", "style", "nav", "header", "footer",
    "aside", ".sidebar", "#sidebar", ".navigation",
    ".breadcrumb", ".cookie-notice", ".search-block"
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def normalise_url(url: str) -> str:
    """Strip fragment and trailing slashes for deduplication."""
    url, _ = urldefrag(url)
    return url.rstrip("/")


def is_crawlable(url: str, base_domain: str, stay_on_domain: bool) -> bool:
    """Return True if this URL should be queued."""
    parsed = urlparse(url)
    # Only HTTP(S)
    if parsed.scheme not in ("http", "https"):
        return False
    # Skip binary/media file extensions
    skip_exts = {".pdf", ".docx", ".xlsx", ".pptx", ".zip", ".jpg", ".jpeg",
                 ".png", ".gif", ".svg", ".mp4", ".mp3", ".webp", ".ico"}
    if any(parsed.path.lower().endswith(ext) for ext in skip_exts):
        return False
    if stay_on_domain and parsed.netloc != base_domain:
        return False
    return True


def extract_text(soup: BeautifulSoup) -> str:
    """Pull meaningful text from a page, stripping noise."""
    for selector in NOISE_TAGS:
        for el in soup.select(selector):
            el.decompose()

    # Try to find the main content area first
    for selector in CONTENT_SELECTORS:
        main = soup.select_one(selector)
        if main:
            return " ".join(main.get_text(separator=" ", strip=True).split())

    # Fall back to body
    body = soup.find("body")
    if body:
        return " ".join(body.get_text(separator=" ", strip=True).split())
    return ""


def extract_meta(soup: BeautifulSoup) -> dict:
    """Extract meta description, og tags, published date."""
    meta = {}

    desc_tag = (
        soup.find("meta", attrs={"name": "description"}) or
        soup.find("meta", attrs={"property": "og:description"})
    )
    if desc_tag:
        meta["description"] = desc_tag.get("content", "").strip()

    date_tag = (
        soup.find("meta", attrs={"property": "article:published_time"}) or
        soup.find("time", attrs={"datetime": True})
    )
    if date_tag:
        meta["date"] = (date_tag.get("content") or date_tag.get("datetime", "")).strip()

    tags = []
    for kw_tag in soup.find_all("meta", attrs={"name": re.compile(r"keywords|tags", re.I)}):
        raw = kw_tag.get("content", "")
        tags.extend([t.strip().lower() for t in raw.split(",") if t.strip()])
    # Drupal taxonomy terms often appear in .field--name-field-tags or similar
    for tag_el in soup.select(".field--name-field-tags a, .tags a, [rel='tag']"):
        tags.append(tag_el.get_text(strip=True).lower())
    meta["tags"] = list(dict.fromkeys(tags))  # dedupe, preserve order

    og_type = soup.find("meta", attrs={"property": "og:type"})
    if og_type:
        meta["og_type"] = og_type.get("content", "").strip()

    return meta


def infer_content_type(url: str, soup: BeautifulSoup) -> str:
    """Heuristic content type from URL patterns and Drupal body classes."""
    path = urlparse(url).path.lower()
    body_cls = " ".join(soup.body.get("class", [])) if soup.body else ""

    if "node-type-event" in body_cls or "/event" in path or "/events" in path:
        return "event"
    if "node-type-news" in body_cls or "/news" in path:
        return "news"
    if "node-type-resource" in body_cls or "/resource" in path:
        return "resource"
    if "node-type-guide" in body_cls or "/guide" in path:
        return "guide"
    return "page"


def get_robots(base_url: str) -> RobotFileParser:
    rp = RobotFileParser()
    rp.set_url(urljoin(base_url, "/robots.txt"))
    try:
        rp.read()
    except Exception:
        pass
    return rp


# ── Main Crawler ───────────────────────────────────────────────────────────────

def crawl(target_url: str, max_pages: int, stay_on_domain: bool) -> dict:
    session = requests.Session()
    session.headers.update(HEADERS)

    base_domain = urlparse(target_url).netloc
    robots = get_robots(target_url)

    queue = [normalise_url(target_url)]
    visited = set()
    pages = []
    errors = []

    print(f"Starting crawl: {target_url} (max {max_pages} pages, stay_on_domain={stay_on_domain})")

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        # Respect robots.txt
        if not robots.can_fetch(HEADERS["User-Agent"], url):
            print(f"  [robots] Skipping {url}")
            continue

        try:
            resp = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            if resp.status_code != 200:
                errors.append({"url": url, "status": resp.status_code})
                continue

            content_type = resp.headers.get("Content-Type", "")
            if "text/html" not in content_type:
                continue

            soup = BeautifulSoup(resp.text, "lxml")
            title = (soup.title.get_text(strip=True) if soup.title else url)
            text = extract_text(soup)
            meta = extract_meta(soup)
            ctype = infer_content_type(url, soup)

            # Truncate content for index (keep first 1500 chars)
            excerpt = text[:300].rstrip() + ("…" if len(text) > 300 else "")
            content_snippet = text[:1500]

            page_record = {
                "id": len(pages) + 1,
                "url": url,
                "title": title,
                "excerpt": excerpt,
                "content": content_snippet,
                "type": ctype,
                "tags": meta.get("tags", []),
                "date": meta.get("date", ""),
                "description": meta.get("description", ""),
            }
            pages.append(page_record)
            print(f"  [{len(pages):>4}] {title[:70]}")

            # Discover new links
            for a in soup.find_all("a", href=True):
                href = urljoin(url, a["href"])
                href = normalise_url(href)
                if href not in visited and is_crawlable(href, base_domain, stay_on_domain):
                    queue.append(href)

            time.sleep(CRAWL_DELAY)

        except requests.RequestException as e:
            errors.append({"url": url, "error": str(e)})
            print(f"  [error] {url}: {e}")

    print(f"\nCrawl complete: {len(pages)} pages indexed, {len(errors)} errors")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_url": target_url,
        "total_pages": len(pages),
        "pages": pages,
        "errors": errors,
    }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crawl a website and produce a search index JSON file.")
    parser.add_argument("--url", required=True, help="Root URL to start crawling from")
    parser.add_argument("--max-pages", type=int, default=300, help="Max pages to crawl")
    parser.add_argument("--stay-on-domain", type=lambda v: v.lower() == "true", default=True)
    parser.add_argument("--output", default="search-index.json", help="Output JSON file path")
    args = parser.parse_args()

    index = crawl(args.url, args.max_pages, args.stay_on_domain)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Index written to {args.output}")
