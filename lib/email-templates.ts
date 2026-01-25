export const emailTemplates = {
  confirmation: {
    subject: 'Konfirmasi Email Anda - Tikrar MTI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Konfirmasi Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #15803d; }
          .button {
            display: inline-block;
            background-color: #15803d;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tikrar MTI</div>
          </div>

          <h2>Selamat datang di Tikrar MTI! 🎉</h2>

          <p>Terima kasih telah mendaftar di aplikasi Tikrar MTI.</p>

          <p>Silakan klik tombol di bawah ini untuk mengkonfirmasi email Anda:</p>

          <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Konfirmasi Email</a>
          </div>

          <p>Atau copy dan paste link ini ke browser:</p>
          <p>{{ .ConfirmationURL }}</p>

          <p><strong>Catatan:</strong> Link ini akan aktif selama 1 jam.</p>

          <div class="footer">
            <p>Jika Anda tidak mendaftar di Tikrar MTI, abaikan email ini.</p>
            <p>&copy; 2024 Tikrar MTI - Markaz Tikrar Indonesia</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  resetPassword: {
    subject: 'Reset Password - Tikrar MTI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #15803d; }
          .button {
            display: inline-block;
            background-color: #15803d;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .alert {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            padding: 12px;
            border-radius: 4px;
            color: #dc2626;
          }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tikrar MTI</div>
          </div>

          <h2>Reset Password Anda</h2>

          <p>Kami menerima permintaan untuk reset password akun Anda.</p>

          <p>Klik tombol di bawah ini untuk membuat password baru:</p>

          <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
          </div>

          <p>Atau copy dan paste link ini ke browser:</p>
          <p>{{ .ConfirmationURL }}</p>

          <div class="alert">
            <p><strong>Penting:</strong> Link ini akan aktif selama 1 jam.</p>
          </div>

          <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>

          <div class="footer">
            <p>&copy; 2024 Tikrar MTI - Markaz Tikrar Indonesia</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  emailChange: {
    subject: 'Konfirmasi Perubahan Email - Tikrar MTI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Konfirmasi Perubahan Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #15803d; }
          .button {
            display: inline-block;
            background-color: #15803d;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tikrar MTI</div>
          </div>

          <h2>Konfirmasi Perubahan Email</h2>

          <p>Ukhti telah meminta untuk mengubah email akun Tikrar MTI Ukhti.</p>

          <p>Klik tombol di bawah untuk mengkonfirmasi perubahan email:</p>

          <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Konfirmasi Perubahan Email</a>
          </div>

          <p>Link ini akan aktif selama 1 jam.</p>

          <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>

          <div class="footer">
            <p>&copy; 2024 Tikrar MTI - Markaz Tikrar Indonesia</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  invite: {
    subject: 'Undangan Bergabung - Tikrar MTI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Undangan Bergabung</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #15803d; }
          .button {
            display: inline-block;
            background-color: #15803d;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tikrar MTI</div>
          </div>

          <h2>Undangan Bergabung dengan Tikrar MTI</h2>

          <p>Anda telah diundang untuk bergabung dengan aplikasi Tikrar MTI.</p>

          <p>Klik tombol di bawah untuk menerima undangan:</p>

          <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Terima Undangan</a>
          </div>

          <p>Link ini akan aktif selama 24 jam.</p>

          <div class="footer">
            <p>&copy; 2024 Tikrar MTI - Markaz Tikrar Indonesia</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};