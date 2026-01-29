# SENTINEL
# Comprehensive Project Documentation for SENTINEL

## Project Name: SENTINEL
**Meaning:** "Sentinel" translates to "Gözcü" or "Koruyucu" (Guardian/Protector) in Turkish.
**Core Function:** The name emphasizes the project's primary role in safeguarding data integrity and performing precise filtering (Precision Filter) of information.

## Overview
SENTINEL (Syntax and Entity Net for Extraction Logic) is an advanced system designed for intelligent information extraction from unstructured text. It leverages sophisticated natural language processing (NLP) techniques to identify, categorize, and extract specific entities and their relationships based on defined syntax and semantic rules.

## Key Features
*   **Precision Filtering:** SENTINEL excels at accurately filtering relevant information, minimizing noise and maximizing the signal-to-noise ratio in extracted data.
*   **Entity Recognition:** Identifies and classifies key entities such as names, organizations, locations, dates, and custom-defined entities.
*   **Syntax-driven Extraction:** Utilizes grammatical structures and syntactic patterns to enhance extraction accuracy and context understanding.
*   **Relationship Extraction:** Discovers and extracts relationships between identified entities, providing a richer understanding of the text.
*   **Scalability:** Designed to handle large volumes of text data efficiently.
*   **Customizable Rules:** Allows users to define and adapt extraction rules to specific domain requirements and data types.
*   **Data Integrity:** Acts as a "guardian" by ensuring the consistency and accuracy of extracted information, crucial for downstream applications.

## Quick Start

### Using Docker (Recommended)

```bash
docker-compose up --build
```

### Local Development

```bash
# Start both backend and frontend
./start_local.sh

# Or manually:
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173 (or 3000 with Docker)
- Backend API: http://localhost:8000/docs

---

## 📚 API Documentation

**Comprehensive API Guide** (English & Turkish):  
👉 **[`backend/API_GUIDE.md`](backend/API_GUIDE.md)**

Learn how to:
- Create and manage sessions
- Upload files for extraction
- Process text/markdown directly
- Provide feedback to improve accuracy
- Export extracted blocks

Interactive Swagger UI: http://localhost:8000/docs

---

## Architecture (High-Level)
SENTINEL's architecture typically includes:
1.  **Text Preprocessing Module:** Handles tokenization, stemming, lemmatization, and part-of-speech tagging.
2.  **Syntax Analysis Engine:** Parses sentences to understand their grammatical structure.
3.  **Entity Recognition Module:** Employs machine learning models (e.g., NER) and rule-based systems for entity identification.
4.  **Rule Engine/Logic Layer:** Applies user-defined or pre-configured extraction rules based on syntax and entity patterns.
5.  **Output Generation:** Formats extracted data into structured outputs (e.g., JSON, XML, database records).

## Use Cases
*   **Financial Services:** Extracting key figures, company names, and financial events from reports.
*   **Legal Document Analysis:** Identifying parties, clauses, dates, and obligations from contracts.
*   **Healthcare:** Extracting patient information, symptoms, treatments, and drug names from medical records.
*   **Intelligence Analysis:** Sifting through large datasets to identify critical entities and relationships for threat detection or trend analysis.
*   **Customer Feedback Analysis:** Extracting product features, sentiment, and common issues from reviews.

## Getting Started (Placeholder - To be detailed)
1.  **Installation:** Instructions for setting up the environment and dependencies.
2.  **Configuration:** How to define custom entities and extraction rules.
3.  **Running SENTINEL:** Examples of how to process text and retrieve extracted data.
4.  **API Reference:** Documentation for programmatic access.

## Contribution
We welcome contributions to SENTINEL. Please refer to our `CONTRIBUTING.md` for guidelines.

## License
This project is licensed under the [Specify License, e.g., MIT License] - see the `LICENSE.md` file for details.

## Contact
For questions or support, please contact [email@example.com].

buna göre yaparız