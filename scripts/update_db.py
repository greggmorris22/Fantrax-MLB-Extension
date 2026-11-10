import csv
import os
import re

# A real Fangraphs ID is all digits (MLB players) or "sa" + digits (prospects).
# Anything else, like the "MISSING" placeholder, would make a broken link.
FG_ID_PATTERN = re.compile(r'^(sa)?\d+$')

def load_fangraphs_fixes(path):
    """Hand-checked Fangraphs IDs for players the master database gets wrong."""
    fixes = {}
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                fid = row.get('fantraxId', '').strip()
                fg = row.get('fgId', '').strip()
                if fid and FG_ID_PATTERN.match(fg):
                    fixes[fid] = fg
    return fixes

def update_database():
    master_path = r'C:\Users\gregg\Documents\Vibecoding\Baseball_Player_ID_Database\Baseball_Player_ID_Database.csv'
    # Write next to this script's project folder (../data), so it works wherever the project lives
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'player_map.csv')
    
    if not os.path.exists(master_path):
        print(f"Error: Master database not found at {master_path}")
        return
        
    print(f"Reading from {master_path}...")
    fixes_path = os.path.join(os.path.dirname(output_path), 'fangraphs_id_fixes.csv')
    fg_fixes = load_fangraphs_fixes(fixes_path)
    dropped_fg = 0
    
    records = []
    with open(master_path, 'r', encoding='utf-8-sig') as f: # Use utf-8-sig to handle BOM
        reader = csv.DictReader(f)
        for row in reader:
            fid = row.get('fantraxId', '').strip()
            mlb_id = row.get('mlbId', '').strip()
            fg_id = row.get('fangraphsId', '').strip()
            name = row.get('playerName', '').strip()
            team = row.get('teamName', '').strip()
            pos = row.get('position', '').strip()

            # Fixed IDs win; otherwise throw out placeholders like "MISSING"
            if fid in fg_fixes:
                fg_id = fg_fixes[fid]
            elif fg_id and not FG_ID_PATTERN.match(fg_id):
                dropped_fg += 1
                fg_id = ''
            
            # Convert name format from "Last, First" back to "First Last" for the Chrome extension
            if name and ", " in name:
                last, first = name.split(", ", maxsplit=1)
                name = f"{first} {last}"
            
            # Use fantraxId as the anchor
            if fid and (mlb_id or fg_id):
                # We'll save: fantraxId, mlbId, fgId, name, team, position
                records.append([fid, mlb_id, fg_id, name, team, pos])
                
    # Write to the extension's data folder
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # UPDATED HEADER: fantraxId, mlbId, fangraphsId, playerName, team, position
        writer.writerow(['fantraxId', 'mlbId', 'fgId', 'playerName', 'team', 'position'])
        writer.writerows(records)
        
    print(f"Successfully updated {output_path} with {len(records)} players indexed by Fantrax ID.")
    if dropped_fg:
        print(f"Warning: {dropped_fg} players had a bad Fangraphs ID (like 'MISSING') and got no Fangraphs ID. "
              f"Add the right IDs to {fixes_path} and run this again.")

if __name__ == '__main__':
    update_database()

