import { useState, useCallback, useRef } from "react";

// ── Sample CADI content index (mirrors what crawl.py would produce) ───────────
const SAMPLE_INDEX = [
  { id: 1, url: "https://cadi.port.ac.uk/cpd-support", title: "CPD and Support", excerpt: "The main hub for Continuing Professional Development opportunities at the University of Portsmouth.", content: "CPD opportunities including workshops on active blended learning, assessment design, digital tools, AdvanceHE fellowship pathways, PGCertHE, and peer observation schemes. Timetabled sessions throughout the academic year. Book workshops, find resources, connect with CADI colleagues.", type: "page", tags: ["cpd", "professional development", "fellowship", "workshops", "training"], date: "2026-03-01" },
  { id: 2, url: "https://cadi.port.ac.uk/fellowship", title: "AdvanceHE Fellowship", excerpt: "Routes to achieving Fellowship of AdvanceHE (HEA) — Associate, Fellow, Senior Fellow, Principal Fellow.", content: "Fellowship pathways: D1 Associate Fellow, D2 Fellow (FHEA), D3 Senior Fellow, D4 Principal Fellow. PGCertHE leads to fellowship. CATE awards. Supported application process. Evidence-based descriptors. Portsmouth Pathways. How do I get AdvanceHE fellowship?", type: "page", tags: ["fellowship", "advancehe", "hea", "pgcerthe", "cate"], date: "2026-02-14" },
  { id: 3, url: "https://cadi.port.ac.uk/apex", title: "APEX — Academic Practice Enhancement", excerpt: "APEX is the University's external platform for academic practice enhancement.", content: "APEX provides resources and tools for academic practice. External platform accessible via SSO login. Covers research support, teaching practice, and professional development resources. Direct access: apex.port.ac.uk", type: "page", tags: ["apex", "academic practice", "external tool", "research"], date: "2026-01-20", externalLink: "https://apex.port.ac.uk" },
  { id: 4, url: "https://cadi.port.ac.uk/learning-teaching-conference-2026", title: "Learning and Teaching Conference 2026", excerpt: "Annual conference showcasing innovative teaching practice. Call for papers now open.", content: "2026 Learning and Teaching Conference to be held June 2026. Call for papers open — submit proposals for workshops, presentations, and posters. Theme: Connected Curriculum. Keynote speakers TBC. Register your interest.", type: "event", tags: ["conference", "learning and teaching", "call for papers", "ltc2026"], date: "2026-06-15" },
  { id: 5, url: "https://cadi.port.ac.uk/active-blended-learning", title: "Active Blended Learning (ABL)", excerpt: "The ABL framework underpins curriculum design at the University of Portsmouth.", content: "Active Blended Learning combines online and face-to-face activities. Seven learning types: assimilative, finding and handling information, communicative, productive, experiential, interactive, adaptive. An Introduction to Active Blended Learning workshop available. Guides curriculum design decisions and module planning.", type: "page", tags: ["active blended learning", "abl", "pedagogy", "curriculum design", "learning types"], date: "2025-09-01" },
  { id: 6, url: "https://cadi.port.ac.uk/assessment-information-resource", title: "Assessment Information Resource (AIR)", excerpt: "Guidance on assessment design, authentic assessment, categorical marking, and reasonable adjustments.", content: "Assessment Information Resource: authentic assessment design, categorical marking guidance, reasonable adjustments and assessment, assessment choice, learning outcomes alignment, assessment criteria writing. Policy documents and templates. Assessment for large cohorts.", type: "resource", tags: ["assessment", "air", "authentic assessment", "categorical marking", "reasonable adjustments"], date: "2026-01-10" },
  { id: 7, url: "https://cadi.port.ac.uk/peer-observation", title: "Peer Observation", excerpt: "The peer observation scheme supports reflective teaching through collaborative observation.", content: "Peer observation for professional development. ObserveWell platform for recording observations. Different models: paired, triadic, developmental. Observe, reflect, and discuss. Forms and guidance available. Observation links to fellowship evidence portfolio. Teaching observation form.", type: "page", tags: ["peer observation", "observe", "observewell", "teaching practice", "reflection"], date: "2025-11-01" },
  { id: 8, url: "https://cadi.port.ac.uk/enable", title: "enABLe — Inclusive Curriculum", excerpt: "enABLe supports inclusive curriculum design and accessible learning resources.", content: "enABLe programme: inclusive curriculum design, accessible resources, accessibility guidelines, Universal Design for Learning (UDL), reasonable adjustments, inclusive practice. Workshops and resources. Accessible resources creation guidance.", type: "page", tags: ["enable", "accessibility", "inclusive curriculum", "udl", "accessible resources"], date: "2025-10-15" },
  { id: 9, url: "https://cadi.port.ac.uk/connected-curriculum", title: "Connected Curriculum", excerpt: "The Connected Curriculum framework connects learning across six dimensions.", content: "Connected Curriculum framework: students connect with research/enquiry, with progression, with research community, to the wider world, with each other across disciplines, and to their own lives. Guidance on connected curriculum design. Blended and connected learning.", type: "page", tags: ["connected curriculum", "curriculum design", "research", "blended and connected"], date: "2025-08-01" },
  { id: 10, url: "https://cadi.port.ac.uk/panopto", title: "Panopto — Video Capture", excerpt: "Panopto is the University's video capture and streaming platform.", content: "Panopto: lecture recording, screen capture, Smart Capture for automated recording, video streaming, student video assignments. Integrated with Moodle. Accessibility captioning guidance. CADI support for Panopto setup.", type: "resource", tags: ["panopto", "video", "smart capture", "lecture recording", "moodle"], date: "2026-02-01" },
  { id: 11, url: "https://cadi.port.ac.uk/cpd-timetable", title: "CPD Timetable", excerpt: "View and book upcoming CPD sessions, workshops and events.", content: "Full CPD timetable: ABL workshops, assessment design, digital tools, fellowship preparation, peer observation, inclusive curriculum. CPD sessions and timetables. CPD calendar. CPD opportunities and timetable. Book via direct links. CPD catalogue.", type: "page", tags: ["cpd", "timetable", "calendar", "workshops", "sessions", "catalogue"], date: "2026-04-01" },
  { id: 12, url: "https://cadi.port.ac.uk/prepup", title: "PrepUP — Student Academic Preparation", excerpt: "PrepUP helps students prepare for university-level study.", content: "PrepUP provides academic preparation resources for students. Study skills, academic writing, referencing, time management. Available to all University of Portsmouth students.", type: "resource", tags: ["prepup", "study skills", "students", "academic preparation"], date: "2025-09-15" },
  { id: 13, url: "https://cadi.port.ac.uk/moodle-tools", title: "Moodle Tools for Teaching", excerpt: "Guidance on using Moodle tools to enhance student learning.", content: "Moodle tools for teaching: quizzes, forums, H5P interactive content, gradebook, Turnitin integration, attendance, feedback. Moodle resources for module design. Digital tools for blended learning.", type: "resource", tags: ["moodle", "digital tools", "vle", "teaching"], date: "2026-01-05" },
  { id: 14, url: "https://cadi.port.ac.uk/learning-outcomes", title: "Writing Learning Outcomes", excerpt: "Guidance on writing clear, measurable learning outcomes aligned to assessment.", content: "Learning outcomes: how to write SMART learning outcomes, Bloom's taxonomy, alignment with assessment criteria, module design. Writing declaration guidance. Constructive alignment.", type: "page", tags: ["learning outcomes", "module design", "bloom", "constructive alignment"], date: "2025-10-20" },
  { id: 15, url: "https://cadi.port.ac.uk/padlet", title: "Padlet for Collaborative Learning", excerpt: "Using Padlet to facilitate collaborative and active learning activities.", content: "Padlet for collaborative learning: digital walls, brainstorming, student voice, formative assessment, group work. Getting started guide. Examples of use in teaching.", type: "resource", tags: ["padlet", "collaboration", "active learning", "digital tools"], date: "2026-02-10" },
];

