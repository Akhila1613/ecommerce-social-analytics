import json
import time
import random
from datetime import datetime, timezone
from faker import Faker
from kafka import KafkaProducer

# Initialize Faker for synthetic data generation
fake = Faker()

# Configuration
KAFKA_BROKER = "localhost:9092"
TOPIC_NAME = "ecommerce_social_feed"

# Realistic e-commerce brands and mock sentiments
BRANDS = ["Apple", "Samsung", "Nike", "Sony", "Dell", "Adidas", "Asus"]
PLATFORMS = ["Twitter/X", "Instagram", "Reddit"]

SAMPLE_SENTIMENTS = {
    "positive": [
        "Absolutely love my new {brand} order! Super fast shipping.",
        "The build quality on this {brand} device is unbelievable. 10/10 recommended!",
        "Great customer service experience with {brand} today.",
        "Just arrived! {brand} never disappoints."
    ],
    "neutral": [
        "Unboxing the new {brand} package today. Let's see how it holds up.",
        "Comparing {brand} against competitors. Any recommendations?",
        "Anyone tried the latest software update on {brand}?"
    ],
    "negative": [
        "Worst delivery delay ever from {brand}. Support won't reply.",
        "My {brand} order arrived damaged. So frustrated right now.",
        "Terrible battery life on the new {brand}. Definitely returning it."
    ]
}


def create_kafka_producer(broker_address: str) -> KafkaProducer:
    """Initializes and returns a KafkaProducer instance with JSON serialization."""
    try:
        producer = KafkaProducer(
            bootstrap_servers=[broker_address],
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            retries=5
        )
        print(f"Connected to Kafka broker at {broker_address}")
        return producer
    except Exception as e:
        print(f"Failed to connect to Kafka: {e}")
        raise e


def generate_mock_post() -> dict:
    """Generates a realistic social media mention for an e-commerce brand."""
    brand = random.choice(BRANDS)
    sentiment_category = random.choices(
        ["positive", "neutral", "negative"],
        weights=[0.5, 0.25, 0.25]
    )[0]
    
    template = random.choice(SAMPLE_SENTIMENTS[sentiment_category])
    text = template.format(brand=brand)

    return {
        "event_id": fake.uuid4(),
        "platform": random.choice(PLATFORMS),
        "username": fake.user_name(),
        "brand": brand,
        "text": text,
        "likes": random.randint(0, 500),
        "shares": random.randint(0, 120),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def main():
    producer = create_kafka_producer(KAFKA_BROKER)
    print(f"Starting continuous streaming to topic '{TOPIC_NAME}'...\nPress Ctrl+C to stop.\n")

    try:
        while True:
            post = generate_mock_post()
            # Send message to Kafka
            producer.send(TOPIC_NAME, value=post)
            print(f"[{post['timestamp']}] Emitted -> [{post['platform']}] @{post['username']}: \"{post['text']}\"")
            
            # Flush periodically to ensure delivery
            producer.flush()
            
            # Sleep randomly between 1 to 3 seconds to mimic live user events
            time.sleep(random.uniform(1.0, 3.0))

    except KeyboardInterrupt:
        print("\nStopping producer...")
    finally:
        producer.close()
        print("Kafka connection closed.")


if __name__ == "__main__":
    main()