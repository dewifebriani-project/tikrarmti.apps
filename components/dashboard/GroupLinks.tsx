import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Video, MessageCircle, Info, Calendar } from 'lucide-react';
import { getDayNameIndo } from '@/lib/utils/date-helpers';

export const GroupLinks = ({ 
  daftarUlangData,
  batchData,
  partnerName,
}: {
  daftarUlangData: any;
  batchData: any;
  partnerName: string | undefined | null;
}) => {
  const halaqah = daftarUlangData?.ujian_halaqah;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 mt-8">
      <Card className="border-emerald-100 shadow-xl overflow-hidden rounded-[2rem]">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-2">
              <Users className="w-6 h-6" />
              Informasi Halaqah & Grup
            </h3>
            <p className="text-emerald-50 mt-1 opacity-90">
              Silakan bergabung ke dalam grup dan kelas Anda
            </p>
          </div>
        </div>
        <CardContent className="p-6 sm:p-10 bg-white grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Kelas Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-emerald-900 border-b pb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Detail Kelas
            </h4>
            
            {halaqah ? (
              <div className="space-y-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Halaqah</p>
                  <p className="font-bold text-gray-900 text-lg">{halaqah.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1"><Calendar className="w-4 h-4"/> Jadwal</p>
                    <p className="font-semibold text-gray-800">
                      {getDayNameIndo(halaqah.day_of_week)}, {halaqah.start_time?.substring(0, 5)} - {halaqah.end_time?.substring(0, 5)} WIB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1"><Users className="w-4 h-4"/> Pasangan</p>
                    <p className="font-semibold text-gray-800">{partnerName ? partnerName : 'Menunggu Dipasangkan'}</p>
                  </div>
                </div>
                
                {halaqah.location && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => window.open(halaqah.location.startsWith('http') ? halaqah.location : `https://${halaqah.location}`, '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md py-6 flex items-center justify-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      <span className="font-bold">Join Zoom Kelas</span>
                    </Button>
                    {!halaqah.location.startsWith('http') && (
                      <p className="text-xs text-center mt-2 text-gray-500">ID/Link: {halaqah.location}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic p-4 bg-gray-50 rounded-xl">Anda belum memilih halaqah</p>
            )}
          </div>

          {/* Group Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-emerald-900 border-b pb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Grup Komunikasi (Batch)
            </h4>
            
            <div className="space-y-3">
              {/* WA Group Link */}
              {batchData?.whatsapp_group_link ? (
                <a href={batchData.whatsapp_group_link} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors group">
                    <div className="bg-green-500 p-2.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900">Grup WhatsApp (Info Zoom)</p>
                      <p className="text-xs text-green-700">Untuk membagikan link Zoom kelas harian</p>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-70">
                  <div className="bg-gray-400 p-2.5 rounded-lg text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Grup WhatsApp (Info Zoom)</p>
                    <p className="text-xs text-gray-500">Link belum tersedia</p>
                  </div>
                </div>
              )}

              {batchData?.group_reminder_link ? (
                <a href={batchData.group_reminder_link} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors group">
                    <div className="bg-amber-500 p-2.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900">Grup Reminder</p>
                      <p className="text-xs text-amber-700">Pengingat kegiatan penting (One-way)</p>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-70">
                  <div className="bg-gray-400 p-2.5 rounded-lg text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Grup Reminder</p>
                    <p className="text-xs text-gray-500">Link belum tersedia</p>
                  </div>
                </div>
              )}

              {batchData?.group_diskusi_link ? (
                <a href={batchData.group_diskusi_link} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors group">
                    <div className="bg-blue-500 p-2.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">Grup Diskusi (Asatidzah)</p>
                      <p className="text-xs text-blue-700">Tanya jawab materi bersama ustadzah</p>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-70">
                  <div className="bg-gray-400 p-2.5 rounded-lg text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Grup Diskusi</p>
                    <p className="text-xs text-gray-500">Link belum tersedia</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
