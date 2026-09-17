# RaktSetu 🩸

RaktSetu is a blood donation and blood-management platform designed to connect donors, patients/requesters, hospitals, and blood banks through a single workflow.

## Live Application

- Live app: https://raktsetu.hatchable.site
## Problem

During urgent blood requirements, patients and hospitals may struggle to identify compatible donors, locate available inventory, and track responses. RaktSetu brings these activities into one platform with role-based portals and blood-group compatibility matching.

## Objectives

- Connect blood donors with people requesting blood.
- Provide blood-group compatible donor discovery.
- Track blood requests from creation to fulfillment.
- Help hospitals and blood banks manage inventory.
- Highlight critical and emergency requests.
- Maintain inventory transaction history for operational auditing.
- Provide role-based access for donors, requesters, hospitals, and blood banks.

## Main Features

### Donor
- Donor profile and blood group
- Availability toggle
- Donation history
- Matching blood requests
- Accept/decline donor requests
- Notifications

### Requester / Patient
- Create blood requests
- Emergency SOS requests
- Track request status
- View donor responses
- View inventory fulfillment information

### Hospital / Blood Bank
- Operations Center
- Inventory overview and management
- Add, remove, or set stock
- Inventory status tracking
- Request management
- Find compatible donors
- Audit history

### Public Discovery
- Search blood availability by blood group
- Filter by city/area/facility
- Filter by required units
- Donor Discovery Center for currently available donors

## Blood Compatibility

The smart matching workflow uses standard ABO/Rh donor compatibility rules represented in the application as:

| Requested donor group | Compatible donor groups |
|---|---|
| O- | O- |
| O+ | O-, O+ |
| A- | O-, A- |
| A+ | O-, O+, A-, A+ |
| B- | O-, B- |
| B+ | O-, O+, B-, B+ |
| AB- | O-, A-, B-, AB- |
| AB+ | O-, O+, A-, A+, B-, B+, AB-, AB+ |

Exact blood-group matches are prioritized, and same-city donors are prioritized when available.

## Request Lifecycle

```text
Open
  ↓
Donor Accepted
  ↓
Donor Contacted
  ↓
Fulfilled
```

Emergency requests are highlighted separately so critical cases can receive faster attention.

## Architecture

```text
┌──────────────────────────────┐
│        Web Frontend          │
│ HTML + CSS + JavaScript      │
└──────────────┬───────────────┘
               │ /api/*
               ▼
┌──────────────────────────────┐
│ Hatchable Serverless APIs    │
│ Requests / Matching /        │
│ Inventory / Donors / Auth    │
└──────────────┬───────────────┘
               │ SQL
               ▼
┌──────────────────────────────┐
│ PostgreSQL Database           │
│ Profiles / Requests /        │
│ Inventory / Responses /      │
│ Notifications / Audit        │
└──────────────────────────────┘
```

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Hatchable serverless API functions
- **Database:** PostgreSQL
- **Authentication:** Hatchable managed email authentication
- **Hosting:** Hatchable
- **API communication:** Fetch / JSON

## Project Structure

```text
raktsetu/
├── api/
│   ├── camps.js
│   ├── dashboard.js
│   ├── donations.js
│   ├── donor-discovery.js
│   ├── inventory.js
│   ├── inventory-actions.js
│   ├── matches.js
│   ├── me.js
│   ├── my-donations.js
│   ├── my-requests.js
│   ├── notifications.js
│   ├── overview.js
│   ├── profile.js
│   ├── profiles.js
│   ├── request-actions.js
│   └── requests.js
├── migrations/
│   ├── 001_demo_requests.sql
│   ├── 002_core_schema.sql
│   ├── 003_requests.sql
│   ├── 004_inventory.sql
│   ├── 005_operations.sql
│   ├── 006_user_accounts.sql
│   ├── 007_donor_responses.sql
│   ├── 008_request_fulfillment.sql
│   ├── 009_inventory_management.sql
│   └── 010_emergency_alerts.sql
├── public/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── login.html
│   ├── portal.html
│   ├── dashboard.html
│   ├── discovery.html
│   └── operator.html
├── hatchable.toml
├── seed.sql
└── README.md
```

## Database Entities

- `profiles` — donor/operator profile information
- `user_profiles` — authenticated user's application profile
- `blood_requests` — blood requirements and request status
- `donor_responses` — donor responses to requests
- `inventory` — blood stock by blood group, facility, and city
- `inventory_transactions` — stock change audit trail
- `user_notifications` — user-specific notifications
- `donations` — donation history
- `camps` — blood donation camp information

## Important API Routes

```text
GET  /api/overview
GET  /api/inventory
GET  /api/profiles
GET  /api/donor-discovery
GET  /api/matches?requestId=<id>
GET  /api/requests
POST /api/requests
GET  /api/my-requests
GET  /api/request-actions
POST /api/request-actions
GET  /api/inventory-actions
POST /api/inventory-actions
GET  /api/notifications
GET  /api/me
```

## Security and Access Control

RaktSetu uses Hatchable managed authentication and route-level access declarations. Authenticated application data such as user profiles and notifications is scoped to the signed-in user where configured. Operator functions are restricted to hospital and blood-bank roles inside the application workflow.

The public landing page intentionally exposes only the information required for availability/discovery workflows. Sensitive donor contact information is not exposed as a public directory field.

Before using RaktSetu in a real clinical setting, the application should undergo additional security, privacy, identity-verification, medical-compliance, and infrastructure review.

## Emergency SOS Workflow

```text
Requester creates critical request
              ↓
       Critical request
              ↓
   Compatible donor matching
              ↓
 Emergency donor notifications
              ↓
 Donor accepts / declines
              ↓
 Requester tracks response
              ↓
 Inventory or donor fulfillment
```

## Inventory Workflow

```text
Operator selects inventory
          ↓
 Add / Remove / Set Stock
          ↓
 Atomic stock update
          ↓
 Automatic status calculation
          ↓
 Transaction audit record
```

Inventory status rules used by the application:

- `0` units → Out of stock
- `1–5` units → Critical
- `>5` units → Available

Manual status values can also include Low stock and Expired where supported by the workflow.

## Deployment

The application is deployed on Hatchable. Changes are made to project files, validated with the deployment dry-run, and then deployed as a new project version.

Current production version: **v15**

## Future Scope

- Hospital and blood-bank identity verification
- SMS/WhatsApp/email emergency alerts through approved providers
- Location-aware donor search
- Appointment scheduling for donation camps
- Blood-unit expiry tracking and automated alerts
- Advanced analytics for demand and inventory planning
- Mobile application
- Stronger audit, privacy, and compliance controls
- Integration with verified healthcare/blood-bank systems

## Disclaimer

RaktSetu is a software project/prototype for blood-donation coordination and management. Blood-group compatibility and availability information must be verified by qualified medical professionals and authorized blood-bank/hospital staff before transfusion or clinical use. The platform does not replace medical screening, laboratory testing, cross-matching, or clinical decision-making.

## Author

**Avinav**

Computer Science & Engineering Student
