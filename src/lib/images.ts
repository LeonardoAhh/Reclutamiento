/**
 * Comprime una imagen en el cliente usando HTML5 Canvas
 * antes de subirla, para ahorrar almacenamiento y ancho de banda.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.7): Promise<File> {
  // Solo comprime imágenes
  if (!file.type.startsWith('image/')) return file;
  
  // No compremimos GIFs animados o SVG
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback if canvas fails
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback
              return;
            }
            // Cambiar extensión a jpg si lo comprimimos
            const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
            const compressedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file); // fallback on error
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Convierte una URL de imagen a un Blob PNG para compatibilidad 
 * estricta con la API del Portapapeles (ClipboardItem solo acepta image/png de forma nativa).
 */
export async function getUrlAsPngBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Requerido para no manchar el canvas (depende de configuración CORS del bucket)
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
