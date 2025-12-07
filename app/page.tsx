import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  Trophy,
  ArrowRight,
  Crown,
  Heart,
  Shield,
  Sparkles,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Minimal Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-900/5 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500/5 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="min-h-[80vh] sm:min-h-screen flex items-center justify-center relative bg-gradient-to-br from-green-50/50 via-white to-yellow-50/30 pt-16 sm:pt-20 lg:pt-20">
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
  
          {/* Simple Badge */}
          <div className="mb-6 sm:mb-8">
            <Badge className="bg-green-900 text-white border-0 px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold shadow-lg">
              <Crown className="w-4 h-4 mr-2" />
              Program Tahfidz Freemium
            </Badge>
          </div>

          {/* Clean Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-black mb-6 sm:mb-8 leading-tight">
            Wujudkan Mimpi
            <span className="block bg-gradient-to-r from-green-900 via-green-800 to-yellow-600 bg-clip-text text-transparent mt-1 sm:mt-2 font-extrabold">Menjadi Hafidzah</span>
          </h2>

          {/* Concise Description */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-2xl sm:max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed">
            dengan Niat Bulat dan Komitmen Jangka Panjang
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl sm:max-w-3xl mx-auto mb-8 sm:mb-16 leading-relaxed">
            Metode Tikrar 40x: Pembelajaran Intensif, Terstruktur, dan Menghasilkan Hafalan Kuat.
          </p>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-12 py-6 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
            >
              <Link href="/register" className="flex items-center gap-3">
                <Crown className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                Daftar Sekarang
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-green-900 text-green-900 hover:bg-green-50 px-12 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
            >
              <Link href="/metode" className="flex items-center gap-3">
                <Star className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                Pelajari Metode Tikrar
              </Link>
            </Button>
          </div>

          {/* Quick Login */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Sudah bergabung?</p>
            <Button
              asChild
              variant="ghost"
              className="text-green-900 hover:text-green-800 hover:bg-green-50 px-8 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/login" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Masuk
              </Link>
            </Button>
          </div>

          </div>
      </section>

      {/* Simple Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" id="program">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-green-900">
              Program Tahfidz Tikrar MTI
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Fokus pada Ibu dan Remaja Putri Berkomitmen
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Heart,
                title: "🏡 Program Khusus Ibu Rumah Tangga",
                description: "Metode Tikrar 40x yang terbukti cocok untuk emak-emak yang menghafal di sela rutinitas rumah tangga (mencuci, memasak, mengurus anak). Wajibkan diri minimal 2 jam sehari bersama Al-Qur'an.",
                color: "green"
              },
              {
                icon: Shield,
                title: "📝 Aturan Main yang Tegas dan Transparan",
                description: "Program ini GRATIS dan didukung oleh Musyrifah profesional. Demi menjaga hak teman setoran, ada sistem blacklist permanen jika keluar tanpa alasan syar'i yang jelas. Kami ingin Zero Dropout!",
                color: "yellow"
              },
              {
                icon: Users,
                title: "🤝 MTI: Rumah Kita, Keluarga Kita",
                description: "Di MTI, kita semua adalah keluarga yang saling melengkapi kelemahan dan kekurangan. Tujuan kita: Berkumpul di Jannah Firdaus Al'Ala (No Baper, No Drama!). Kami mengutamakan keikhlasan dan istiqamah.",
                color: "blue"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl p-8 group"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${
                  feature.color === 'green' ? 'from-green-100 to-green-200' :
                  feature.color === 'yellow' ? 'from-yellow-100 to-yellow-200' :
                  'from-blue-100 to-blue-200'
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${
                    feature.color === 'green' ? 'text-green-900' :
                    feature.color === 'yellow' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>

                <h3 className={`text-2xl font-bold mb-4 text-center ${
                  feature.color === 'green' ? 'text-green-900' :
                  feature.color === 'yellow' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {feature.title}
                </h3>

                <p className="text-gray-700 text-center leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Journey Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" id="alur">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-green-900">
              4 Langkah Sukses
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Proses pembelajaran terstruktur dengan bimbingan intensif dan seleksi ketat
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Simulasi & Daftar",
                description: "Wajib mencoba simulasi Tikrar (Surah An-Naba' 1-11 x 40 kali) untuk mengukur kesanggupan. Pendaftaran dilanjutkan dengan tes bacaan dan seleksi berkas.",
                icon: Sparkles
              },
              {
                step: "02",
                title: "Penjadwalan",
                description: "Penjadwalan di halaqah dan penentuan pasangan setoran berdasarkan zona waktu dan pilihan jadwal.",
                icon: Heart
              },
              {
                step: "03",
                title: "Belajar (13 Pekan)",
                description: "Belajar yang seru! Ada Tahsin, Hafalan Baru (Ziyadah), dan Ujian. Intinya: Setoran dan Simakkan 40 kali dengan pasangan, laporan wajib, dan mengulang 10 blok hafalan sebelumnya (Rabth).",
                icon: Star
              },
              {
                step: "04",
                title: "Lulus",
                description: "Sertifikat sebagai Hafidzah Mutqin dan akses ke komunitas alumni yang inspiratif.",
                icon: Trophy
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-100 to-yellow-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-900">{item.step}</span>
                </div>
                <item.icon className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-xl font-bold mb-3 text-green-900">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-900 to-green-800 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Waktunya Bertindak
            </h2>

            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Transformasi kehidupan Ibu/Kakak dimulai dari Al-Qur'an.
              <br />
              Program ini membutuhkan komitmen penuh selama 13 pekan. Kalau Ibu/Kakak sudah siap berjuang, sungguh-sungguh, dan ikhlas menjalankan Metode Tikrar 40x yang terbukti, kami tunggu ya!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-green-900 hover:bg-gray-100 px-12 py-6 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
              >
                <Link href="/register" className="flex items-center gap-3">
                  <Crown className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  Daftar Sekarang
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-green-900 px-12 py-6 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
              >
                <Link href="/login" className="flex items-center gap-3">
                  <Heart className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  Masuk Akun
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="text-center mt-16">
              <p className="text-sm text-white/80 mb-2">
                Catatan: Program ini adalah kelas hafalan gratis untuk Ibu dan Remaja Putri dengan komitmen waktu minimal 2 jam/hari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Register Button - Removed */}
    </main>
  );
}