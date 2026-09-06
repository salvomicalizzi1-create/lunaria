'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * Desktop: a thumbnail rail beside the picture. Phone: a swipe carousel with
 * snap points AND arrow buttons, because every swipe needs a button
 * alternative (WCAG 2.2 SC 2.5.7) and a gesture must never be the only way.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const many = images.length > 1;

  return (
    <div className="gal">
      <div className="gal__main">
        <Image
          src={images[i]}
          alt={alt}
          width={1000}
          height={1250}
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
          className="gal__img"
        />
        {many && (
          <div className="gal__arrows">
            <button
              type="button"
              className="gal__arrow"
              onClick={() => setI((n) => (n - 1 + images.length) % images.length)}
              aria-label="Immagine precedente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button
              type="button"
              className="gal__arrow"
              onClick={() => setI((n) => (n + 1) % images.length)}
              aria-label="Immagine successiva"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>

      {many && (
        <ul className="gal__rail">
          {images.map((src, n) => (
            <li key={src}>
              <button
                type="button"
                className="gal__thumb"
                aria-current={n === i}
                onClick={() => setI(n)}
              >
                <Image src={src} alt="" width={200} height={250} aria-hidden="true" />
                <span className="sr">{`${alt} ${n + 1}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Gallery;
