# 🤝 Contributing to SENTINEL

First off, thanks for taking the time to contribute! 🎉

SENTINEL is a "Security-First" project. We aim to build the most robust, secure, and accurate code extraction system available. Your contributions help us achieve that goal.

This document serves as a comprehensive guide for setting up your environment, understanding our standards, and submitting successful Pull Requests.

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Project Structure](#-project-structure)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [PR Process](#-pull-request-process)
- [Reporting Issues](#-reporting-issues)

---

## 🚀 Getting Started

### Prerequisites

You will need the following tools installed:

- **Git** (> 2.30)
- **Python** (3.10+)
- **Node.js** (18+)
- **npm** (9+)
- **Docker** (Optional, for containerized dev)

### Architecture Overview

SENTINEL is a monorepo containing:
- `backend/`: FastAPI application (Python)
- `frontend/`: React + Vite application (JavaScript/JSX)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kadiraricii/SENTINEL.git
   cd SENTINEL
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run the Project**
   Go back to the root directory and run the helper script:
   ```bash
   cd ..
   ./start_local.sh
   ```

---

## 🔄 Development Workflow

We follow a unified workflow to ensure stability.

1.  **Fork** the repository to your own GitHub account.
2.  **Clone** your fork locally.
3.  **Create a Branch** for your feature or fix.
    ```bash
    git checkout -b feature/amazing-feature
    # or
    git checkout -b fix/critical-bug
    ```
4.  **Make your changes**.
5.  **Test** your changes.
6.  **Push** to your fork and submit a Pull Request.

---

## 📂 Project Structure

```bash
SENTINEL/
├── .github/          # CI/CD Workflows & Templates
├── backend/          # FastAPI App
│   ├── app/
│   │   ├── engine/   # Core Logic (Segmenter, Validator)
│   │   ├── routes/   # API Endpoints
│   │   └── schemas/  # Pydantic Models
│   └── tests/        # Pytest Suites
├── frontend/         # React App
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   └── pages/      # Main Views
│   └── public/
└── data/             # Local storage for uploads (gitignored)
```

---

## 🎨 Coding Standards

### Backend (Python)
- **Style:** We follow **PEP 8**.
- **Linter:** `flake8` is used in CI.
- **Type Hints:** Use type hints (`typing`) everywhere possible.
- **Docstrings:** Use Google-style docstrings for all functions and classes.

```python
def extract_blocks(content: str) -> List[Block]:
    """
    Extracts code blocks from the given content.

    Args:
        content (str): The raw text content.

    Returns:
        List[Block]: A list of identified code blocks.
    """
    pass
```

### Frontend (React/JS)
- **Style:** Functional Components with Hooks.
- **CSS:** TailwindCSS for utility classes. Avoid custom CSS files unless necessary.
- **Naming:** PascalCase for components (`CodeBlock.jsx`), camelCase for functions (`handleUpload`).
- **Icons:** Use `lucide-react` for icons.

---

## 📝 Commit Guidelines

We use **Conventional Commits**. This allows us to automatically generate changelogs.

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
- `feat(backend): add support for rust parsing`
- `fix(ui): resolve overlap in mobile view`
- `docs(readme): update installation steps`

---

## 📥 Pull Request Process

1.  **Self-Review:** Look through your code once more before submitting.
2.  **Pass CI:** Ensure all GitHub Actions checks pass (Lint, Test, Build).
3.  **Description:** Provide a clear description of what you changed and why.
4.  **Review:** A maintainer will review your code. Be open to feedback!

---

## 🐛 Reporting Issues

Used `block_id` but found nothing? Frontend crashed? Let us know!

1.  Check existing issues to avoid duplicates.
2.  Open a new issue using the appropriate template.
3.  Provide reproduction steps, screenshots, and logs if possible.

---

### 🛡️ Security Policy

If you discover a security vulnerability, please **DO NOT** open a public issue.
See [SECURITY.md](SECURITY.md) for instructions on how to report it safely.

---

Happy Coding! 🚀
