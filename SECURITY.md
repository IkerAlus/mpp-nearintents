# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities in this package privately to
**iker.alustiza@nearone.org** (package maintainer, Near One). Do not open a
public issue for security reports.

For vulnerabilities in the NEAR Intents settlement infrastructure itself
(1Click API, `intents.near` verifier, bridges), see the NEAR Intents
documentation at https://docs.near-intents.org for the current disclosure
channel and bug bounty program.

## Scope notes

- This package never holds funds. Deposits are custodied by the NEAR Intents
  settlement system for the duration of a swap (see the trust model section of
  the spec in `docs/spec/`).
- The 1Click JWT (`ONE_CLICK_JWT`) is a server-side secret. Report any code
  path that could leak it into a challenge, receipt, or log as a vulnerability.
