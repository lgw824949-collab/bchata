import re

with open('public/logo.svg', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove white background paths
new_content = re.sub(r'<path fill="#ffffff" d="M 0 0 L 940 0 L 940 940 L 0 940 Z M 0 0 " fill-opacity="1" fill-rule="nonzero"/>', '', content)

with open('public/logo.svg', 'w', encoding='utf-8') as f:
    f.write(new_content)
