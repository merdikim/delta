import { Check } from 'lucide-react'

type ConfettiPiece = {
  left: string
  delay: string
  duration: string
  color: string
  rotate: string
}

type SuccessModalProps = {
  isOpen: boolean
  goalName: string
  confettiPieces: ConfettiPiece[]
}

export default function SuccessModal({
  isOpen,
  goalName,
  confettiPieces,
}: SuccessModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className="success-burst absolute inset-0" />
      {confettiPieces.map((piece) => (
        <span
          key={piece.left + piece.delay}
          className="confetti-piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.20)]">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="size-8" />
        </div>
        <h2 className="mt-5 text-3xl font-semibold text-slate-950">
          Congratulations!
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          <span className="font-medium text-slate-950">{goalName}</span> has
          been created successfully. Your dashboard is ready for the next step.
        </p>
      </div>
    </div>
  )
}
