import sqlite3
import fitz
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DATABASE SETUP
# -------------------------

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    score INTEGER,
    status TEXT,
    summary TEXT
)
""")

conn.commit()
conn.close()

# -------------------------
# SKILL DATABASE
# -------------------------

SKILLS = {
    "python": 20,
    "fastapi": 15,
    "django": 15,
    "flask": 15,
    "react": 15,
    "javascript": 12,
    "typescript": 12,
    "sql": 12,
    "postgresql": 10,
    "mongodb": 10,
    "docker": 15,
    "kubernetes": 15,
    "aws": 18,
    "machine learning": 20,
    "data science": 20,
    "rest api": 10,
    "git": 8,
    "linux": 10,
    "problem solving": 8,
    "teamwork": 6,
    "communication": 6
}

# -------------------------
# NAME EXTRACTION
# -------------------------

def extract_name(text):

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    blacklist = [
        "skills","education","experience","projects","summary",
        "objective","profile","contact","analytical","analysis",
        "problem","reasoning","communication","teamwork",
        "technical","languages","certifications"
    ]

    for line in lines[:8]:

        line_lower = line.lower()

        # Skip section titles
        if any(word in line_lower for word in blacklist):
            continue

        words = line.split()

        # Name usually 2–3 words
        if 2 <= len(words) <= 3:

            valid = True

            for w in words:

                if not w.isalpha():
                    valid = False

                if len(w) < 3:
                    valid = False

            if valid:
                return line.title()

    return None


# -------------------------
# RANK CALCULATION
# -------------------------

def calculate_rank(text):

    text = text.lower()
    score = 0

    for skill, weight in SKILLS.items():

        if skill in text:
            score += weight

    if score >= 80:
        return 5
    elif score >= 60:
        return 4
    elif score >= 40:
        return 3
    elif score >= 20:
        return 2
    else:
        return 1


# -------------------------
# SUMMARY GENERATION
# -------------------------

def generate_summary(text):

    found = []

    text = text.lower()

    for skill in SKILLS:

        if skill in text:
            found.append(skill)

    if found:
        return "Skills detected: " + ", ".join(found[:5])

    return "Basic profile detected"


# -------------------------
# GET CANDIDATES
# -------------------------

@app.get("/candidates")
def get_candidates():

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name, score, status, summary FROM candidates"
    )

    rows = cursor.fetchall()

    conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "score": r[2],
            "status": r[3],
            "summary": r[4]
        }
        for r in rows
    ]


# -------------------------
# UPLOAD RESUME
# -------------------------

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    stream = await file.read()

    text = ""

    with fitz.open(stream=stream, filetype="pdf") as doc:

        for page in doc:
            text += page.get_text()

    # Clean extracted text
    text = text.replace("\t", " ")
    text = text.replace("  ", " ")

    name = extract_name(text)

    if not name:
        name = file.filename.split(".")[0].replace("_", " ").title()

    score = calculate_rank(text)

    summary = generate_summary(text)

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO candidates (name, score, status, summary) VALUES (?, ?, ?, ?)",
        (name, score, "Screened", summary)
    )

    conn.commit()
    conn.close()

    return {"status": "ok"}


# -------------------------
# DELETE CANDIDATE
# -------------------------

@app.delete("/candidates/{id}")
def delete_candidate(id: int):

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM candidates WHERE id = ?", (id,)
    )

    conn.commit()
    conn.close()

    return {"status": "deleted"}


# -------------------------
# EXPORT EXCEL
# -------------------------

@app.get("/export-excel")
def export_excel():

    conn = sqlite3.connect("database.db")

    df = pd.read_sql_query(
        "SELECT name, score, status, summary FROM candidates",
        conn
    )

    conn.close()

    df.to_excel("Report.xlsx", index=False)

    return FileResponse(
        "Report.xlsx",
        filename="Resume_Screen_Report.xlsx"
    )


# -------------------------
# RUN SERVER
# -------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )