"use client"
import { useEffect, useState } from "react"
import { supabase } from @/lib/supabaseClient"
import { motion } from "framer-motion"

type ChallengeRecord = {
  id: string
  title: string
  description: string | null
  created_at?: string | null
}

const challengeRequirements = [
  "تعريف واضح للمشكلة التشغيلية أو السريرية المطلوب حلها.",
  "بيانات داعمة أو مؤشرات حالية تشرح حجم التأثير.",
  "معايير نجاح قابلة للقياس خلال فترة زمنية محددة.",
  "الجهة المالكة للتحدي ونقطة الاتصال الداخلية.",
]

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error: fetchError } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        setError("تعذر تحميل التحديات حاليًا. حاول مرة أخرى.")
      } else {
        setChallenges((data || []) as ChallengeRecord[])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div dir="rtl" className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-semibold">بوابة التحديات المؤسسية</h1>
        <p className="mt-3 max-w-4xl text-white/75">
          كل تحدٍ يجب أن يبدأ بوصف دقيق للمشكلة وبيانات قياس واضحة حتى يتمكن
          الموظفون والفرق من تقديم حلول قابلة للتنفيذ والتوسع.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-2xl font-semibold">عناصر التحدي المعتمد</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {challengeRequirements.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">التحديات المنشورة</h2>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
            جارٍ تحميل التحديات...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300/30 bg-red-400/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && challenges.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/65">
            لا توجد تحديات منشورة حاليًا. ابدأ بإضافة تحدٍ جديد مع مؤشرات أثر
            قابلة للقياس.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {challenges.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold">{item.title}</h3>
                {item.created_at && (
                  <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs text-white/70">
                    {new Date(item.created_at).toLocaleDateString("ar-SA")}
                  </span>
                )}
              </div>

              <p className="text-white/70">
                {item.description || "لا يوجد وصف تفصيلي لهذا التحدي بعد."}
              </p>

              <div className="mt-5 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                مخرج المرحلة: تعريف واضح للتحدي + معايير نجاح + بيانات داعمة.
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
