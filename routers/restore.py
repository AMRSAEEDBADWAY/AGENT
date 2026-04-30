import os
import re

log_path = r'C:\Users\ASUS\.gemini\antigravity\brain\b3df5a17-0d14-43d0-9e8f-3d3874d58ebb\.system_generated\logs\overview.txt'
with open(log_path, 'r', encoding='utf-8') as f:
    text = f.read()

for file in ['auth.py', 'chat.py', 'projects.py']:
    # Search for view_file outputs
    pattern = r'File Path: `file:///.*?{}`.*?Showing lines \d+ to \d+.*?\n((?:\d+: .*?\n)+)'.format(file)
    matches = re.finditer(pattern, text, re.DOTALL)
    
    last_content = ''
    for m in matches:
        content = m.group(1)
        content = re.sub(r'^\d+: ', '', content, flags=re.MULTILINE)
        if len(content) > len(last_content):
            last_content = content
            
    if last_content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(last_content)
        print(f'Restored {file} from view_file (len {len(last_content)})')
    else:
        # Check replacement chunks
        pattern = r'TargetFile.*?{}.*?ReplacementContent..*?\"(.*?)\"'.format(file)
        matches = re.finditer(pattern, text, re.DOTALL)
        for m in matches:
            content = m.group(1).encode().decode('unicode_escape')
            if len(content) > len(last_content):
                last_content = content
        if last_content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(last_content)
            print(f'Restored {file} from replace (len {len(last_content)})')
        else:
            print(f'Could not find {file}')
