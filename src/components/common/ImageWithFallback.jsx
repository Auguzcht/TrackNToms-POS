import { useState } from 'react';
import placeholder from '../../assets/placeholder-image.png'; // Create a placeholder image in your assets folder

const ImageWithFallback = ({
  src,
  alt,
  className = '',
  placeholderImage = placeholder,
  ...props
}) => {
  const [error, setError] = useState(false);
  
  const handleError = () => {
    setError(true);
  };
  
  return (
    <img
      src={error || !src ? placeholderImage : src}
      alt={alt || 'Image'}
      onError={handleError}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback;