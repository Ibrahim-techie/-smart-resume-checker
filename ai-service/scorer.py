import re
from datetime import datetime, timezone

ACTION_VERBS = [
    'built', 'developed', 'designed', 'implemented', 'created', 'architected',
    'engineered', 'programmed', 'coded', 'deployed', 'automated', 'integrated',
    'optimized', 'refactored', 'migrated', 'maintained', 'debugged', 'tested',
    'led', 'managed', 'coordinated', 'supervised', 'mentored', 'trained',
    'spearheaded', 'directed', 'oversaw', 'organized', 'established',
    'improved', 'increased', 'reduced', 'achieved', 'delivered', 'launched',
    'generated', 'boosted', 'accelerated', 'streamlined', 'enhanced',
    'analyzed', 'researched', 'evaluated', 'assessed', 'identified', 'investigated',
    'reviewed', 'audited', 'monitored', 'measured',
    'collaborated', 'partnered', 'contributed', 'supported', 'assisted',
]

TECH_KEYWORDS = [
    'python', 'javascript', 'java', 'c++', 'c#', 'typescript', 'golang', 'rust',
    'kotlin', 'swift', 'php', 'ruby', 'scala', 'r', 'matlab',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'fastapi',
    'spring', 'laravel', 'html', 'css', 'tailwind', 'bootstrap', 'nextjs', 'nuxt',
    'mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'elasticsearch',
    'firebase', 'supabase', 'dynamodb', 'cassandra',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd',
    'terraform', 'ansible', 'linux', 'bash', 'git', 'github', 'gitlab',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'scikit-learn', 'pandas', 'numpy', 'data analysis', 'nlp', 'computer vision',
    'neural network', 'llm', 'openai', 'langchain',
    'rest api', 'graphql', 'websocket', 'microservices', 'agile', 'scrum',
    'jira', 'figma', 'postman', 'swagger', 'vscode',
]

SECTION_PATTERNS = {
    'experience': [
        r'\b(work experience|experience|employment|professional experience|internship|intern)\b',
    ],
    'education': [
        r'\b(education|academic|qualification|degree|university|college|school)\b',
    ],
    'skills': [
        r'\b(skills|technical skills|core competencies|technologies|proficiencies|expertise)\b',
    ],
    'projects': [
        r'\b(projects|personal projects|academic projects|portfolio|works)\b',
    ],
    'summary': [
        r'\b(summary|objective|profile|about me|overview|career objective)\b',
    ],
    'contact': [
        r'\b(contact|reach me|get in touch)\b',
    ],
}


def score_contact_info(text: str) -> dict:
    score = 0
    found = {}

    email_match = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        score += 5
        found['email'] = email_match.group()

    phone_match = re.search(
        r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}',
        text,
    )
    if phone_match:
        score += 5
        found['phone'] = True

    url_match = re.search(r'(linkedin\.com|github\.com|portfolio|behance\.net)', text, re.IGNORECASE)
    if url_match:
        score += 5
        found['professional_url'] = url_match.group()

    return {
        'score': score,
        'max': 15,
        'found': found,
        'label': 'Contact Information',
    }


def score_sections(text: str) -> dict:
    text_lower = text.lower()
    section_scores = {
        'experience': 8,
        'education': 5,
        'skills': 7,
        'projects': 5,
    }

    found_sections = []
    missing_sections = []
    score = 0

    for section, patterns in SECTION_PATTERNS.items():
        if section not in section_scores:
            continue

        detected = any(re.search(pattern, text_lower) for pattern in patterns)
        if detected:
            score += section_scores[section]
            found_sections.append(section)
        else:
            missing_sections.append(section)

    return {
        'score': score,
        'max': 25,
        'found_sections': found_sections,
        'missing_sections': missing_sections,
        'label': 'Section Completeness',
    }


def score_content_quality(text: str) -> dict:
    score = 0
    details = {}
    text_lower = text.lower()
    words = text_lower.split()
    word_count = len(words)
    details['word_count'] = word_count

    if 300 <= word_count <= 700:
        score += 10
        details['word_count_score'] = 10
        details['word_count_feedback'] = 'Ideal length'
    elif 200 <= word_count < 300 or 700 < word_count <= 900:
        score += 6
        details['word_count_score'] = 6
        details['word_count_feedback'] = 'Acceptable length'
    elif 100 <= word_count < 200 or 900 < word_count <= 1200:
        score += 3
        details['word_count_score'] = 3
        details['word_count_feedback'] = 'Too short or too long'
    else:
        details['word_count_score'] = 0
        details['word_count_feedback'] = 'Very poor length'

    found_verbs = [verb for verb in ACTION_VERBS if re.search(rf'\b{re.escape(verb)}\b', text_lower)]
    unique_verbs = sorted(set(found_verbs))
    verb_count = len(unique_verbs)

    if verb_count >= 8:
        score += 10
    elif verb_count >= 5:
        score += 7
    elif verb_count >= 3:
        score += 4
    elif verb_count >= 1:
        score += 2

    details['action_verbs_found'] = unique_verbs[:10]
    details['action_verb_count'] = verb_count

    quant_patterns = [
        r'\d+\s*%',
        r'\$\s*\d+',
        r'\d+\+?\s*(users|students|clients|projects|teams|members|employees)',
        r'(increased|reduced|improved|boosted|grew)\s+\w+\s+by\s+\d+',
        r'\d+\s*(x|times)\s+(faster|improvement|increase)',
    ]
    quant_matches = sum(1 for pattern in quant_patterns if re.search(pattern, text, re.IGNORECASE))

    if quant_matches >= 3:
        score += 5
    elif quant_matches >= 2:
        score += 3
    elif quant_matches >= 1:
        score += 2

    details['quantified_achievements'] = quant_matches

    return {
        'score': score,
        'max': 25,
        'details': details,
        'label': 'Content Quality',
    }


