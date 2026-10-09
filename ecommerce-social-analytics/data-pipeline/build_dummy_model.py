import os
import pickle
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.text import Tokenizer

# Ensure the output directory exists
os.makedirs("saved_models", exist_ok=True)

# 1. Create and save a minimal tokenizer
tokenizer = Tokenizer(num_words=100)
# Fit on basic mock vocabulary so it can process incoming text
tokenizer.fit_on_texts(["great", "good", "bad", "terrible", "order", "product"])

with open("saved_models/tokenizer.pickle", "wb") as f:
    pickle.dump(tokenizer, f)

# 2. Create and save a minimal model
model = Sequential([Dense(1, activation="sigmoid", input_shape=(100,))])
model.compile(optimizer="adam", loss="binary_crossentropy")
model.save("saved_models/my_lstm_model.h5")

print("Generated dummy artifacts in data-pipeline/saved_models/")