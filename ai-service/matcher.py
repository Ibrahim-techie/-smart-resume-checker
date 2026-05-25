import re

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


nlp = spacy.load('en_core_web_sm')

TECH_KEYWORDS = [
    'python', 'javascript', 'java', 'c++', 'c#', 'typescript', 'golang', 'rust',
    'kotlin', 'swift', 'php', 'ruby', 'scala', 'react', 'angular', 'vue',
    'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel',
    'html', 'css', 'tailwind', 'bootstrap', 'nextjs', 'mongodb', 'mysql',
    'postgresql', 'sqlite', 'redis', 'elasticsearch', 'firebase', 'dynamodb',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
    'linux', 'bash', 'git', 'github', 'gitlab', 'machine learning',
    'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas',
    'numpy', 'nlp', 'computer vision', 'rest api', 'graphql', 'websocket',
    'microservices', 'agile', 'scrum', 'ci/cd', 'devops', 'figma', 'postman',
    'sql', 'nosql', 'data structures', 'algorithms', 'system design', 'oop',
    'unit testing', 'jest', 'selenium', 'cypress', 'flutter', 'react native',
    'spark', 'hadoop', 'kafka', 'tableau', 'power bi',
]

SOFT_SKILLS = [
    'communication', 'leadership', 'teamwork', 'problem solving',
    'analytical', 'critical thinking', 'time management', 'collaboration',
    'adaptability', 'attention to detail', 'project management',
    'presentation', 'mentoring', 'negotiation',
]


def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def compute_tfidf_similarity(resume_text: str, jd_text: str) -> float:
    resume_clean = preprocess_text(resume_text)
    jd_clean = preprocess_text(jd_text)

    if not resume_clean or not jd_clean:
        return 0.0

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
    )

    try:
        tfidf_matrix = vectorizer.fit_transform([resume_clean, jd_clean])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(similarity) * 100, 1)
    except Exception:
        return 0.0


def extract_jd_keywords(jd_text: str) -> dict:
    jd_lower = jd_text.lower()

    tech_skills = [
        kw for kw in TECH_KEYWORDS
        if re.search(rf'\b{re.escape(kw)}\b', jd_lower)
    ]
    soft_skills = [
        skill for skill in SOFT_SKILLS
        if re.search(rf'\b{re.escape(skill)}\b', jd_lower)
    ]

    doc = nlp(jd_text[:10000])

    entities = list(set([
        ent.text.lower()
        for ent in doc.ents
        if ent.label_ in ['ORG', 'PRODUCT', 'GPE', 'WORK_OF_ART'] and len(ent.text) > 2
    ]))

    noun_phrases = []
    for chunk in doc.noun_chunks:
        phrase = chunk.text.lower().strip()
        if 2 <= len(phrase.split()) <= 4 and len(phrase) > 4:
            if not any(stop in phrase for stop in ['the ', 'a ', 'an ', 'our ', 'your ']):
                noun_phrases.append(phrase)

    return {
        'tech_skills': tech_skills,
        'soft_skills': soft_skills,
        'entities': entities[:10],
        'noun_phrases': list(set(noun_phrases))[:20],
    }


def find_keyword_overlap(resume_text: str, jd_keywords: dict) -> dict:
    resume_lower = resume_text.lower()
    all_jd_keywords = list(set(jd_keywords['tech_skills'] + jd_keywords['soft_skills']))

    matched = []
    missing = []

    for keyword in all_jd_keywords:
        pattern = rf'\b{re.escape(keyword)}\b'
        if re.search(pattern, resume_lower):
            matched.append(keyword)
        else:
            missing.append(keyword)

    return {
        'matched': matched,
        'missing': missing,
        'matched_tech': [kw for kw in matched if kw in jd_keywords['tech_skills']],
        'matched_soft': [kw for kw in matched if kw in jd_keywords['soft_skills']],
        'missing_tech': [kw for kw in missing if kw in jd_keywords['tech_skills']],
        'missing_soft': [kw for kw in missing if kw in jd_keywords['soft_skills']],
    }


def generate_match_suggestions(
    match_score: float,
    keyword_overlap: dict,
    jd_keywords: dict,
    jd_title: str = 'Untitled Position',
) -> list:
    suggestions = []
    missing_tech = keyword_overlap['missing_tech']
    missing_soft = keyword_overlap['missing_soft']
    matched_count = len(keyword_overlap['matched'])
    total_count = len(keyword_overlap['matched']) + len(keyword_overlap['missing'])

    if match_score < 40:
        suggestions.append(
            'Low overall match. Consider tailoring your resume specifically for this role.'
        )

    if missing_tech:
        top_missing = missing_tech[:5]
        suggestions.append(
            f"For '{jd_title}', consider adding: {', '.join(top_missing)}"
        )

    if missing_soft:
        suggestions.append(
            f"Highlight these soft skills in your resume: {', '.join(missing_soft[:3])}"
        )

    if total_count > 0:
        coverage = matched_count / total_count
        if coverage < 0.4:
            suggestions.append(
                'Less than 40% keyword coverage. Rewrite your skills and experience sections '
                'to mirror the language used in this job description.'
            )
        elif coverage >= 0.7:
            suggestions.append(
                'Strong keyword coverage! Focus on quantifying your achievements to stand out further.'
            )

    if match_score >= 70 and not suggestions:
        suggestions.append(
            'Great match! Make sure your resume highlights the most relevant experience for this role.'
        )

    return suggestions


def match_resume_to_jd(resume_text: str, jd_text: str, jd_title: str = 'Untitled Position') -> dict:
    if not resume_text or not jd_text:
        return {
            'matchScore': 0,
            'matchedKeywords': [],
            'missingKeywords': [],
            'suggestions': ['Resume or JD text is empty.'],
            'jdKeywords': {},
            'overlap': {},
        }

    tfidf_score = compute_tfidf_similarity(resume_text, jd_text)
    jd_keywords = extract_jd_keywords(jd_text)
    keyword_overlap = find_keyword_overlap(resume_text, jd_keywords)
    keyword_total = len(keyword_overlap['matched']) + len(keyword_overlap['missing'])
    keyword_coverage = len(keyword_overlap['matched']) / keyword_total if keyword_total else 0
    match_score = round(min(100, (tfidf_score * 0.4) + (keyword_coverage * 60)), 1)
    suggestions = generate_match_suggestions(
        match_score,
        keyword_overlap,
        jd_keywords,
        jd_title,
    )

    return {
        'matchScore': match_score,
        'matchedKeywords': keyword_overlap['matched'],
        'missingKeywords': keyword_overlap['missing'],
        'matchedTech': keyword_overlap['matched_tech'],
        'missingTech': keyword_overlap['missing_tech'],
        'matchedSoft': keyword_overlap['matched_soft'],
        'missingSoft': keyword_overlap['missing_soft'],
        'suggestions': suggestions,
        'jdKeywords': jd_keywords,
        'tfidfScore': tfidf_score,
        'keywordCoverage': round(keyword_coverage, 3),
    }
