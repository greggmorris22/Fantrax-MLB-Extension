import csv
import os

def update_database():
    master_path = r'C:\Users\gregg\Documents\Vibecoding\Baseball_Player_ID_Database\Baseball_Player_ID_Database.csv'
    output_path = r'c:\Users\gregg\Documents\Vibecoding\Fantrax_MLB_Extension\data\player_map.csv'
    
    if not os.path.exists(master_path):
        print(f"Error: Master database not found at {master_path}")
        return
        
    print(f"Reading from {master_path}...")
    
    records = []
    with open(master_path, 'r', encoding='utf-8') as f:
        # The master CSV might have BOM or different encodings, 
        # using DictReader to handle columns by name
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('playerName', '').lower().strip()
            mlb_id = row.get('mlbId', '').strip()
            fg_id = row.get('fangraphsId', '').strip()
            
            # Filter out empty names or records with no IDs
            if name and (mlb_id or fg_id):
                # The extension uses 'player' as a default slug
                # Use name for a cleaner slug if possible
                slug = name.replace(' ', '-').replace('.', '')
                records.append([name, mlb_id, fg_id, slug])
                
    # Sort by name for consistency
    records.sort(key=lambda x: x[0])
    
    # Write to the extension's data folder
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Name', 'MLBID', 'FGID', 'FGSlug'])
        writer.writerows(records)
        
    print(f"Successfully updated {output_path} with {len(records)} players.")

if __name__ == '__main__':
    update_database()
