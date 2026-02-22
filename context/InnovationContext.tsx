"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type IdeaStatus = "draft" | "review" | "approved"

export type Idea = {
  id: number
  title: string
  status: IdeaStatus
  score?: number
}

type InnovationContextType = {
  ideas: Idea[]
  moveIdea: (id: number, status: IdeaStatus) => void
  scoreIdea: (id: number, score: number) => void
}

const InnovationContext = createContext<InnovationContextType | null>(null)

export function InnovationProvider({ children }: { children: ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>([
    { id: 1, title: "نظام فرز ذكي للطوارئ", status: "draft" },
    { id: 2, title: "لوحة متابعة الأسرة", status: "review" },
    { id: 3, title: "نظام AI للتحاليل", status: "approved" }
  ])

  const moveIdea = (id: number, status: IdeaStatus) => {
    setIdeas(prev =>
      prev.map(i => i.id === id ? { ...i, status } : i)
    )
  }

  const scoreIdea = (id: number, score: number) => {
    setIdeas(prev =>
      prev.map(i => i.id === id ? { ...i, score } : i)
    )
  }

  return (
    <InnovationContext.Provider value={{ ideas, moveIdea, scoreIdea }}>
      {children}
    </InnovationContext.Provider>
  )
}

export function useInnovation() {
  const context = useContext(InnovationContext)
  if (!context) throw new Error("InnovationContext missing")
  return context
}
