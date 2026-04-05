from datetime import datetime

EMOTION_THRESHOLDS = {"high_completion": 0.7, "low_completion": 0.2}
EMOTIONS_BY_HOUR = {range(6, 9): "energized", range(9, 12): "focused", range(12, 14): "calm", range(14, 17): "focused", range(17, 20): "calm", range(20, 24): "tired"}

def detect_emotion(tasks_total: int, tasks_completed: int) -> dict:
    hour = datetime.utcnow().hour
    completion_rate = tasks_completed / max(tasks_total, 1)
    if tasks_total == 0: emotion, detail = "focused", "Ready to tackle today's challenges! 🎯"
    elif completion_rate >= EMOTION_THRESHOLDS["high_completion"]: emotion, detail = "energized", "You're crushing it! High productivity detected ⚡"
    elif completion_rate <= EMOTION_THRESHOLDS["low_completion"]: emotion, detail = "stressed", "Take a short break — breathe and refocus 💙"
    else:
        emotion = "calm"
        for hr, emo in EMOTIONS_BY_HOUR.items():
            if hour in hr: emotion = emo; break
        details = {"focused": "Steady and productive!", "energized": "Peak performance!", "calm": "Balanced!", "tired": "Rest is productive!", "stressed": "Breathe. 💙"}
        detail = details.get(emotion, "Keep going! 🚀")
    return {"emotion": emotion, "detail": detail, "rate": round(completion_rate * 100, 1)}
