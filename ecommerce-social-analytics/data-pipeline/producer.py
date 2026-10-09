import json
import time
import random
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field

KAFKA_BROKER = "127.0.0.1:9092"
TOPIC_NAME = "social-media-events"

class ECommerceEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:8]}")
    platform: str
    brand: str
    category: str
    text: str
    user_id: str
    event_created_at: float = Field(default_factory=lambda: time.time() * 1000)

# 1. High-End Fashion Brands
BRANDS = ["Gucci", "Dior", "Louis Vuitton", "Celine", "Calvin Klein", "Miu Miu", "Valentino", "Bottega Veneta", "Prada", "Chanel", "Hermes", "Saint Laurent"]
PLATFORMS = ["Twitter", "Reddit", "Instagram","Youtube","Facebook","Printerest"]

# 2. Fashion-Specific Categories
CATEGORIES = ["Ready-to-Wear", "Handbags", "Footwear", "Accessories", "Fragrance"]

# 3. Realistic Luxury Retail Reviews
MOCK_REVIEWS = {
    "Ready-to-Wear": [
        "The tailoring on this blazer is absolutely exquisite.", 
        "Sizing runs extremely small, had to return.", 
        "Material feels incredibly luxurious and drapes perfectly.",
        "Stitching came undone after one wear, completely unacceptable for the price."
    ],
    "Handbags": [
        "The leather quality is unmatched, a timeless investment piece.", 
        "Hardware scratched within a week of normal use.", 
        "Gorgeous silhouette and holds its shape perfectly.",
        "The strap broke immediately upon opening the box."
    ],
    "Footwear": [
        "Most comfortable heels I own, beautiful craftsmanship.", 
        "The sole scuffed heavily after walking one block.", 
        "Stunning design, gets compliments everywhere I go.",
        "Gave me terrible blisters, completely unwearable."
    ],
    "Accessories": [
        "Stunning sunglasses, the fit is flawless.", 
        "The belt buckle feels flimsy and cheap.", 
        "Gorgeous silk scarf, the print is vibrant.",
        "Tarnished after wearing it twice, very disappointed."
    ],
    "Fragrance": [
        "My new signature scent, lasts all day and is so elegant.", 
        "Smells completely different than the tester in-store.", 
        "The packaging is beautiful and the notes are perfectly balanced.",
        "Fades after 20 minutes, not worth the premium price tag."
    ]
}

def generate_event() -> dict:
    category = random.choice(CATEGORIES)
    raw_data = {
        "platform": random.choice(PLATFORMS),
        "brand": random.choice(BRANDS),
        "category": category,
        "text": random.choice(MOCK_REVIEWS[category]),
        "user_id": f"usr_{random.randint(1000, 9999)}"
    }
    return ECommerceEvent(**raw_data).model_dump()

def main():
    from kafka import KafkaProducer
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(2, 8, 1)
    )
    print(f"Streaming Luxury Fashion Events to '{TOPIC_NAME}'...")

    try:
        while True:
            # 5% chance to simulate a corrupted/malformed message for the DLQ
            if random.random() < 0.05:
                bad_event = {"bad_data": "missing fields"}
                producer.send(TOPIC_NAME, value=bad_event)
            else:
                event = generate_event()
                producer.send(TOPIC_NAME, value=event)
                print(f"[{event['brand']}] {event['category']} event emitted.")
            
            time.sleep(random.uniform(0.5, 1.5))
    except KeyboardInterrupt:
        producer.flush()

if __name__ == "__main__":
    main()