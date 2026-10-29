import Reveal from './Reveal'

export default function SectionHeading({ eyebrow, title, intro, id, tone = 'dark', align = 'left', className = '' }) {
  const muted = tone === 'light' ? 'text-paper/75' : 'text-muted'
  const center = align === 'center' ? 'mx-auto text-center items-center' : ''
  return (
    <Reveal className={`flex max-w-3xl flex-col gap-5 ${center} ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="text-4xl font-bold leading-[1.02] sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {intro && <p className={`max-w-2xl text-lg leading-relaxed ${muted}`}>{intro}</p>}
    </Reveal>
  )
}
