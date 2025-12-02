'use client';

import { useState } from 'react';
import React from 'react';

interface TimelineItem {
  id: number;
  date: string;
  day: string;
  hijriDate: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'future';
  icon: React.ReactElement;
}

export default function PerjalananSaya() {
  const timelineData: TimelineItem[] = [
    {
      id: 1,
      date: '1 Januari 2025',
      day: 'Rabu',
      hijriDate: '1 Muharram 1446',
      title: 'Mendaftar Program',
      description: 'Pendaftaran awal program tahfidz dan pengumpulan dokumen persyaratan.',
      status: 'completed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 2,
      date: '15 Januari 2025',
      day: 'Rabu',
      hijriDate: '15 Muharram 1446',
      title: 'Lulus Seleksi',
      description: 'Melalui proses seleksi tes hafalan dan wawancara dengan sanad.',
      status: 'completed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 3,
      date: '20 Januari 2025',
      day: 'Senin',
      hijriDate: '20 Muharram 1446',
      title: 'Mendaftar Ulang',
      description: 'Konfirmasi keikutsertaan dan pembayaran biaya program.',
      status: 'completed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 4,
      date: '1 Februari 2025',
      day: 'Sabtu',
      hijriDate: '2 Safar 1446',
      title: 'Memulai Program',
      description: 'Awal resmi program tahfidz dengan orientasi dan penentuan target.',
      status: 'completed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 5,
      date: '5 Oktober 2025',
      day: 'Minggu',
      hijriDate: '15 Ramadhan 1446',
      title: '<em>Antunna</em> di Sini',
      description: 'Sedang berada dalam tahapan intensifikasi hafalan dan rutinitas harian.',
      status: 'current',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 6,
      date: '15 Desember 2025',
      day: 'Senin',
      hijriDate: '25 Jumadil Akhir 1446',
      title: 'Ujian Akhir',
      description: 'Ujian komprehensif hafalan seluruh juz dengan murojaah sanad.',
      status: 'future',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 7,
      date: '1 Januari 2026',
      day: 'Kamis',
      hijriDate: '2 Rajab 1447',
      title: 'Wisuda & Kelulusan',
      description: 'Acara wisuda dan penyerahan sertifikat kelulusan program tahfidz.',
      status: 'future',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      id: 8,
      date: '7 Januari 2026',
      day: 'Selasa',
      hijriDate: '8 Rajab 1447',
      title: 'Menerima Syahadah',
      description: 'Penyerahan resmi syahadah dan sanad untuk membimbing tahfidz.',
      status: 'future',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const getStatusStyles = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'bg-teal-100',
          iconColor: 'text-teal-600',
          cardBorder: 'border-l-4 border-l-teal-500',
          cardBg: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'current':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          cardBorder: 'border-l-4 border-l-yellow-500',
          cardBg: 'bg-yellow-50',
          textColor: 'text-gray-800'
        };
      case 'future':
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-400',
          cardBorder: 'border-l-4 border-l-gray-300',
          cardBg: 'bg-gray-50',
          textColor: 'text-gray-500'
        };
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Linimasa Perjalanan Hafalan <em>Antunna</em>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Setiap langkah adalah bagian dari ikhtiar. Teruslah semangat hingga akhir!
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300 lg:block hidden"></div>

          {/* Timeline Items */}
          <div className="space-y-8">
            {timelineData.map((item, index) => {
              const styles = getStatusStyles(item.status);
              const isLeftSide = index % 2 === 0;

              return (
                <div key={item.id} className="relative">
                  {/* Desktop Layout - Alternating */}
                  <div className="hidden lg:block">
                    <div className={`flex items-center ${isLeftSide ? 'justify-start' : 'justify-end'}`}>
                      {/* Card */}
                      <div className={`w-5/12 ${isLeftSide ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                        <div className={`${styles.cardBg} ${styles.cardBorder} rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md`}>
                          {/* Date */}
                          <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                            {item.day} • {item.date}
                            <span className="block text-xs mt-1">{item.hijriDate}</span>
                          </div>

                          {/* Title */}
                          <h3 className={`text-lg font-bold mb-2 ${item.status === 'current' ? 'text-yellow-600' : styles.textColor}`}>
                            {item.title}
                          </h3>

                          {/* Description */}
                          <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Center Icon */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                        <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center ring-4 ring-white shadow-lg`}>
                          <div className={styles.iconColor}>
                            {item.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout - All Right Side */}
                  <div className="lg:hidden">
                    <div className="flex items-start">
                      {/* Mobile Line */}
                      <div className="absolute left-6 w-0.5 h-full bg-gray-300"></div>

                      {/* Mobile Icon */}
                      <div className={`relative z-10 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center ring-4 ring-white shadow-sm mr-4`}>
                        <div className={styles.iconColor}>
                          {item.icon}
                        </div>
                      </div>

                      {/* Mobile Card */}
                      <div className={`flex-1 ${styles.cardBg} ${styles.cardBorder} rounded-lg shadow-sm p-4 transition-all duration-300`}>
                        {/* Date */}
                        <div className={`text-sm ${styles.textColor} mb-2 font-medium`}>
                          {item.day} • {item.date}
                          <span className="block text-xs mt-1">{item.hijriDate}</span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-base font-bold mb-2 ${item.status === 'current' ? 'text-yellow-600' : styles.textColor}`}>
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-sm ${styles.textColor} leading-relaxed`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Progress Indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-sm">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            4 dari 8 milestone selesai
          </p>
        </div>
      </div>
    </main>
  );
}