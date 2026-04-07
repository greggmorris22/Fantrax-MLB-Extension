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
    with open(master_path, 'r', encoding='utf-8-sig') as f: # Use utf-8-sig to handle BOM
        reader = csv.DictReader(f)
        for row in reader:
            fid = row.get('fantraxId', '').strip()
            mlb_id = row.get('mlbId', '').strip()
            fg_id = row.get('fangraphsId', '').strip()
            name = row.get('playerName', '').strip()
            
            # Use fantraxId as the anchor
            if fid and (mlb_id or fg_id):
                # We'll save: fantraxId, mlbId, fgId, name (for debugging/display)
                records.append([fid, mlb_id, fg_id, name])
                
    # Write to the extension's data folder
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # UPDATED HEADER: fantraxId, mlbId, fangraphsId, playerName
        writer.writerow(['fantraxId', 'mlbId', 'fgId', 'playerName'])
        writer.writerows(records)
        
    print(f"Successfully updated {output_path} with {len(records)} players indexed by Fantrax ID.")

if __name__ == '__main__':
    update_database()
