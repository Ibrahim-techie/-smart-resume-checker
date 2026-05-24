import re


def clean_text(raw_text: str) -> str:
    """
    Clean extracted resume text while preserving meaningful section breaks.
    """
    if not raw_text:
        return ''

    text = raw_text.replace('\x00', '')
    text = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = text.replace('\t', ' ')

    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()
        if len(stripped) <= 1:
            continue
        if re.match(r'^[\W_]+$', stripped):
            continue
        cleaned_lines.append(stripped)

    text = '\n'.join(cleaned_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)

    return text.strip()
