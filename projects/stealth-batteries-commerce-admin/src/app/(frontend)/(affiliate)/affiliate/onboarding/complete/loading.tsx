export default function OnboardingCompleteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Completing Your Onboarding</h1>
        <p className="mb-8 text-gray-600">Please wait while we verify your Stripe account...</p>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    </div>
  )
}
