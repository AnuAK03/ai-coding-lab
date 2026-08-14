#  backend/ml/model.py
# All ML logic lives here — imported by pipeline.py

import joblib
import pandas as pd
import dice_ml
import os

# ── Load ML bundle once at import time ──────────────────────────
# ml_bundle.pkl contains: model, le (LabelEncoder), feature_cols

BUNDLE_PATH = os.path.join(os.path.dirname(__file__), 'ml_bundle.pkl')
bundle      = joblib.load(BUNDLE_PATH)
MODEL       = bundle['model']
LE          = bundle['le']
FEATURE_COLS = bundle['feature_cols']

# Training data needed for DICE — load from bundle or recreate
# If you saved training data in the bundle, use that.
# Otherwise recreate synthetic data (same seed = same data).
import numpy as np

def _make_training_data():
    np.random.seed(42)
    def make_tier(n, quiz_range, error_range, hints_range, violation_range, label):
        return pd.DataFrame({
            'quiz_score':         np.round(np.random.uniform(*quiz_range, n), 3),
            'error_count':        np.random.randint(*error_range, n).astype(float),
            'hints_used':         np.random.randint(*hints_range, n).astype(float),
            'run_attempts':       np.random.randint(1, 15, n).astype(float),
            'time_taken_min':     np.round(np.random.uniform(10, 90, n), 2),
            'violation_count':    np.random.randint(*violation_range, n).astype(float),
            'syntax_error_ratio': np.round(np.random.uniform(0, 1, n), 3),
            'label': label
        })
    e = make_tier(200,(0.75,1.0),(0,8),(0,2),(0,2),'excellent')
    s = make_tier(200,(0.45,0.75),(8,20),(1,3),(0,4),'satisfactory')
    n = make_tier(200,(0.0,0.45),(20,40),(2,4),(2,8),'needs_attention')
    data = pd.concat([e, s, n]).reset_index(drop=True)
    data['label_enc'] = LE.transform(data['label'])
    return data

TRAINING_DATA = _make_training_data()

# Initialise DICE explainer once
def _init_dice():
    data_for_dice = TRAINING_DATA[FEATURE_COLS + ['label_enc']].rename(
        columns={'label_enc': 'label'}
    )
    d = dice_ml.Data(
        dataframe=data_for_dice,
        continuous_features=FEATURE_COLS,
        outcome_name='label'
    )
    m = dice_ml.Model(model=MODEL, backend='sklearn')
    return dice_ml.Dice(d, m, method='random')

DICE_EXP = _init_dice()


# ── Error tag classifier ─────────────────────────────────────────

ERROR_TAG_MAP = {
    'segmentation fault':       'pointers',
    'null pointer':             'pointers',
    'memory leak':              'pointers',
    'index out of bounds':      'arrays',
    'array index':              'arrays',
    'indexerror':               'arrays',
    'list index out of range':  'arrays',
    'infinite loop':            'loops',
    'time limit exceeded':      'loops',
    'stack overflow':           'recursion',
    'maximum recursion depth':  'recursion',
    'recursionerror':           'recursion',
    'syntaxerror':              'syntax',
    'unexpected token':         'syntax',
    'invalid syntax':           'syntax',
    'nameerror':                'scope',
    'not defined':              'scope',
    'typeerror':                'data_types',
    'cannot convert':           'data_types',
    'wrong answer':             'logic',
    'assertionerror':           'logic',
}

def tag_errors(error_list: list) -> dict:
    counts = {}
    for msg in error_list:
        lower = msg.lower()
        for keyword, tag in ERROR_TAG_MAP.items():
            if keyword in lower:
                counts[tag] = counts.get(tag, 0) + 1
                break
    return counts

def get_dominant_weakness(error_tags: dict) -> str:
    if not error_tags:
        return 'general'
    return max(error_tags, key=error_tags.get)


# ── Quiz concept analysis ────────────────────────────────────────

def analyse_quiz(quiz_answers: list) -> dict:
    weak, strong = [], []
    for ans in quiz_answers:
        if ans.get('correct'):
            strong.append(ans.get('concept_tag', 'unknown'))
        else:
            weak.append(ans.get('concept_tag', 'unknown'))
    total = len(quiz_answers)
    return {
        'weak_concepts':   list(set(weak)),
        'strong_concepts': list(set(strong)),
        'score':           round(len(strong) / total, 3) if total > 0 else 0.0,
    }


# ── DICE change parser ───────────────────────────────────────────

def parse_dice_changes(original: dict, cf_df, feature_cols: list) -> list:
    changes = {}
    for _, row in cf_df.iterrows():
        for feat in feature_cols:
            orig  = float(original.get(feat, 0))
            cfval = float(row[feat])
            if abs(cfval - orig) > 0.05 and feat not in changes:
                changes[feat] = {
                    'feature':   feat,
                    'from':      round(orig, 3),
                    'to':        round(cfval, 3),
                    'direction': 'increase' if cfval > orig else 'decrease',
                    'delta':     round(abs(cfval - orig), 3),
                }
    return sorted(changes.values(), key=lambda x: -x['delta'])


