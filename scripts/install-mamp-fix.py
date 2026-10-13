#!/usr/bin/env python3
"""Keep MAMP's macOS FastCGI workaround in its Apache startup hook."""
from pathlib import Path
import shutil
import subprocess

startup = Path('/Applications/MAMP/bin/startApache.sh')
marker = '# RailBook: avoid PHP child-process crashes on macOS'
original = startup.read_text()
command = '/Applications/MAMP/Library/bin/apachectl start'
if marker not in original:
    if original.count(command) != 1:
        raise SystemExit('Unexpected MAMP startup script. No files were changed.')
    backup = startup.with_name('startApache.railbook-original.sh')
    if not backup.exists():
        shutil.copy2(startup, backup)
    hook = '''# RailBook: avoid PHP child-process crashes on macOS
# MAMP regenerates these wrappers before calling this startup script.
for wrapper in /Applications/MAMP/fcgi-bin/php*.fcgi; do
    if [ -f "$wrapper" ]; then
        /usr/bin/sed -i '' 's/^export PHP_FCGI_CHILDREN=.*/export PHP_FCGI_CHILDREN=0/' "$wrapper"
    fi
done
'''
    startup.write_text(original.replace(command, hook + '\n' + command))
# Reapply the hook to current wrappers, including the selected PHP version.
for wrapper in Path('/Applications/MAMP/fcgi-bin').glob('php*.fcgi'):
    text = wrapper.read_text()
    lines = [
        'export PHP_FCGI_CHILDREN=0' if line.startswith('export PHP_FCGI_CHILDREN=') else line
        for line in text.splitlines()
    ]
    wrapper.write_text('\n'.join(lines) + '\n')
subprocess.run(['/Applications/MAMP/Library/bin/apachectl', 'restart'], check=True)
print('Installed the MAMP startup repair. The original startup script is backed up beside it.')
