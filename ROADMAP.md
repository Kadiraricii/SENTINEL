<div align="center">

# 🗺️ SENTINEL PROJECT ROADMAP
### **Strategic Development Trajectory**

[![Project Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge&logo=statuspage&logoColor=white)](https://github.com/yourusername/SENTINEL)
[![Current Version](https://img.shields.io/badge/Version-2.1.0-blue?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/yourusername/SENTINEL/releases)
[![Completion](https://img.shields.io/badge/Completion-85%25-orange?style=for-the-badge&logo=target&logoColor=white)](#)

*A visualization of our journey from concept to enterprise-grade extraction system.*

[Go Back to README](../README.md)

</div>

---

## 🟢 **Phase 1: Foundation (v1.0)**
> *Establishing the core extraction intelligence and file handling capabilities.*

| Milestone | Status | Description |
|-----------|--------|-------------|
| **Core Engine** | 🟢 Complete | Hybrid segmentation (Markdown, Indentation, Density heuristics). |
| **AST Validation** | 🟢 Complete | Tree-sitter integration for 15+ languages (Python, Java, C++, etc.). |
| **Normalization** | 🟢 Complete | Robust text extraction from PDF, DOCX, and TXT files. |
| **Basic UI** | 🟢 Complete | Clean, drag-and-drop interface for file uploads. |

---

## 🟢 **Phase 2: Hybrid Capabilities (v2.0)**
> *Expanding input sources and enhancing user interaction.*

| Milestone | Status | Description |
|-----------|--------|-------------|
| **Git Import** | 🟢 Complete | Clone & analyze public repositories with branch support. |
| **Smart Polling** | 🟢 Complete | "Fast Forward" analysis to skip wait times for small repos. |
| **Analytics** | 🟢 Complete | Real-time dashboard with Recharts visualization. |
| **Adv. Search** | 🟢 Complete | Full-text search, regex support, and confidence filtering. |
| **Command+K** | 🟢 Complete | Spotlight-style global navigation palette. |

---

## 🔵 **Phase 3: Security & Stability (v2.1 - Current)**
> *Hardening the system for enterprise deployment.*

| Milestone | Status | Description |
|-----------|--------|-------------|
| **Hardening** | 🟢 Complete | SSRF prevention, Command Injection shielding, Input sanitization. |
| **No-Exec** | 🟢 Complete | Automatic `chmod 644` on all uploaded/cloned files. |
| **Secrets** | 🟢 Complete | Integrated scanning for API keys and credentials. |
| **Data Types** | 🟢 Complete | Added support for JSON, HTML, CSS, SQL, XML parsing. |
| **Fallback Logic** | 🟢 Complete | Regex-based extraction for unsupported languages (No file skipped). |

---

## � **Phase 4: Optimization & Polish (v2.2 - Next)**
> *Improving performance and user customization.*

- [ ] **Export Engine 2.0**
  - [ ] Customizable output patterns (File tree vs Flat list).
  - [ ] Selective export (Export only specific languages/matches).
- [ ] **Performance Tuning**
  - [ ] Parallel processing for massive repositories (>500MB).
  - [ ] Optimized Nginx caching for static assets.
- [ ] **Mobile Responsive**
  - [ ] Refine `AnalysisTerminal` for mobile viewports.
  - [ ] Touch-friendly "Swipe to Dismiss" actions.

---

## � **Phase 5: Enterprise Scale (v3.0 - Future)**
> *Scaling for multi-user and cloud-native environments.*

### 🔐 Identity & Access
- [ ] **Authentication:** JWT-based Login/Register.
- [ ] **RBAC:** Admin, Editor, and Viewer roles.
- [ ] **Workspaces:** Isolated environments for different teams.

### ☁️ Cloud Native
- [ ] **PostgreSQL Migration:** Move from SQLite to Postgres for concurrency.
- [ ] **Redis Layer:** Caching for frequent search queries and repo stats.
- [ ] **Kubernetes:** Helm charts for scalable cluster deployment.
- [ ] **Background Workers:** Celery/RabbitMQ for offloading heavy analysis.

---

<div align="center">

### **Development Progress**

**v1.0** (Foundation)
⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ ✅ 100%

**v2.0** (Capabilities)
⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ ✅ 100%

**v2.1** (Security)
⬛⬛⬛⬛⬛⬛⬛⬛⬛⬜ 🔄 90%

**v3.0** (Enterprise)
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 🚀 0%

<br>

*Updated: January 2026*

</div>