def score_keywords(text: str) -> dict:
    text_lower = text.lower()
    found_keywords = [keyword for keyword in TECH_KEYWORDS if keyword in text_lower]
    unique_keywords = sorted(set(found_keywords))
    count = len(unique_keywords)

    if count >= 15:
        score = 20
    elif count >= 10:
        score = 16
    elif count >= 7:
        score = 12
    elif count >= 5:
        score = 8
    elif count >= 3:
        score = 5
    elif count >= 1:
        score = 2
    else:
        score = 0

    return {
        'score': score,
        'max': 20,
        'found_keywords': unique_keywords,
        'keyword_count': count,
        'label': 'Keyword Density',
    }


def score_formatting(text: str) -> dict:
    score = 0
    details = {}
    total_chars = len(text)
    noise_chars = len(re.findall(r'[^\w\s.,;:()\-/\'"@#&]', text))
    noise_ratio = noise_chars / total_chars if total_chars > 0 else 1

    if noise_ratio < 0.02:
        score += 5
        details['text_quality'] = 'Clean'
    elif noise_ratio < 0.05:
        score += 3
        details['text_quality'] = 'Minor noise'
    else:
        details['text_quality'] = 'High noise — may affect parsing'

    line_count = len([line for line in text.split('\n') if line.strip()])
    details['line_count'] = line_count

    if 20 <= line_count <= 80:
        score += 5
    elif 10 <= line_count < 20 or 80 < line_count <= 120:
        score += 3
    else:
        score += 1

    words = text.lower().split()
    if len(words) > 10:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio > 0.5:
            score += 5
        elif unique_ratio > 0.35:
            score += 3
        else:
            score += 1

    return {
        'score': score,
        'max': 15,
        'details': details,
        'label': 'ATS Formatting',
    }


def score_resume(parsed_text: str) -> dict:
    if not parsed_text or len(parsed_text.strip()) < 50:
        return {
            'atsScore': 0,
            'breakdown': {},
            'summary': {
                'strengths': [],
                'improvements': [
                    'Resume text could not be read properly. Ensure the file is not image-based.',
                ],
            },
            'scoredAt': datetime.now(timezone.utc).isoformat(),
        }

    contact = score_contact_info(parsed_text)
    sections = score_sections(parsed_text)
    content = score_content_quality(parsed_text)
    keywords = score_keywords(parsed_text)
    formatting = score_formatting(parsed_text)

    total = contact['score'] + sections['score'] + content['score'] + keywords['score'] + formatting['score']
    strengths = []
    improvements = []

    if contact['score'] >= 10:
        strengths.append('Good contact information present')
    else:
        missing = []
        if 'email' not in contact['found']:
            missing.append('email address')
        if 'phone' not in contact['found']:
            missing.append('phone number')
        if 'professional_url' not in contact['found']:
            missing.append('LinkedIn or GitHub profile')
        if missing:
            improvements.append(f"Add missing contact info: {', '.join(missing)}")

    if sections['missing_sections']:
        improvements.append(f"Add missing sections: {', '.join(sections['missing_sections'])}")
    else:
        strengths.append('All key resume sections are present')

    if content['details']['action_verb_count'] < 5:
        improvements.append('Use more action verbs (e.g. built, developed, optimized, led)')
    else:
        strengths.append(f"Strong use of action verbs ({content['details']['action_verb_count']} found)")

    if content['details']['quantified_achievements'] == 0:
        improvements.append('Add quantifiable achievements (e.g. "reduced load time by 40%")')
    else:
        strengths.append('Includes measurable achievements with numbers')

    word_count_feedback = content['details'].get('word_count_feedback', '')
    if word_count_feedback != 'Ideal length':
        improvements.append(f"Resume length: {word_count_feedback}. Aim for 300–700 words.")

    if keywords['keyword_count'] < 7:
        improvements.append(
            f"Add more technical keywords. Only {keywords['keyword_count']} detected. "
            "Include specific tools, languages, and frameworks you know.",
        )
    else:
        strengths.append(f"Good keyword density ({keywords['keyword_count']} tech keywords)")

    return {
        'atsScore': min(total, 100),
        'breakdown': {
            'contact': contact,
            'sections': sections,
            'content': content,
            'keywords': keywords,
            'formatting': formatting,
        },
        'summary': {
            'strengths': strengths,
            'improvements': improvements,
        },
        'scoredAt': datetime.now(timezone.utc).isoformat(),
    }
