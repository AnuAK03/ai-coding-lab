# backend/analysis/plagiarism.py
import ast
import hashlib
from typing import List, Dict


def normalise_ast(code: str) -> str:
    """
    Parse Python code into AST and extract a normalised
    representation that ignores variable names.
    Returns a string fingerprint of the code structure.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Unparseable code — return hash of raw text as fallback
        return hashlib.md5(code.encode()).hexdigest()

    # Walk the AST and collect node types in order
    # This captures structure without variable names
    node_sequence = []
    for node in ast.walk(tree):
        node_type = type(node).__name__
        # For constants, include the value type but not the value
        if isinstance(node, ast.Constant):
            node_sequence.append(f'Constant:{type(node.value).__name__}')
        # For names (variables), replace with placeholder
        elif isinstance(node, ast.Name):
            node_sequence.append('Name:VAR')
        else:
            node_sequence.append(node_type)

    return ' '.join(node_sequence)


def jaccard_similarity(seq_a: str, seq_b: str) -> float:
    """
    Jaccard similarity between two token sequences.
    Returns 0.0 (completely different) to 1.0 (identical).
    """
    tokens_a = set(seq_a.split())
    tokens_b = set(seq_b.split())
    if not tokens_a and not tokens_b:
        return 1.0
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union        = tokens_a | tokens_b
    return round(len(intersection) / len(union), 3)


def check_plagiarism(
    target_code: str,
    target_id:   str,
    other_submissions: List[Dict],   # [{'sessionId': str, 'code': str, 'studentId': str}]
    threshold: float = 0.75
) -> dict:
    """
    Compare target_code against all other submissions for the same program.

    Returns:
        {
            'plagiarismScore': float (0-1, highest similarity found),
            'plagiarismFlagged': bool,
            'matches': [{'sessionId': ..., 'studentId': ..., 'similarity': ...}]
        }
    """
    target_ast = normalise_ast(target_code)
    matches    = []

    for sub in other_submissions:
        if sub['sessionId'] == target_id:
            continue  # skip self-comparison

        other_ast   = normalise_ast(sub['code'])
        similarity  = jaccard_similarity(target_ast, other_ast)

        if similarity > 0.3:  # only record non-trivial similarities
            matches.append({
                'sessionId':  sub['sessionId'],
                'studentId':  sub['studentId'],
                'similarity': similarity,
            })

    matches.sort(key=lambda x: -x['similarity'])
    top_score = matches[0]['similarity'] if matches else 0.0

    return {
        'plagiarismScore':   top_score,
        'plagiarismFlagged': top_score >= threshold,
        'matches':           matches[:5],  # top 5 most similar
    }