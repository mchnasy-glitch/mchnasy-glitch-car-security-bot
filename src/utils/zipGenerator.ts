import JSZip from 'jszip';
import { BOT_FILES } from '../data/botFiles';

export async function downloadProjectZip(): Promise<void> {
  const fileNames = ['car_security_bot.zip', 'car_antitheft_bale_bot.zip'];
  for (const fileName of fileNames) {
    try {
      const res = await fetch(`/${fileName}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'car_security_bot.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Continue to next or fallback
    }
  }

  // ایجاد فایل ZIP در سمت مرورگر با JSZip به عنوان پشتیبان
  const zip = new JSZip();

  BOT_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'car_security_bot.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
