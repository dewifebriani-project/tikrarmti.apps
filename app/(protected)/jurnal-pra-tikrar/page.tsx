'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function JurnalPraTikrarPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jurnal Pra-Tikrar</h1>
          <p className="text-gray-600">Catatan perkembangan halaqah Pra-Tikrar Anda</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segera Hadir</CardTitle>
          <CardDescription>
            Halaman Jurnal Pra-Tikrar sedang dalam tahap pengembangan dan akan segera bisa Anda gunakan untuk mencatat setoran/simakan setiap pekannya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
            <p className="text-blue-800">
              Format spesifik untuk pengisian jurnal Pra-Tikrar akan segera diinformasikan oleh Muallimah/Admin Anda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
