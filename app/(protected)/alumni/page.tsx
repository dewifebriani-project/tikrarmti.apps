'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function AlumniPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Halaman Alumni</h1>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <p className="text-lg text-yellow-800 mb-2">
                  Halaman alumni sedang dalam pengembangan
                </p>
                <p className="text-sm text-yellow-700">
                  Kami sedang menyiapkan platform khusus untuk alumni MTI. Silakan cek kembali nanti.
                </p>
              </div>
              <Button
                asChild
                className="bg-green-900 hover:bg-green-800"
              >
                <Link href="/dashboard">
                  Kembali ke Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}