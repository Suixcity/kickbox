# Kickbox Email Verification for HubSpot

A HubSpot integration that brings real-time email verification via the [Kickbox API](https://kickbox.com/) directly into your CRM — without leaving HubSpot.

---

## What This Does

This project provides two complementary ways to verify email addresses against the Kickbox API from within HubSpot:

**1. CRM UI Card (On-Demand)**
A custom card embedded in the HubSpot contact record. Sales reps can verify a contact's email address with a single click — the results are displayed instantly on the card *and* written back to the contact's properties automatically, including deliverability status, reputation score, and classification flags.

**2. Custom Workflow Action (Automated)**
A custom coded action that can be dropped into any HubSpot workflow. Allows operations and marketing teams to automate email verification at key points — for example, vetting a contact before routing to sales, or validating addresses before a marketing send.

Both components write to the same set of custom HubSpot contact properties, giving a consistent view of email quality regardless of how verification was triggered.

---

## Requirements

| Feature | Required HubSpot tier |
|---|---|
| CRM UI Card | Any Hub **Enterprise** |
| Workflow Action | **Operations Hub Professional** or Enterprise |

> Both features are available for free using a [HubSpot developer test account](https://developers.hubspot.com/get-started), which is recommended for evaluation and testing.

---

## Tech Stack

- React 18 — UI extensions
- Node.js (Serverless) — backend functions
- HubSpot UI Extensions & CRM API
- Kickbox API v2

---

## Implementation Guides

| Guide | Description |
|---|---|
| [Prerequisites](docs/prerequisites.md) | Start here — account setup, CLI, and dependencies |
| [UI Card Guide](docs/guide-ui-card.md) | Install the CRM card for on-demand verification |
| [Workflow Action Guide](docs/guide-workflow-action.md) | Set up automated verification in HubSpot workflows |

---

## Properties Created

After setup, the following custom properties will be available on all HubSpot contact records:

| Property | Type | Description |
|---|---|---|
| `kickbox_result` | Enumeration | Deliverable / Risky / Undeliverable / Unknown |
| `kickbox_reason` | Enumeration | Specific reason code for the result |
| `kickbox_sendex` | Number | Email reputation score (0–1) |
| `kickbox_disposable` | Boolean | Disposable email domain detected |
| `kickbox_accept_all` | Boolean | Domain accepts all emails |
| `kickbox_role` | Boolean | Role-based address (e.g. support@, info@) |
| `kickbox_free` | Boolean | Free email provider (e.g. Gmail, Yahoo) |
| `kickbox_email_normalized` | String | Normalised version of the email |
| `kickbox_did_you_mean` | String | Suggested correction for misspelled emails |
| `kickbox_success` | Boolean | Whether the API call succeeded |
| `kickbox_verification_date` | Date | Timestamp of the last verification |

---

## Platform Version & Known Issues

This project currently runs on HubSpot project platform **v2025.1**.

HubSpot has marked v2025.1 as unsupported after **1 August 2026**, and recommends migrating to v2025.2. However, **v2025.2 removes support for serverless functions** — which this project depends on for all backend verification logic. Serverless is scheduled to return in platform **v2026.03**, targeted for release on **30 March 2026**.

The intended upgrade path is to skip v2025.2 entirely and migrate directly to **v2026.03** once it is available. This repo will be updated at that time.

> **On HubSpot's versioning consistency:** HubSpot's platform versioning has been notably unstable — features have been dropped and reintroduced between minor versions, and naming conventions have shifted without warning (for example, the HubSpot CLI still labels this project's app as a `[private app]` in its build output, while the HubSpot UI now lists it under **Development → Legacy Apps**). If you encounter unexpected build errors or missing UI paths, check the [developer changelog](https://developers.hubspot.com/changelog) and the current [migration guide](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/migrate-an-app/migrate-an-existing-private-app) before assuming something is broken in this project.

---

## License

MIT
