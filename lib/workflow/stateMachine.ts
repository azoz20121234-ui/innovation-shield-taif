export type IdeaState =
  | "idea_submitted"
  | "ai_refined"
  | "team_formed"
  | "prototype_ready"
  | "ai_judged"
  | "human_judged"
  | "approved_for_execution"
  | "execution_in_progress"
  | "impact_tracking"
  | "protected_published"
  | "rejected"

export const stateTransitions: Record<IdeaState, IdeaState[]> = {
  idea_submitted: ["ai_refined", "rejected"],
  ai_refined: ["team_formed", "rejected"],
  team_formed: ["prototype_ready", "rejected"],
  prototype_ready: ["ai_judged", "rejected"],
  ai_judged: ["human_judged", "rejected"],
  human_judged: ["approved_for_execution", "rejected"],
  approved_for_execution: ["execution_in_progress"],
  execution_in_progress: ["impact_tracking"],
  impact_tracking: ["protected_published"],
  protected_published: [],
  rejected: [],
}

export function canTransition(fromState: string, toState: string) {
  const from = fromState as IdeaState
  if (!(from in stateTransitions)) return false
  return stateTransitions[from].includes(toState as IdeaState)
}

export function getNextSuggestedState(state: string): IdeaState | null {
  const current = state as IdeaState
  const next = stateTransitions[current]
  return next && next.length > 0 ? next[0] : null
}
