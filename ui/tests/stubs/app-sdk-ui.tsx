/**
 * A light stand-in for the host's `@kirocrew/app-sdk/ui`: the one component the
 * page uses, as a plain element with the role the host component renders.
 */

export function ErrorNotice({
  message,
  testId,
  className,
  report,
}: {
  message?: string | null
  variant?: 'block' | 'inline'
  className?: string
  testId?: string
  report?: unknown
}) {
  if (!message) return null
  return (
    <div role="alert" data-testid={testId} className={className} data-report={report ? 'yes' : undefined}>
      {message}
    </div>
  )
}
