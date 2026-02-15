# MatchPoint - LinkedIn Rapid Job Discovery

> Transform LinkedIn job hunting into an intuitive, swipe-based experience with neo-brutalist design.

[![Status](https://img.shields.io/badge/status-MVP-green)]()
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI-green)]()

## ✨ Features

- 🎯 **Swipe-Based Job Discovery** - Tinder-style interface for rapid job evaluation
- ⚡ **High-Speed Curation** - Evaluate 50+ jobs in minutes, not hours
- 🎨 **Neo-Brutalist Design** - Bold, accessible interface with hard shadows and clear borders
- 🔄 **Real-Time Filtering** - Instant salary, location, and skill filtering
- 📊 **Smart Matching** - AI-powered job recommendations based on your skills
- 🌓 **Dark Mode** - Beautiful dark theme for comfortable browsing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Improve-LinkedIn-UX-UI-feature
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn main:app --reload --port 8001
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8001/docs

## 📁 Project Structure

```
.
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── styles/       # Neo-brutalist CSS
│   │   └── App.jsx       # Main app component
│   ├── vite.config.js    # Vite configuration
│   └── package.json
│
├── backend/              # FastAPI backend
│   ├── services/        # Job aggregation services
│   ├── main.py          # FastAPI app
│   ├── config.py        # Categories & job types
│   └── requirements.txt
│
├── DEPLOYMENT.md        # Deployment guide
└── README.md           # This file
```

## 🎨 Design Philosophy

MatchPoint uses a **neo-brutalist design** approach:

- **Bold Borders**: 3px solid borders for clear visual hierarchy
- **Hard Shadows**: Offset shadows (4px 4px 0) for depth without blur
- **High Contrast**: Strong color contrasts for accessibility
- **LinkedIn Colors**: Familiar LinkedIn blue (#0a66c2) as primary color
- **No Gradients**: Flat, solid colors for clarity

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite 7** - Lightning-fast build tool
- **Framer Motion** - Smooth swipe animations
- **DOMPurify** - XSS protection

### Backend
- **FastAPI** - High-performance Python API
- **Uvicorn** - ASGI server
- **Aiohttp** - Async HTTP client
- **Pydantic** - Data validation

## 📖 Usage

### Swipe Gestures

- **Swipe Right** ➡️ - Save job (adds to "Interested" list)
- **Swipe Left** ⬅️ - Skip job (hides from current search)
- **Swipe Down** ⬇️ - Archive job (remove from future searches)

### Keyboard Shortcuts

- `→` - Save job
- `←` - Skip job
- `↓` - Archive job
- `Space` - View details

### Filters

- **Salary Range** - Set minimum salary requirement
- **Job Type** - Full-time, Part-time, Contract, Internship
- **Remote** - Remote, Hybrid, On-site
- **Skills** - Filter by required skills

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy

**Frontend (Vercel):**
```bash
cd frontend
vercel
```

**Backend (Railway):**
1. Push to GitHub
2. Connect Railway to your repo
3. Set environment variables
4. Deploy automatically

## 🌐 Environment Variables

### Frontend

```bash
VITE_API_BASE_URL=http://localhost:8001  # Backend URL
```

### Backend

```bash
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

## 🧪 Testing

### Run Tests
```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
pytest
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build
npm run preview  # Test production build locally

# Backend - no build needed, Python runs directly
```

## 📊 Product Requirements

### Problem Statement

The current LinkedIn job search experience is slow and friction-heavy. Users must click into individual listings, navigate away from results, and manually filter through dense text.

### Solution

MatchPoint transforms job discovery into a high-velocity, swipe-based experience. Users can evaluate 50+ jobs in minutes, making job hunting more efficient and engaging.

### Goals

- ⚡ **Efficiency**: Reduce evaluation time to under 5 seconds per job
- 📈 **Engagement**: Increase saved jobs by 40% vs traditional list view
- 📊 **Data Quality**: Collect preference data through swipe patterns

### Target Users

- **Active Job Seekers**: Professionals reviewing 50+ listings daily
- **Passive Seekers**: Users casually browsing opportunities
- **Recruiters**: Hiring managers seeking higher engagement

## 👥 Team

- **Pedro Martins** - Product & Design
- **Gamaliel Leguista** - Development & Architecture

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 📧 Email: support@matchpoint.com
- 💬 Slack: Available afternoons & nights (1pm Tue-Fri)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

Made with ❤️ by the MatchPoint team
