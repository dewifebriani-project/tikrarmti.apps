import os

for filepath in ["app/api/akad-quiz/attempts/route.ts", "app/api/akad-quiz/submit/route.ts"]:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Add details to fetchError
        content = content.replace(
            "return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });",
            "return NextResponse.json({ error: 'Failed to fetch attempts', details: fetchError }, { status: 500 });"
        )
        content = content.replace(
            "return NextResponse.json({ error: 'Internal server error' }, { status: 500 });",
            "return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });"
        )
        content = content.replace(
            "return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });",
            "return NextResponse.json({ error: 'Failed to save attempt', details: insertError }, { status: 500 });"
        )
        content = content.replace(
            "return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });",
            "return NextResponse.json({ error: 'Failed to fetch questions', details: fetchError }, { status: 500 });"
        )
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
