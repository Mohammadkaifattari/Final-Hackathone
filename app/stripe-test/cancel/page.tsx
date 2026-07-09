import Link from "next/link"

export default function StripeCancelPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Payment canceled</h1>
      <p>You canceled the test checkout.</p>
      <Link href="/stripe-test" className="underline w-fit">
        Back to Stripe test
      </Link>
    </div>
  )
}
