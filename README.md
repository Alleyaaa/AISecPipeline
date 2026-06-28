![AISecPipeline](https://img.shields.io/badge/AISecPipeline-v1.0-0a0e1a?style=for-the-badge&logo=security)
# AISecPipeline

AI-powered SOC dashboard — integrates Wazuh, Velociraptor, TheHive, and SOAR playbooks into one platform.

![Dashboard Overview](https://aisecpipeline-demo.netlify.app/screenshots/dashboard.png)

## Project Structure

```
AISecPipeline/
├── artifacts/
│   ├── dashboard/              # React frontend (Vite + TailwindCSS)
│   │   ├── src/
│   │   │   ├── pages/          # All page components
│   │   │   │   ├── Dashboard.tsx       # Main overview with charts
│   │   │   │   ├── Wazuh.tsx           # Agent & event monitoring
│   │   │   │   ├── TheHive.tsx         # Incident case management
│   │   │   │   ├── Velociraptor.tsx    # Hunt & artifact collection
│   │   │   │   ├── Mitre.tsx           # MITRE ATT&CK matrix
│   │   │   │   ├── Playbooks.tsx       # SOAR automated playbooks
│   │   │   │   ├── AlertsPage.tsx      # Alert queue & triage
│   │   │   │   ├── Sessions.tsx        # Triage session management
│   │   │   │   ├── Reports.tsx         # AI analysis reports
│   │   │   │   ├── DailySummary.tsx    # Daily security summary
│   │   │   │   ├── Login.tsx           # Authentication
│   │   │   │   ├── Settings.tsx        # App settings
│   │   │   │   ├── Users.tsx           # User management
│   │   │   │   ├── Connectors.tsx      # External integrations
│   │   │   │   └── Usage.tsx           # API usage stats
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── context/        # React context providers
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities
│   │   │   └── index.css       # Tailwind + theme variables
│   │   └── ...
│   ├── api-server/             # Express.js backend
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   └── lib/            # Utilities
│   │   └── ...
│   └── mockup-sandbox/         # Replit mockup tools
├── docker/
│   ├── Dockerfile.api          # Backend Dockerfile
│   └── Dockerfile.frontend     # Frontend Dockerfile
├── lib/                        # Shared libraries (db, api-zod, api-client)
├── scripts/                    # Automation scripts
├── docker-compose.yml          # Orchestration
├── .env.example                # Environment template
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ / pnpm (for local dev)

### 1. Clone & Configure
```bash
git clone https://github.com/Alleyaaa/AISecPipeline.git
cd AISecPipeline
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run with Docker
```bash
docker compose up -d --build
```

Dashboard at `http://localhost:3000`  
API at `http://localhost:5000`

### 3. Default Login
**Username:** `admin`  
**Password:** `Vembazax26!`

---

## Screenshots

| Dashboard Overview | MITRE ATT&CK Matrix |
|:---:|:---:|
| ![Dashboard](https://aisecpipeline-demo.netlify.app/screenshots/dashboard.png) | ![MITRE](https://aisecpipeline-demo.netlify.app/screenshots/mitre.png) |

| Wazuh Agent Monitoring | Velociraptor Hunts |
|:---:|:---:|
| ![Wazuh](https://aisecpipeline-demo.netlify.app/screenshots/wazuh.png) | ![Velociraptor](https://aisecpipeline-demo.netlify.app/screenshots/velociraptor.png) |

| TheHive Cases | SOAR Playbooks |
|:---:|:---:|
| ![TheHive](https://aisecpipeline-demo.netlify.app/screenshots/thehive.png) | ![SOAR](https://aisecpipeline-demo.netlify.app/screenshots/playbooks.png) |

| Alert Queue | Login Page |
|:---:|:---:|
| ![Alerts](https://aisecpipeline-demo.netlify.app/screenshots/alerts.png) | ![Login](https://aisecpipeline-demo.netlify.app/screenshots/login.png) |

---

## Features

### 🔍 Real-time Monitoring
- **Dashboard**: Live threats, severity distribution, weekly trends, active source status
- **Wazuh Integration**: Agent health, real-time events, rule correlation, MITRE mapping
- **Velociraptor Hunts**: Artifact collection, query-based hunting, export capabilities

### 🛡️ Incident Response
- **TheHive Incidents**: Case management with severity, TLP, assignee tracking
- **Alert Triage**: Filterable queue with scoring, MITRE mapping, status workflow
- **SOAR Playbooks**: Automated response steps, connector status dashboard

### 🎯 MITRE ATT&CK
- Complete 12-tactic matrix with technique mapping
- Detection coverage indicators per technique
- Velociraptor hunt availability markers
- Alert correlation with MITRE IDs

### 📊 Security Analytics
- AI Analysis Reports with severity breakdown
- Daily threat summary with key metrics
- Session management for ongoing investigations

---

## Usage Guide

### Dashboard Workflow
1. Open Dashboard for real-time posture overview
2. Monitor Alerts for new threats with severity scoring
3. Investigate via Wazuh/ TheHive / Velociraptor pages
4. Create triage sessions for ongoing investigations
5. Run SOAR playbooks for automated response
6. Cross-reference techniques in MITRE ATT&CK matrix

### Connecting Real Tools (Self-Hosted)
1. Open **SOAR Playbooks → Connector Setup** tab
2. Configure each connector:
   - **Wazuh**: Point to your Wazuh manager API (`https://wazuh:55000`)
   - **TheHive**: Your TheHive instance API (`https://thehive:9000`)
   - **Velociraptor**: GRPC API endpoint (`https://velociraptor:8000`)
3. Update credentials in `Settings` page
4. Once connected, playbooks auto-trigger on alerts

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `WAZUH_API_URL` | Wazuh manager URL | No |
| `WAZUH_API_USER` | Wazuh API username | No |
| `WAZUH_API_PASS` | Wazuh API password | No |
| `THEHIVE_API_URL` | TheHive instance URL | No |
| `THEHIVE_API_KEY` | TheHive API key | No |
| `VELOCIRAPTOR_API_URL` | Velociraptor GRPC URL | No |
| `VELOCIRAPTOR_API_KEY` | Velociraptor API key | No |

---

## License
MIT
