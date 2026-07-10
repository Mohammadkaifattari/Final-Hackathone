"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MongoTestPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/firestore-test")
  }, [router])
  return <p>Redirecting to Firestore test...</p>
}
