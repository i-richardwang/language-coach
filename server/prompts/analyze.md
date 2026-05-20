# Extract language-learning cards from a conversation

Read a transcript of a user talking with an AI. Your task is to find moments like this:

**The user had an idea in mind but expressed it vaguely or imprecisely. The AI understood the intent and restated the same idea with sharper, more precise language.**

Example — record this:

> User: "Some of the 'you said' and 'could say' parts just don't line up. You know what I mean?"
> AI: "They aren't two ways of saying the same thing — they're a question and an answer, or one describes the problem while the other describes the fix."

Why this is worth recording: the user already saw the problem — they knew something "didn't line up" — but couldn't articulate *how*. The AI didn't bring new information; it just said clearly what the user already sensed. The user's reaction would be "yes, *that's* what I meant — now I know how to say it."

Counter-example — don't record this:

> User: "How do the three databases work together?"
> AI: "SQLite is the warehouse, Kuzu is the index card system, LanceDB is the find-by-feel capability."

Why not: the user didn't know what the three databases did — they were asking. The AI's answer brings knowledge the user didn't have. However vivid the metaphor, it's teaching something new, not helping the user say what they already think. The reaction would be "oh, I see" rather than "oh, that's how you say it."

**The only question to ask: was this idea already in the user's head before the AI spoke?**

- Yes → the user just couldn't express it well → record
- No → the AI conveyed new knowledge → don't record

## Common types

Not exhaustive — if you find other expression-upgrade patterns worth capturing, name the type yourself:

- **Paraphrase** — user expressed something vaguely; AI restated it in one more precise sentence
- **Precise Wording** — AI used a word or phrase the user wouldn't have reached for but that fits better
- **Structured Expression** — user threw out scattered thoughts; AI organized them into a clear parallel, progressive, or contrastive structure
- **Concept Naming** — user described something in a long-winded way; AI gave it its proper name

## Output constraints

- Less is more. Zero cards for a session is perfectly fine. **Maximum 5 cards.**
- Each card must stand alone — useful even without surrounding context.
- `takeaway` should be transferable: vocab items should be reusable in other contexts; patterns should apply to other topics.
- When reading `ai_phrased`, the user should feel "oh, *that's* how you say it" — not "oh, I didn't know that." The first is an expression upgrade; the second is knowledge acquisition.

## Field descriptions

- `type`: card type (e.g. "Paraphrase", "Precise Wording", etc. — you may define new ones)
- `user_said`: the user's original words (keep the vagueness, ≤80 chars)
- `ai_phrased`: AI's precise version of the same idea (≤80 chars)
- `takeaway.vocab`: array of reusable terms (can be empty)
- `takeaway.pattern`: a transferable sentence pattern abstraction (one sentence; empty string if none)
- `context_hint`: scene for recall (≤20 chars)
- `source_ref.user_line`: line number `(L<n>)` of the user turn in the transcript; null if not found
- `source_ref.ai_line`: line number `(L<n>)` of the AI turn in the transcript; null if not found

When there's nothing worth recording, return `{"cards": []}`.
