'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";

const testimonials = [
  {
    text: 'Alhamdulillah, metode Tikrar Itqan sangat membantu saya yang seorang ibu rumah tangga. Hafalan jadi lebih kuat dan tidak mudah lupa. Bimbingannya sangat terstruktur dan sistematis.',
    name: 'Aisyah Rahmah',
    role: 'Alumni Batch 5',
    location: 'Jakarta',
    avatar: 'AR',
    rating: 5
  },
  {
    text: 'Awalnya ragu bisa konsisten, tapi berkat dukungan dari pasangan setoran dan musyrifah, saya jadi lebih semangat. Aplikasi ini sangat mempermudah proses belajar harian.',
    name: 'Khadijah Aulia',
    role: 'Thalibah Aktif',
    location: 'Bandung',
    avatar: 'KA',
    rating: 5
  },
  {
    text: 'Program ini gratis tapi kualitasnya luar biasa. Serius dan berkomitmen adalah kunci. Sangat bersyukur bisa menjadi bagian dari MTI dan bertemu banyak teman baru.',
    name: 'Zainab Fatimah',
    role: 'Alumni Batch 7',
    location: 'Surabaya',
    avatar: 'ZF',
    rating: 5
  },
  {
    text: 'Sebagai mahasiswi, saya sempat khawatir tidak bisa membagi waktu. Tapi dengan 7 tahapan harian yang fleksibel, saya bisa menghafal tanpa mengganggu kuliah.',
    name: 'Mariam Salma',
    role: 'Thalibah Aktif',
    location: 'Yogyakarta',
    avatar: 'MS',
    rating: 5
  },
  {
    text: 'Masya Allah, metode Tikrar benar-benar mengubah cara saya menghafal. Sekarang hafalan jadi lebih melekat dan mudah diingat. Sangat recommended!',
    name: 'Aisha Nur',
    role: 'Alumni Batch 6',
    location: 'Medan',
    avatar: 'AN',
    rating: 5
  }
];

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth >= 1024 ? 2 : window.innerWidth >= 768 ? 1 : 1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = testimonials.length - itemsPerPage;

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="overflow-hidden px-4">
        <div
          className="flex transition-transform duration-700 ease-in-out gap-6"
          style={{
            transform: `translateX(-${currentIndex * (100 + 6)}%)`,
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="w-full lg:w-1/2 flex-shrink-0"
            >
              <Card className="h-full group hover:shadow-xl transition-all duration-300 border-custom-gold-200 hover:border-custom-green-300 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-custom-gold-400 to-custom-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-custom-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-black text-lg">{testimonial.name}</h4>
                          <p className="text-sm text-custom-gold-600 font-medium">{testimonial.role}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {testimonial.location}
                          </div>
                        </div>
                        {/* Quote Icon */}
                        <div className="text-custom-green-200 group-hover:text-custom-green-300 transition-colors">
                          <Quote className="w-8 h-8" />
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed italic group-hover:text-black transition-colors">
                        "{testimonial.text}"
                      </p>

                      {/* Rating */}
                      <div className="flex items-center mt-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-custom-gold-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        onClick={prevSlide}
        variant="outline"
        size="icon"
        className={`absolute top-1/2 left-0 -translate-y-1/2 bg-white border-custom-gold-300 hover:bg-custom-gold-50 z-20 -ml-2 ${
          currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        }`}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="h-5 w-5 text-custom-green-600" />
      </Button>

      <Button
        onClick={nextSlide}
        variant="outline"
        size="icon"
        className={`absolute top-1/2 right-0 -translate-y-1/2 bg-white border-custom-gold-300 hover:bg-custom-gold-50 z-20 -mr-2 ${
          currentIndex >= maxIndex ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        }`}
        disabled={currentIndex >= maxIndex}
      >
        <ChevronRight className="h-5 w-5 text-custom-green-600" />
      </Button>

      {/* Dots Indicator */}
      <div className="flex justify-center items-center space-x-2 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-custom-green-600'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
