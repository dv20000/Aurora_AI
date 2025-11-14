"""
fetch_messages.py
A simple utility script to fetch all messages from the Aurora public API,
print a summary, display all messages, and save them to a CSV file.
"""

import requests
import pandas as pd
import os

# Aurora public API
url = "https://november7-730026606190.europe-west1.run.app/messages"

# Fetch the data
response = requests.get(url)
if response.status_code == 200:
    data = response.json().get("items", [])
    df = pd.DataFrame(data)

    # Print summary
    print("Total rows:", len(df))
    print("Columns:", list(df.columns))
    print("\n")

    # Print all rows (set display options)
    pd.set_option('display.max_rows', None)        # show all rows
    pd.set_option('display.max_colwidth', None)    # show full message text
    pd.set_option('display.width', 0)              # no column truncation

    print(df)

    # Save to CSV in the same directory
    output_path = os.path.join(os.getcwd(), "aurora_messages.csv")
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"\nSaved all records to: {output_path}")

else:
    print(f"Failed to fetch data. Status code: {response.status_code}")
    print("Response text:", response.text)