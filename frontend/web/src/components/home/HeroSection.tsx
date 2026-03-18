'use client'

import { Link } from '../../i18n.config'

interface HeroSectionProps {
  title: string
  subtitle: string
  auditionLabel: string
  startLabel: string
}

export default function HeroSection({
  title,
  subtitle,
  auditionLabel,
  startLabel,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#f1e8f7] bg-[#fdf8fc]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(216, 180, 254, 0.35) 1px, transparent 0)",
          backgroundSize: '40px 40px',
        }}
      />
      <div className="container relative mx-auto max-w-7xl px-4 py-24 text-center md:py-28">
        <h1 className="mb-5 text-5xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 md:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-600 md:text-xl">{subtitle}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auditions"
            className="inline-flex h-11 items-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-sm font-semibold text-white shadow"
          >
            {auditionLabel}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-md border border-gray-300 bg-white px-6 text-sm font-medium text-gray-700"
          >
            {startLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
