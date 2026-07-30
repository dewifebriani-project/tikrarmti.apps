import re
import uuid

def parse_form_to_sql(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()

    questions = []
    current_section = None
    section_number = 1
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if line == 'Section 2 of 3':
            current_section = 'multiple_choice'
            section_number = 1
        elif line == 'Section 3 of 3':
            current_section = 'multiple_choice'
            section_number = 2
        
        # Look for question
        if current_section and line and line != 'Section 2 of 3' and line != 'Section 3 of 3' and not line.startswith('Tebak halaman') and not line.startswith('Urutan Halaman') and not line.startswith('Lanjutkan potongan ayat') and not line.startswith('Lanjutkan ayat') and not line.startswith('After section'):
            # This might be a question text
            # A question block ends with '*' on its own line, followed by options
            
            # Look ahead for '*'
            question_text_lines = []
            j = i
            found_star = False
            while j < len(lines):
                if lines[j].strip() == '*':
                    found_star = True
                    break
                elif lines[j].strip() == 'Terdapat pada halaman':
                    # Skip this line in question text
                    j += 1
                    continue
                else:
                    if lines[j].strip():
                        question_text_lines.append(lines[j].strip())
                j += 1
                
            if found_star and len(question_text_lines) > 0:
                # We found a question!
                question_text = '\n'.join(question_text_lines)
                
                # Now collect options
                options = []
                j += 1 # skip '*'
                while j < len(lines):
                    opt = lines[j].strip()
                    if not opt:
                        pass
                    elif opt == '*' or opt.startswith('Section') or opt.startswith('After section') or (j+1 < len(lines) and lines[j+1].strip() == '*'):
                        # End of options, next question started or section ended
                        # Wait, if next line is '*', this current line might be the next question text!
                        if j+1 < len(lines) and lines[j+1].strip() == '*':
                            break
                        elif opt.startswith('Section') or opt.startswith('After section'):
                            break
                        else:
                            options.append(opt)
                    else:
                        # Could it be part of the next question?
                        # Check if it's followed by "Terdapat pada halaman" or "*" 
                        lookahead = j + 1
                        is_next_question = False
                        while lookahead < min(j + 4, len(lines)):
                            if lines[lookahead].strip() == '*':
                                is_next_question = True
                                break
                            lookahead += 1
                        
                        if is_next_question and len(options) >= 2:
                            break
                        else:
                            options.append(opt)
                    j += 1
                
                if len(options) > 0:
                    questions.append({
                        'text': question_text,
                        'options': options,
                        'section': section_number
                    })
                i = j - 1 # advance i to where we stopped
        i += 1

    print(f"Found {len(questions)} questions")
    
    # Generate SQL
    sql_lines = []
    sql_lines.append("-- Import for Juz 1, Package A")
    sql_lines.append("BEGIN;")
    
    for idx, q in enumerate(questions):
        q_id = str(uuid.uuid4())
        text = q['text'].replace("'", "''")
        opts_json = "[]"
        if len(q['options']) > 0:
            import json
            opts_json = json.dumps(q['options']).replace("'", "''")
            
        sql = f"""
INSERT INTO public.exam_questions (id, juz_number, question_package, section_number, question_number, question_type, question_text, options, correct_answer, is_active)
VALUES ('{q_id}', 1, 'A', {q['section']}, {idx + 1}, 'multiple_choice', '{text}', '{opts_json}'::jsonb, '{q['options'][0].replace("'", "''")}', true);
"""
        sql_lines.append(sql.strip())
        
    sql_lines.append("COMMIT;")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

if __name__ == '__main__':
    parse_form_to_sql('scripts/full_original_form.txt', 'scripts/juz_1a_import.sql')
