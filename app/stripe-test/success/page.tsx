import Link from "next/link"

export default function StripeSuccessPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <p>Your test payment went through.</p>
      <Link href="/stripe-test" className="underline w-fit">
        Back to Stripe test
      </Link>
    </div>
  )
}
