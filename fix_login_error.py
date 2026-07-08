import re

with open("app/login/page.tsx", "r") as f:
    content = f.read()

old_use_effect = """    const message = searchParams.get('message');
    const email = searchParams.get('email');

    if (message === 'registration_success') {"""

new_use_effect = """    const message = searchParams.get('message');
    const email = searchParams.get('email');
    const errorParam = searchParams.get('error');
    const reasonParam = searchParams.get('reason');

    if (errorParam) {
      setErrors({
        general: `${decodeURIComponent(errorParam)}${reasonParam ? `: ${decodeURIComponent(reasonParam)}` : ''}`
      });
    } else if (message === 'registration_success') {"""

content = content.replace(old_use_effect, new_use_effect)

with open("app/login/page.tsx", "w") as f:
    f.write(content)
