import re

with open("app/api/alumni/testimonial/my/route.ts", "r") as f:
    content = f.read()

old_logic = """  const now = new Date();
  return regs.some((reg: any) => {
    const isApproved = reg.status === 'approved';
    const isSelected = reg.selection_status === 'selected';
    if (!isApproved || !isSelected) return false;
    
    const batch = reg.batch;
    if (!batch) return false;
    
    const endDate = batch.end_date ? new Date(batch.end_date) : null;
    return (endDate && endDate < now) || batch.status === 'archived';
  });
}"""

new_logic = """  const now = new Date();
  const hasPassedBatch = regs.some((reg: any) => {
    const isApproved = reg.status === 'approved';
    const isSelected = reg.selection_status === 'selected';
    if (!isApproved || !isSelected) return false;
    
    const batch = reg.batch;
    if (!batch) return false;
    
    const endDate = batch.end_date ? new Date(batch.end_date) : null;
    return (endDate && endDate < now) || batch.status === 'archived';
  });

  if (!hasPassedBatch) return false;

  // Check if they have a final exam oral score >= 80
  const { data: finalExams, error: examError } = await supabase
    .from('final_exam_registrations')
    .select('score_lisan')
    .eq('user_id', userId)
    .gte('score_lisan', 80)
    .limit(1);

  return finalExams && finalExams.length > 0;
}"""

content = content.replace(old_logic, new_logic)

with open("app/api/alumni/testimonial/my/route.ts", "w") as f:
    f.write(content)
