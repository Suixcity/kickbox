# Kickbox Email Verification for HubSpot

A HubSpot integration that brings real-time email verification via the [Kickbox API](https://kickbox.com/) directly into your CRM — without leaving HubSpot.

---

## What This Does

This project provides two complementary ways to verify email addresses against the Kickbox API from within HubSpot:

**1. CRM UI Card (On-Demand)**
A custom card embedded in the HubSpot contact record. Sales reps can verify a contact's email address with a single click and see the results instantly — deliverability status, reputation score, and classification flags — written back to the contact record automatically.

**2. Custom Workflow Action (Automated)**
A custom coded action that can be dropped into any HubSpot workflow. Allows operations and marketing teams to automate email verification at key points — for example, vetting a contact before routing to sales, or validating addresses before a marketing send.

Both components write to the same set of custom HubSpot contact properties, giving a consistent view of email quality regardless of how verification was triggered.

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

## License

MIT
