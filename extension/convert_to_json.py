import json
import requests
from bs4 import BeautifulSoup

def fetch_and_parse_german_words():
    url = "https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/German_subtitles_1000"
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table')

    raw_data = []
    for row in table.find_all('tr')[1:]:  # Skip the header row
        columns = row.find_all('td')
        if len(columns) >= 3:
            rank = int(columns[0].text.strip().replace('.', ''))  # Remove trailing period
            word = columns[1].text.strip()
            occurrences = int(columns[2].text.strip())
            raw_data.append({"rank": rank, "word": word, "occurrences": occurrences})

    return raw_data

def save_to_json(data, filename):
    output_data = {entry['word']: entry['occurrences'] for entry in data}
    with open(filename, 'w') as json_file:
        json.dump(output_data, json_file, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    print("Fetching and parsing German words...")
    german_words = fetch_and_parse_german_words()
    save_to_json(german_words, 'common_german_words.json')
    print("common_german_words.json has been created.")
