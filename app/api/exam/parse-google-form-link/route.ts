import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || (!url.startsWith('https://docs.google.com/forms/') && !url.startsWith('https://forms.gle/'))) {
      return NextResponse.json({ success: false, error: 'URL tidak valid. Harus berupa link Google Form.' }, { status: 400 });
    }

    const res = await fetch(url);
    const html = await res.text();

    // The data is inside a script tag: var FB_PUBLIC_LOAD_DATA_ = [...];
    const match = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\s*<\/script>/);
    
    if (!match || !match[1]) {
      return NextResponse.json({ success: false, error: 'Tidak dapat mem-parsing data dari form ini. Pastikan form bersifat publik.' }, { status: 400 });
    }

    const data = JSON.parse(match[1]);
    const items = data[1]?.[1] || [];

    const parsedQuestions = [];
    let currentSection = 1;
    let currentSectionTitle = 'Bagian 1';

    for (const item of items) {
      const type = item[3];
      const title = item[1] || '';
      const description = item[2] || '';

      if (type === 8) {
        // Section Header
        currentSection++;
        currentSectionTitle = title || `Bagian ${currentSection}`;
      } else if (type === 2 || type === 3 || type === 4) {
        // Multiple choice (2), Dropdown (3), Checkboxes (4)
        const optionsData = item[4]?.[0]?.[1] || [];
        const options = optionsData.map((opt: any) => ({
          text: opt[0],
          isCorrect: false // Google Forms public HTML doesn't expose correct answers for quizzes
        }));

        parsedQuestions.push({
          question_text: title + (description ? '\n\n' + description : ''),
          question_type: 'multiple_choice',
          options,
          section_number: currentSection,
          section_title: currentSectionTitle,
          points: 10,
          question_package: 'B' // default
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedQuestions
    });

  } catch (error: any) {
    console.error('[GoogleFormParser] Error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan sistem saat mem-parsing form.' }, { status: 500 });
  }
}
