from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

def calculate_sm2(
    rating: int, # 1=Again, 2=Hard, 3=Good, 4=Easy
    repetitions: int,
    interval_days: int,
    ease_factor: float,
    current_date: datetime = None
) -> Dict[str, Any]:
    """
    Standard SM-2 Spaced Repetition Algorithm.
    Rating mapping:
      1: Again (q=1) - Failure. Reset reps, 1 day interval.
      2: Hard  (q=3) - Barely remembered. Reps increment, smaller interval factor.
      3: Good  (q=4) - Normal recall. Standard SM-2 interval expansion.
      4: Easy  (q=5) - Perfect instant recall. Bonus interval growth.
    """
    if current_date is None:
        current_date = datetime.now()

    q_map = {1: 1, 2: 3, 3: 4, 4: 5}
    q = q_map.get(rating, 3)

    # Ease Factor calculation
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if new_ef < 1.3:
        new_ef = 1.3
    new_ef = round(new_ef, 2)

    # Repetition and interval update
    if rating == 1: # Again
        new_reps = 0
        new_interval = 1
        lapse = True
    elif rating == 2: # Hard
        new_reps = repetitions + 1
        lapse = False
        if interval_days <= 1:
            new_interval = 1
        elif interval_days <= 3:
            new_interval = 2
        else:
            new_interval = max(1, int(interval_days * 1.2))
    elif rating == 3: # Good
        new_reps = repetitions + 1
        lapse = False
        if new_reps == 1:
            new_interval = 1
        elif new_reps == 2:
            new_interval = 6
        else:
            new_interval = max(int(interval_days * new_ef), interval_days + 1)
    else: # Easy (4)
        new_reps = repetitions + 1
        lapse = False
        if new_reps == 1:
            new_interval = 2
        elif new_reps == 2:
            new_interval = 8
        else:
            bonus_factor = new_ef * 1.35
            new_interval = max(int(interval_days * bonus_factor), interval_days + 2)

    due_date = (current_date + timedelta(days=new_interval)).strftime("%Y-%m-%d")

    return {
        "repetitions": new_reps,
        "interval_days": new_interval,
        "ease_factor": new_ef,
        "due_date": due_date,
        "lapse": lapse,
        "last_rating": rating,
        "last_reviewed_at": current_date.strftime("%Y-%m-%d %H:%M:%S")
    }
