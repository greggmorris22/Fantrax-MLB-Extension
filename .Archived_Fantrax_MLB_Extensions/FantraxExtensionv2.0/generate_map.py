import csv
import json

def generate_player_map():
    player_map = {}
    
    try:
        with open('players.csv', 'r', encoding='latin-1') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Get the name variations
                name = row.get('PLAYERNAME', '').strip().lower()
                mlb_name = row.get('MLBNAME', '').strip().lower()
                fg_name = row.get('FANGRAPHSNAME', '').strip().lower()
                
                mlb_id = row.get('MLBID', '').strip()
                fg_id = row.get('IDFANGRAPHS', '').strip()
                
                if not (mlb_id or fg_id):
                    continue
                
                # We need the slug/name for the new Fangraphs URL format
                # e.g. https://www.fangraphs.com/players/bo-bichette/19612/stats
                # We'll use the FangraphsName to create the slug
                fg_slug = fg_name.replace(' ', '-').replace('.', '').replace("'", "")
                
                data = {
                    "mlbam": mlb_id if mlb_id else None,
                    "fg": fg_id if fg_id else None,
                    "fg_slug": fg_slug if fg_slug else None
                }
                
                # Add mappings for all name variations
                for n in set([name, mlb_name, fg_name]):
                    if n and n != 'none':
                        player_map[n] = data
                        
                        # Handle "Last, First" format
                        if ',' in n:
                            parts = [p.strip() for p in n.split(',')]
                            if len(parts) == 2:
                                reverse_name = f"{parts[1]} {parts[0]}"
                                player_map[reverse_name] = data

        with open('fantrax-extension/player_map.json', 'w') as f:
            json.dump(player_map, f, indent=2)
        
        print(f"Generated map with {len(player_map)} variations.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_player_map()
