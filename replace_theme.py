import os
import re

DIR = './frontend/src'

replacements = [
    (r'--lime:', r'--primary-accent:'),
    (r'--lime-dark:', r'--primary-accent-dark:'),
    (r'--lime-glow:', r'--primary-accent-glow:'),
    (r'--lime-subtle:', r'--primary-accent-subtle:'),
    (r'var\(--lime\)', r'var(--primary-accent)'),
    (r'var\(--lime-dark\)', r'var(--primary-accent-dark)'),
    (r'var\(--lime-glow\)', r'var(--primary-accent-glow)'),
    (r'var\(--lime-subtle\)', r'var(--primary-accent-subtle)'),
    (r'badge-lime', r'badge-accent'),
    (r'gradient-lime', r'gradient-accent'),
    (r'btn-neon', r'btn-accent'),
    (r'--border-lime', r'--border-accent'),
    (r'--shadow-glow-lime', r'--shadow-glow-accent'),
    (r'rgba\(201,\s*255,\s*63', r'rgba(255, 204, 0'),
    (r'rgba\(201,255,63', r'rgba(255,204,0'),
    (r'#C9FF3F', r'#FFCC00'),
    (r'#A8DB2A', r'#FFB300'),
    (r'color:\s*[\'"]var\(--lime\)[\'"]', r'color: \'var(--primary-accent)\''),
]

for root, _, files in os.walk(DIR):
    for file in files:
        if file.endswith(('.css', '.jsx', '.js')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
                
            if new_content != content:
                print(f"Updated {filepath}")
                with open(filepath, 'w') as f:
                    f.write(new_content)

