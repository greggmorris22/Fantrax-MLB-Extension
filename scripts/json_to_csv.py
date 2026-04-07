import json
import csv
import os

def json_to_csv():
    json_path = '../fantrax-extension/player_map.json'
    csv_path = '../data/player_map.csv'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} records from {json_path}")
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Name', 'MLBID', 'FGID', 'FGSlug'])
        
        for name, ids in data.items():
            writer.writerow([
                name,
                ids.get('mlbam') or '',
                ids.get('fg') or '',
                ids.get('fg_slug') or ''
            ])
            
    print(f"Successfully wrote {len(data)} records to {csv_path}")

if __name__ == '__main__':
    json_to_csv()