# ── Groq teacher summary prompt ──────────────────────────────────

def build_teacher_prompt(session, tier, dice_changes, error_tags, quiz_analysis) -> str:
    dice_text = '\n'.join([
        f"  - {c['feature'].replace('_',' ').title()}: needs to {c['direction']} "
        f"from {c['from']} to {c['to']}"
        for c in dice_changes[:3]
    ]) if dice_changes else '  No significant changes identified.'

    error_text = ', '.join([
        f"{tag} ({count} errors)"
        for tag, count in sorted(error_tags.items(), key=lambda x: -x[1])
    ]) if error_tags else 'no categorised errors'

    return f"""You are an academic assistant helping a college teacher understand a student's lab performance.
Write a concise report (4-6 sentences).

SESSION DATA:
- Performance tier: {tier.upper().replace('_',' ')}
- Quiz score: {session.get('quizScore',0)*100:.0f}%
- Total errors: {len(session.get('errors',[]))}
- Hints used: {session.get('hintsUsed',0)} of 3
- Run attempts: {session.get('runAttempts',0)}
- Integrity violations: {len(session.get('violations',[]))}

CONCEPT ANALYSIS:
- Error breakdown: {error_text}
- Quiz concepts wrong: {', '.join(quiz_analysis.get('weak_concepts',[])) or 'none'}
- Quiz concepts correct: {', '.join(quiz_analysis.get('strong_concepts',[])) or 'none'}

WHAT NEEDS TO CHANGE (DICE):
{dice_text}

Write a teacher report covering:
1. What this student genuinely understands well
2. Specific concepts they are struggling with and evidence
3. One concrete recommendation for the next session
Rules: use concept names (loops, pointers etc), vary language, no bullet points, under 100 words."""


# ── Master function ──────────────────────────────────────────────

def compute_syntax_ratio(errors: list) -> float:
    if not errors:
        return 0.0
    syntax_keywords = ['syntaxerror','syntax error','invalid syntax',
                        'unexpected token','expected',"parse error"]
    count = sum(1 for e in errors
                if any(k in e.lower() for k in syntax_keywords))
    return round(count / len(errors), 3)


def predict_and_explain(session: dict) -> dict:
    """
    Master function — takes a raw Firestore session dict,
    returns everything needed for the teacher report.
    """
    errors     = session.get('errors', [])
    violations = session.get('violations', [])
    error_msgs = [e.get('message','') if isinstance(e, dict) else str(e)
                  for e in errors]

    # 1. Extract features
    features = {
        'quiz_score':         float(session.get('quizScore', 0.0)),
        'error_count':        float(len(errors)),
        'hints_used':         float(session.get('hintsUsed', 0)),
        'run_attempts':       float(session.get('runAttempts', 1)),
        'time_taken_min':     float(session.get('timeTakenMs', 0)) / 60000,
        'violation_count':    float(len(violations)),
        'syntax_error_ratio': compute_syntax_ratio(error_msgs),
    }

    features_df = pd.DataFrame([features])[FEATURE_COLS]

    # 2. Predict tier
    pred_enc   = MODEL.predict(features_df)[0]
    pred_label = LE.inverse_transform([pred_enc])[0]
    pred_proba = MODEL.predict_proba(features_df)[0]
    confidence = {
        cls: round(float(prob), 3)
        for cls, prob in zip(LE.classes_, pred_proba)
    }

    # 3. DICE counterfactuals (only if not already excellent)
    dice_changes = []
    if pred_label != 'excellent':
        try:
            target = 'satisfactory' if pred_label == 'needs_attention' else 'excellent'
            target_enc = int(LE.transform([target])[0])
            
            # DICE v0.12 API - removed proximity_weight and diversity_weight parameters
            cf = DICE_EXP.generate_counterfactuals(
                features_df,
                total_CFs=3,
                desired_class=target_enc,
                posthoc_sparsity_param=0.1,  # Controls sparsity of changes
                stopping_threshold=0.5,      # Convergence threshold
            )
            cf_df = cf.cf_examples_list[0].final_cfs_df
            dice_changes = parse_dice_changes(features, cf_df, FEATURE_COLS)
        except Exception as e:
            print(f'DICE failed (non-critical): {e}')
            dice_changes = []

    # 4. Error concept tagging
    error_tags   = tag_errors(error_msgs)

    # 5. Quiz analysis
    quiz_answers = session.get('quizAnswers', [])
    quiz_analysis = analyse_quiz(quiz_answers)

    # 6. Build Groq prompt
    groq_prompt = build_teacher_prompt(
        session, pred_label, dice_changes, error_tags, quiz_analysis
    )

    return {
        'performanceTier':  pred_label,
        'confidence':       confidence,
        'diceChanges':      dice_changes,
        'errorTags':        error_tags,
        'quizAnalysis':     quiz_analysis,
        'dominantWeakness': get_dominant_weakness(error_tags),
        'groqPrompt':       groq_prompt,
    }