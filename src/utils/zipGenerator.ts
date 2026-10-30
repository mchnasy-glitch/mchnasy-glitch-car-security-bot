import JSZip from 'jszip';
import { BOT_FILES } from '../data/botFiles';

export async function downloadProjectZip(): Promise<void> {
  const fileName = 'car_antitheft_bale_bot.zip';
  try {
    const res = await fetch(`/${fileName}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
  } catch (err) {
    console.warn('Falling back to client-side JSZip generation:', err);
  }

  // ایجاد در سمت کلاینت با JSZip در صورت لزوم
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
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
