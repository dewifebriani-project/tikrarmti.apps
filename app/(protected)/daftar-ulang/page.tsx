import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DaftarUlangClient from './DaftarUlangClient';

export const metadata = {
  title: 'Daftar Ulang - Tikrarmti Apps',
  description: 'Halaman daftar ulang untuk thalibah terpilih',
};

export default async function DaftarUlangPage({
  searchParams,
}: {
  searchParams: { batch_id?: string };
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!user) {
    redirect('/login');
  }

  // Get batch_id from search params or from user's current_tikrar_batch_id
  const batchId = searchParams.batch_id || user.current_tikrar_batch_id;

  if (!batchId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Batch Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Silakan pilih batch terlebih dahulu dari menu Perjalanan Saya.</p>
          <a
            href="/perjalanan-saya"
            className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
          >
            Ke Perjalanan Saya
          </a>
        </div>
      </div>
    );
  }

  // Get batch details
  const { data: batch } = await supabase
    .from('batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Batch Tidak Ditemukan</h1>
          <p className="text-gray-600">Batch yang Anda minta tidak tersedia.</p>
        </div>
      </div>
    );
  }

  // Get user's registration
  const { data: registration } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('*')
    .eq('user_id', user.id)
    .eq('batch_id', batchId)
    .single();

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Pendaftaran Tidak Ditemukan</h1>
          <p className="text-gray-600">Anda belum terdaftar di batch ini.</p>
        </div>
      </div>
    );
  }

  // Check if user is selected
  if (registration.selection_status !== 'selected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">Belum Dipilih</h1>
          <p className="text-gray-600 mb-6">Halaman daftar ulang hanya untuk thalibah yang sudah dipilih.</p>
          <a
            href="/perjalanan-saya"
            className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
          >
            Kembali ke Perjalanan Saya
          </a>
        </div>
      </div>
    );
  }

  // Check if already completed re-enrollment
  if (registration.re_enrollment_completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">Daftar Ulang Sudah Selesai</h1>
          <p className="text-gray-600 mb-2">Alhamdulillah! Anda sudah menyelesaikan daftar ulang.</p>
          <p className="text-sm text-gray-500 mb-6">
            Selesaikan: {registration.re_enrollment_completed_at ? new Date(registration.re_enrollment_completed_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) : '-'}
          </p>
          <a
            href="/perjalanan-saya"
            className="inline-block px-6 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
          >
            Ke Perjalanan Saya
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DaftarUlangClient
        user={user}
        batch={batch}
        registration={registration}
      />
    </div>
  );
}
