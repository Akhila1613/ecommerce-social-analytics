import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
import time
import random
import urllib.request
import numpy as np
from kafka import KafkaConsumer, KafkaProducer
from pymongo import MongoClient
from pydantic import ValidationError

KAFKA_BROKER = "127.0.0.1:9092"
INPUT_TOPIC = "social-media-events"
DLQ_TOPIC = "dead-letter-events"

def broadcast_to_backend(event_payload: dict):
    try:
        clean_payload = {k: v for k, v in event_payload.items() if k != "_id"}
        req = urllib.request.Request(
            "http://127.0.0.1:5000/api/stream-event",
            data=json.dumps(clean_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=1.0)
    except Exception:
        pass

def calculate_ensemble_sentiment(text: str):
    """Simulates a 4-node ensemble (LSTM, RoBERTa, FinBERT, VADER)"""
    text_lower = text.lower()
    is_neg = any(w in text_lower for w in ["late", "damaged", "cheap", "hold", "expensive", "nightmare", "refused"])
    is_pos = any(w in text_lower for w in ["fast", "exceeded", "great", "refunded", "helpful", "amazing", "instant"])
    
    # Simulate Model Scores (0.0 to 1.0)
    base = 0.2 if is_neg else (0.8 if is_pos else 0.5)
    
    models = {
        "LSTM": min(1.0, max(0.0, base + random.uniform(-0.1, 0.1))),
        "RoBERTa": min(1.0, max(0.0, base + random.uniform(-0.05, 0.05))),
        "FinBERT": min(1.0, max(0.0, base + random.uniform(-0.08, 0.08))),
        "VADER": min(1.0, max(0.0, base + random.uniform(-0.15, 0.15)))
    }
    
    # Calculate Metrics
    scores = list(models.values())
    consensus_score = sum(scores) / len(scores)
    
    final_label = "NEGATIVE" if consensus_score <= 0.45 else ("POSITIVE" if consensus_score >= 0.55 else "NEUTRAL")
    
    # Model Agreement (How many models agreed with the final label?)
    votes = ["NEGATIVE" if s <= 0.45 else ("POSITIVE" if s >= 0.55 else "NEUTRAL") for s in scores]
    agreement_pct = (votes.count(final_label) / 4) * 100
    
    # Confidence (Distance from ambiguous middle 0.5)
    confidence = abs(consensus_score - 0.5) * 2 * 100

    return final_label, consensus_score, round(agreement_pct), round(confidence), models

def main():
    db = MongoClient("mongodb://127.0.0.1:27017/")["social_analytics"]["sentiment_results"]
    
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(2, 8, 1)
    )

    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=[KAFKA_BROKER],
        group_id="sentiment-consumer-group",
        auto_offset_reset="latest",
        api_version=(2, 8, 1),
        value_deserializer=lambda x: json.loads(x.decode("utf-8", errors="ignore"))
    )

    print("Listening for events... (Press Ctrl+C to stop)")
    
    for msg in consumer:
        event = msg.value
        
        # 1. Dead Letter Queue Validation
        if "text" not in event or "brand" not in event:
            print("[DLQ] Malformed event routed to Dead Letter Queue")
            producer.send(DLQ_TOPIC, value=event)
            continue
            
        # 2. ML Processing
        event["kafka_received_at"] = time.time() * 1000
        label, score, agreement, confidence, node_breakdown = calculate_ensemble_sentiment(event["text"])
        
        event.update({
            "sentiment": label,
            "sentiment_score": round(score, 4),
            "model_agreement": agreement,
            "confidence": confidence,
            "node_breakdown": node_breakdown,
            "ml_processed_at": time.time() * 1000
        })

        # 3. Storage & Broadcast
        db.insert_one(event)
        broadcast_to_backend(event)
        print(f"Processed: {event['brand']} | {label} ({confidence}% Conf, {agreement}% Agree)")

if __name__ == "__main__":
    main()