import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
    // Small delay to trigger fade-in
    requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Wait for animation to complete before closing
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!mounted) return null;

  const lightbox = (
    <div
      className={`image-lightbox ${visible ? 'visible' : ''}`}
      onClick={handleClose}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={handleClose}>×</button>
        <img src={imageUrl} alt="Full size" className="lightbox-image" />
      </div>
    </div>
  );

  return createPortal(lightbox, document.body);
};

export default ImageLightbox;
