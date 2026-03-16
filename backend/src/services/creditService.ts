import { supabase } from "../config/supabase"

export async function checkCredits(userId: string, amount: number) {
  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()

  if (!data) return false

  return data.credits >= amount
}

export async function deductCredits(userId: string, amount: number) {
  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()
  if(!data) return
  const newCredits = data.credits - amount

  await supabase
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", userId)
}