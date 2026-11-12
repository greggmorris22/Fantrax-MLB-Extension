import csv
import json
import os
import re
import sys
import urllib.request

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

# --- Rookie eligibility (used for the Prospect Savant link) -----------------
# MLB's rule: a player stops being a rookie once he passes 130 at-bats or
# 50 innings pitched in the majors (or 45 days on an active roster, which
# MLB's free stats site doesn't share, so we can't check that part).
# Players who haven't debuted are always rookie-eligible.
MAX_ROOKIE_AT_BATS = 130
MAX_ROOKIE_OUTS = 50 * 3  # 50 innings, counted in outs
STATS_API = ('https://statsapi.mlb.com/api/v1/people?personIds={ids}'
             '&hydrate=stats(group=[hitting,pitching],type=[career],sportId=1)')
BATCH_SIZE = 150

def innings_to_outs(ip):
    """'15.1' means 15 and 1/3 innings, so it is 46 outs."""
    whole, _, thirds = str(ip or '0').partition('.')
    return int(whole or 0) * 3 + int(thirds or 0)

def is_rookie(person):
    if not person.get('mlbDebutDate'):
        return True
    at_bats, outs = 0, 0
    for group in person.get('stats', []):
        for split in group.get('splits', []):
            stat = split.get('stat', {})
            kind = group.get('group', {}).get('displayName')
            if kind == 'hitting':
                at_bats += int(stat.get('atBats') or 0)
            elif kind == 'pitching':
                outs += innings_to_outs(stat.get('inningsPitched'))
    return at_bats <= MAX_ROOKIE_AT_BATS and outs <= MAX_ROOKIE_OUTS

def fetch_rookie_flags(mlb_ids, previous=None):
    """Ask MLB's stats site which players still have rookie eligibility.
    Returns {mlbId: '1' or ''}. If a batch can't be downloaded, those
    players keep whatever they had in the last player_map.csv."""
    previous = previous or {}
    ids = sorted({i for i in mlb_ids if i.isdigit()})
    flags, failed = {}, 0
    print(f"Checking rookie eligibility for {len(ids)} players on statsapi.mlb.com...")
    for start in range(0, len(ids), BATCH_SIZE):
        batch = ids[start:start + BATCH_SIZE]
        try:
            req = urllib.request.Request(STATS_API.format(ids=','.join(batch)),
                                         headers={'User-Agent': 'player-linker-update-script'})
            with urllib.request.urlopen(req, timeout=60) as resp:
                people = json.load(resp).get('people', [])
            for person in people:
                flags[str(person['id'])] = '1' if is_rookie(person) else ''
        except Exception as err:
            failed += len(batch)
            print(f"  Couldn't download a batch ({err}). Keeping their old rookie flags.")
            for i in batch:
                flags[i] = previous.get(i, '')
    if failed:
        print(f"Warning: {failed} players kept their old rookie flag. Run this again later to refresh them.")
    print(f"{sum(1 for v in flags.values() if v)} players are rookie-eligible.")
    return flags

def read_existing_map(path):
    """Rows of the current player_map.csv, as lists."""
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))
    return rows[1:]

def previous_rookie_flags(rows):
    return {r[1]: r[6] for r in rows if len(r) > 6 and r[1]}

HEADER = ['fantraxId', 'mlbId', 'fgId', 'playerName', 'team', 'position', 'rookie']

def write_map(path, records):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, lineterminator='\n')  # same line endings as the copy on GitHub
        writer.writerow(HEADER)
        writer.writerows(records)

def add_rookie_flags(records, previous):
    """Each record is [fantraxId, mlbId, fgId, name, team, position]; adds the rookie column."""
    flags = fetch_rookie_flags([r[1] for r in records], previous)
    return [r[:6] + [flags.get(r[1], '')] for r in records]

def refresh_rookies_only():
    """Update just the rookie column of the current player_map.csv, no master database needed."""
    path = map_path()
    rows = read_existing_map(path)
    if not rows:
        print(f"Error: {path} not found or empty.")
        return
    rows = [(r + [''] * 6)[:6] for r in rows]
    write_map(path, add_rookie_flags(rows, previous_rookie_flags(read_existing_map(path))))
    print(f"Updated rookie flags in {path}.")

def map_path():
    # Write next to this script's project folder (../data), so it works wherever the project lives
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'player_map.csv')

def update_database():
    master_path = r'C:\Users\gregg\Documents\Vibecoding\Baseball_Player_ID_Database\Baseball_Player_ID_Database.csv'
    output_path = map_path()
    
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
                
    # Mark which players still have rookie eligibility (for the Prospect Savant link)
    records = add_rookie_flags(records, previous_rookie_flags(read_existing_map(output_path)))

    # Write to the extension's data folder
    # Columns: fantraxId, mlbId, fangraphsId, playerName, team, position, rookie
    write_map(output_path, records)

    print(f"Successfully updated {output_path} with {len(records)} players indexed by Fantrax ID.")
    if dropped_fg:
        print(f"Warning: {dropped_fg} players had a bad Fangraphs ID (like 'MISSING') and got no Fangraphs ID. "
              f"Add the right IDs to {fixes_path} and run this again.")

if __name__ == '__main__':
    # "py scripts\\update_db.py --rookies-only" refreshes just the rookie
    # column (handy during the season as prospects graduate)
    if '--rookies-only' in sys.argv:
        refresh_rookies_only()
    else:
        update_database()

