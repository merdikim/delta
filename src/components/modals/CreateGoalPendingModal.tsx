import { CheckCircle2, LoaderCircle } from 'lucide-react'

type CreateGoalPendingModalProps = {
  isOpen: boolean
  isWaitingForTxHash: boolean
  isWaitingForDatabase: boolean
}

function PendingStep({
  label,
  description,
  isLoading,
  isComplete,
}: {
  label: string
  description: string
  isLoading: boolean
  isComplete: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
        {isComplete ? (
          <CheckCircle2 className="size-5" />
        ) : (
          <LoaderCircle
            className={`size-5 ${isLoading ? 'animate-spin' : 'text-slate-300'}`}
          />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export default function CreateGoalPendingModal({
  isOpen,
  isWaitingForTxHash,
  isWaitingForDatabase,
}: CreateGoalPendingModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-4xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:p-7">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <LoaderCircle className="size-8 animate-spin" />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">
            Creating your goal
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We&apos;re confirming the deposit transaction, then saving the goal
            details to your dashboard.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <PendingStep
            label="Waiting for transaction hash"
            description="Delta is sending the vault deposit and waiting for the transaction hash to come back."
            isLoading={isWaitingForTxHash}
            isComplete={!isWaitingForTxHash}
          />
          <PendingStep
            label="Creating goal in database"
            description="Once the transaction hash is available, we store the goal and link it to your wallet."
            isLoading={isWaitingForDatabase}
            isComplete={!isWaitingForTxHash && !isWaitingForDatabase}
          />
        </div>
      </div>
    </div>
  )
}
