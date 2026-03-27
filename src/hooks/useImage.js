import { useState, useEffect } from "react";

export default function useImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return [image];
}