// External links that should surface prominently
const EXTERNAL_LINKS = [
  { name: "APEX", url: "https://apex.port.ac.uk", description: "Academic Practice Enhancement Platform — direct access", keywords: ["apex", "academic practice enhancement"] },
  { name: "Moodle (VLE)", url: "https://moodle.port.ac.uk", description: "University Virtual Learning Environment", keywords: ["moodle", "vle"] },
  { name: "ObserveWell", url: "https://observewell.port.ac.uk", description: "Peer observation recording platform", keywords: ["observewell", "observe", "peer observation"] },
];

const TYPE_CONFIG = {
  page:     { bg: "#E8F0FE", text: "#1557B0", label: "Page" },
  event:    { bg: "#FEF3E2", text: "#B45309", label: "Event" },
  resource: { bg: "#DCFCE7", text: "#166534", label: "Resource" },
  guide:    { bg: "#F3E8FF", text: "#6B21A8", label: "Guide" },
};

const SCORE_COLOR = (s) => s >= 80 ? "#166534" : s >= 60 ? "#1557B0" : "#555";

const EXAMPLE_QUERIES = [
  "How do I get AdvanceHE Fellowship?",
  "CPD workshops coming up",
  "Peer observation forms",
  "Accessible resources for students",
  "Learning and teaching conference",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CADIAgenticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState("");
  const inputRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSubmitted(trimmed);

    const systemPrompt = `You are an intelligent search agent for the CADI (Centre for Academic and Digital Innovation) website at the University of Portsmouth.

Given a search query from a staff member, analyse the provided content index and return the most relevant results.

IMPORTANT RULES:
- Understand intent: "cpd timetable" means they want the schedule of upcoming CPD sessions
- Expand abbreviations: "ABL" = Active Blended Learning, "AIR" = Assessment Information Resource, "APEX" = Academic Practice Enhancement, etc.
- Prioritise the CPD and Support page (id 1) for general CPD/professional development queries
- Consider partial matches, synonyms, and common misspellings
- Return 3-5 results maximum, only those with relevance_score >= 35
- Note content gaps honestly when a topic genuinely has no coverage

Respond ONLY with valid JSON — no preamble, no markdown fences:
{
  "reasoning": "1-2 sentence explanation of how you interpreted this query",
  "query_interpretation": "What the user is likely looking for",
  "results": [
    { "id": <number>, "relevance_score": <0-100>, "relevance_reason": "Why this matches (max 15 words)" }
  ],
  "content_gap": "Description of missing content if relevant, otherwise null",
  "suggestions": ["alternative query 1", "alternative query 2"]
}`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: `Search query: "${trimmed}"\n\nContent index:\n${JSON.stringify(SAMPLE_INDEX.map(p => ({ id: p.id, title: p.title, excerpt: p.excerpt, content: p.content.slice(0, 400), type: p.type, tags: p.tags, date: p.date })), null, 2)}`
          }]
        })
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      const enriched = (parsed.results || [])
        .map(r => ({ ...SAMPLE_INDEX.find(p => p.id === r.id), ...r }))
        .filter(r => r.url)
        .sort((a, b) => b.relevance_score - a.relevance_score);

      // Surface external links if relevant
      const lq = trimmed.toLowerCase();
      const externalMatches = EXTERNAL_LINKS.filter(el =>
        el.keywords.some(k => lq.includes(k))
      );

      setResults({ ...parsed, results: enriched, externalMatches });
    } catch (e) {
      setError(e.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e) => { if (e.key === "Enter") runSearch(query); };

  return (
    <div style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "linear-gradient(160deg, #0f1e38 0%, #1b2a4a 50%, #0d1929 100%)",
      minHeight: "100vh",
      padding: "0",
      color: "#e8edf4"
    }}>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(201,168,76,0.25)",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#c9a84c", letterSpacing: 1 }}>CADI</span>
          <span style={{ fontSize: 10, color: "#8899b8", letterSpacing: 2, textTransform: "uppercase", marginTop: -2 }}>Centre for Academic & Digital Innovation</span>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(201,168,76,0.3)", margin: "0 12px" }} />
        <span style={{ fontSize: 13, color: "#8899b8", letterSpacing: 1.5, textTransform: "uppercase" }}>Agentic Search · Demo</span>
        <div style={{
          marginLeft: "auto", fontSize: 11, background: "rgba(201,168,76,0.12)",
          border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12,
          padding: "3px 12px", color: "#c9a84c", letterSpacing: 1
        }}>Powered by Claude</div>
      </div>

      {/* Search area */}
      <div style={{ padding: "48px 32px 32px", maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 400,
          color: "#f0f4fa",
          margin: "0 0 8px",
          lineHeight: 1.2
        }}>
          Find what you<br /><em style={{ color: "#c9a84c" }}>need to know</em>
        </h1>
        <p style={{ fontSize: 15, color: "#8899b8", margin: "0 0 28px" }}>
          AI-powered search across CADI resources, CPD, events and tools
        </p>

        {/* Search box */}
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: fellowship, CPD timetable, peer observation…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "18px 64px 18px 22px",
              fontSize: 17, borderRadius: 14,
              background: "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(201,168,76,0.3)",
              color: "#f0f4fa", outline: "none",
              backdropFilter: "blur(12px)",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#c9a84c"}
            onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.3)"}
          />
          <button
            onClick={() => runSearch(query)}
            disabled={loading}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: loading ? "rgba(201,168,76,0.4)" : "#c9a84c",
              border: "none", borderRadius: 10, padding: "10px 14px",
              cursor: loading ? "default" : "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {loading ? (
              <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid #1b2a4a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b2a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </button>
        </div>

        {/* Example prompts */}
        {!results && !loading && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => { setQuery(q); runSearch(q); }}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#aab8d0",
                  cursor: "pointer", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(201,168,76,0.15)"; e.target.style.borderColor = "rgba(201,168,76,0.4)"; e.target.style.color = "#c9a84c"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.color = "#aab8d0"; }}
              >{q}</button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#8899b8", letterSpacing: 1 }}>
                Searching across {SAMPLE_INDEX.length} pages…
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#c9a84c",
                    animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, color: "#fca5a5", fontSize: 14 }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div style={{ marginTop: 32 }}>
            {/* Meta bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontSize: 13, color: "#8899b8" }}>Results for </span>
                <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 600 }}>"{submitted}"</span>
                <span style={{ fontSize: 13, color: "#8899b8" }}> — {results.results.length} match{results.results.length !== 1 ? "es" : ""}</span>
              </div>
              <button onClick={() => { setResults(null); setQuery(""); setSubmitted(""); inputRef.current?.focus(); }}
                style={{ fontSize: 12, color: "#8899b8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Clear
              </button>
            </div>

            {/* AI reasoning chip */}
            {results.reasoning && (
              <div style={{
                marginBottom: 20, padding: "12px 16px",
                background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start"
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>✦</span>
                <div>
                  <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>AI Interpretation</div>
                  <div style={{ fontSize: 13, color: "#c4cedc", lineHeight: 1.5 }}>{results.reasoning}</div>
                </div>
              </div>
            )}

            {/* External links */}
            {results.externalMatches?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#8899b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Direct External Link</div>
                {results.externalMatches.map(el => (
                  <a key={el.url} href={el.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "14px 18px", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#f0f4fa", fontSize: 15 }}>↗ {el.name}</div>
                        <div style={{ fontSize: 13, color: "#8899b8", marginTop: 2 }}>{el.description}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#8899b8" }}>{el.url.replace("https://", "")}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Result cards */}
            {results.results.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#8899b8", fontSize: 15 }}>
                No strong matches found for this query.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.results.map((r, idx) => {
                const tc = TYPE_CONFIG[r.type] || TYPE_CONFIG.page;
                return (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, padding: "18px 20px",
                      display: "flex", gap: 16, alignItems: "flex-start",
                      transition: "all 0.18s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    >
                      {/* Rank */}
                      <div style={{ fontSize: 13, color: "#4a6080", fontWeight: 700, minWidth: 20, paddingTop: 1 }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 16, color: "#f0f4fa" }}>{r.title}</span>
                          <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 10, background: tc.bg, color: tc.text, fontWeight: 600 }}>{tc.label}</span>
                          {r.date && <span style={{ fontSize: 11, color: "#8899b8" }}>{new Date(r.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>}
                        </div>
                        <div style={{ fontSize: 14, color: "#aab8d0", lineHeight: 1.5, marginBottom: 8 }}>{r.excerpt}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {r.tags?.slice(0, 4).map(t => (
                              <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "#7a90a8" }}>{t}</span>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ fontSize: 11, color: "#8899b8", fontStyle: "italic" }}>{r.relevance_reason}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: SCORE_COLOR(r.relevance_score) }}>
                              {r.relevance_score}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Content gap */}
            {results.content_gap && (
              <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#a855f7", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Content Gap Detected</div>
                <div style={{ fontSize: 13, color: "#c4cedc" }}>{results.content_gap}</div>
              </div>
            )}

            {/* Suggestions */}
            {results.suggestions?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, color: "#8899b8" }}>Try also: </span>
                {results.suggestions.map(s => (
                  <button key={s} onClick={() => { setQuery(s); runSearch(s); }}
                    style={{ background: "none", border: "none", color: "#c9a84c", fontSize: 13, cursor: "pointer", textDecoration: "underline", marginRight: 8 }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-6px); opacity: 1; } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(136,153,184,0.7); }
      `}</style>
    </div>
  );
}
