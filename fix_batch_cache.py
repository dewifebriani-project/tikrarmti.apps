import re

with open("app/api/batch/[id]/route.ts", "r") as f:
    content = f.read()

# Add import
import_stmt = "import { revalidateTag } from 'next/cache';\n"
if "revalidateTag" not in content:
    content = content.replace("import { requireAdmin } from '@/lib/rbac';", "import { requireAdmin } from '@/lib/rbac';\n" + import_stmt)

# Add revalidateTag to PUT
old_put_success = """    if (error) {
      console.error('Error updating batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update batch' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);"""

new_put_success = """    if (error) {
      console.error('Error updating batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update batch' },
        { status: 500 }
      );
    }

    // Invalidate cache
    revalidateTag(`batch:${id}`);
    revalidateTag('batches:active');

    return NextResponse.json(data);"""
content = content.replace(old_put_success, new_put_success)

# Add revalidateTag to PATCH
old_patch_success = """    if (!data) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);"""

new_patch_success = """    if (!data) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Invalidate cache
    revalidateTag(`batch:${id}`);
    revalidateTag('batches:active');

    return NextResponse.json(data);"""
content = content.replace(old_patch_success, new_patch_success)

# Add revalidateTag to DELETE
old_delete_success = """    if (error) {
      console.error('Error deleting batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete batch' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Batch deleted successfully' });"""

new_delete_success = """    if (error) {
      console.error('Error deleting batch:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete batch' },
        { status: 500 }
      );
    }

    // Invalidate cache
    revalidateTag(`batch:${id}`);
    revalidateTag('batches:active');

    return NextResponse.json({ message: 'Batch deleted successfully' });"""
content = content.replace(old_delete_success, new_delete_success)

with open("app/api/batch/[id]/route.ts", "w") as f:
    f.write(content)
