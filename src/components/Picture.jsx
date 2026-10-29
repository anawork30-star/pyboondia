/** Imagen responsive con srcset del catálogo central (src/data/images.js). */
export default function Picture({ image, sizes = '100vw', priority = false, className = '', ...rest }) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      {...rest}
    />
  )
}
