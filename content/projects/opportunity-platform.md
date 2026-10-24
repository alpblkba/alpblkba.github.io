+++
title = "opportunity-platform"
path = "projects/opportunity-platform"

[extra]
kicker = "rust · axum · react · postgres · self-hosted"
tags = ["rust", "axum", "postgres", "react", "typescript", "docker", "gcp", "linux", "cloudflare"]
source = "https://github.com/alpblkba/opportunity-platform"
+++

A self-hosted system for finding, evaluating and tracking professional and
academic opportunities. It lives at
[opportunities.alpblkba.dev](https://opportunities.alpblkba.dev/), which serves
its own landing page and asks who you are before it shows you anything.

## why

Job and position hunting is a data problem pretending to be a motivation
problem. Postings are scattered, duplicated, often relisted months after they
were filled, and the ranking you get from the usual platforms optimises for
their engagement rather than my fit. I wanted one place that collects the
postings, records where each one actually came from, scores them against facts
I can defend in an interview, and remembers what I already applied to.

It is built for exactly one user. There is no plan for a product.

## scope

Jobs, internships, PhD and research positions, and similar professional
openings. Not a CRM, not a recruiting tool, not an auto-applier.

## architecture

- **Backend** — Rust with Axum, talking to PostgreSQL.
- **Frontend** — React and TypeScript.
- **Database** — PostgreSQL, holding opportunities, sources, candidate facts
  and application state.
- **Deployment** — Docker Compose on Debian Linux, running on a single Google
  Compute Engine `e2-micro` instance.
- **Edge** — Cloudflare Tunnel for ingress, Cloudflare Access in front of it.
  Nothing is exposed directly; there is no public inbound port on the VM.

It is a containerised full-stack application with a few supporting services
around it, not a microservice deployment, and the distinction matters when you
only have one machine to run it on.

## pipeline

1. **Discovery** — opportunities are pulled from configured sources.
2. **Source verification** — each record keeps the origin it was seen at, so a
   posting that cannot be traced back to a real listing can be treated as
   suspect rather than silently trusted.
3. **Matching** — lexical matching against stored candidate facts: skills,
   coursework, projects, experience. Deliberately explainable — every score
   can be traced to the terms that produced it. No embedding black box whose
   output I cannot argue with.
4. **Review** — ranked results are reviewed by hand, and the ones worth acting
   on move into application tracking with their own state.

## resource constraints

The production profile is sized for an `e2-micro`: roughly a gigabyte of RAM,
shared with the database. That shapes the design more than anything else. The
browser-based worker is intentionally disabled in production, so the deployed
system does not drive a headless browser and does not apply to anything on its
own. Deployment runs through a verification step rather than trusting that a
`compose up` means the thing is actually healthy.

## status

Implemented: discovery and ingestion, source tracking, the lexical matching
and ranking path, candidate facts, application tracking and review, the React
workspace, and the containerised deployment with Cloudflare in front.

Planned: native authentication in the application itself (today access is
Cloudflare Access), richer source coverage, better de-duplication across
sources, the browser worker enabled somewhere with memory to spare, and
opening up the repository.
