# Smart Resume Checker

AI-powered resume analysis platform built with MERN stack + Python Flask.

## Features
- Resume upload (PDF/DOCX) with Cloudinary storage
- Automated text extraction (pdfplumber + python-docx)
- ATS compatibility scoring (0-100) with category breakdown
- JD matching with TF-IDF cosine similarity (Phase 5 — in progress)

## Tech Stack
**Frontend:** React + Vite + Tailwind CSS  
**Backend:** Node.js + Express + MongoDB Atlas  
**AI Service:** Python Flask + spaCy + scikit-learn  
**Storage:** Cloudinary  

## Setup
See individual README files in `client/`, `server/`, `ai-service/`.
