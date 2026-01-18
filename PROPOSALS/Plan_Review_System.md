# Review System Implementation Plan

## Overview

Implement a complete spaced repetition review system using the SM-2 algorithm, allowing users to review vocabulary items due for review in flashcard-style sessions.

---

## Phase 1: Backend (Convex)

### 1.1 New Convex Functions

Create `convex/review.ts` with:

- `getDueCount(query)`: Returns count of vocab items where `nextReviewAt <= now()` for a user+language
- `getDueVocab(query)`: Returns vocab items where `nextReviewAt <= now()` for a user+language (paginated)
- `processReview(mutation)`: Updates a vocab item after review using SM-2 algorithm

### 1.2 SM-2 Algorithm Implementation

```typescript
// Quality: 0-5 rating scale
function calculateNextReview(item, quality) {
  if (quality < 3) {
    // Failed: reset interval
    return { intervalDays: 1, ease: Math.max(1.3, item.ease - 0.2) }
  }

  // Successful review
  const newEase = item.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  let intervalDays

  if (item.reviews === 0) intervalDays = 1
  else if (item.reviews === 1) intervalDays = 6
  else intervalDays = Math.round(item.intervalDays * newEase)

  return { intervalDays, ease: newEase }
}
```

### 1.3 Schema Notes

The vocab table already has the required fields:
- `nextReviewAt`: optional number (timestamp)
- `intervalDays`: optional number
- `ease`: optional number
- `lastReviewedAt`: optional number
- `status`: number (0=new, 1-3=learning, 4=known, 99=ignored)

Index `by_user_language_nextReviewAt` already exists.

### 1.4 Grading Scale

| Button | Quality | Meaning |
|--------|---------|---------|
| Again | 0-1 | Complete failure, reset |
| Hard | 2-3 | Correct but difficult |
| Good | 4 | Normal success |
| Easy | 5 | Perfect recall |

---

## Phase 2: Review Index Page

### 2.1 Update `app/(app)/review/index.tsx`

- Show due count per language (French, German, Japanese)
- Show total learned count per language
- "Start Review Session" button for each language
- Progress indicators (weekly review count, streak)

### 2.2 Data Fetching

```typescript
const frenchDue = useQuery(api.review.getDueCount, { language: 'fr' })
const germanDue = useQuery(api.review.getDueCount, { language: 'de' })
```

### 2.3 Layout

```
┌─────────────────────┐
│      Review         │
├─────────────────────┤
│ 📚 French           │
│    12 due · 234 known │
│    [Start Session]  │
├─────────────────────┤
│ 🇩🇪 German          │
│    5 due · 89 known  │
│    [Start Session]  │
├─────────────────────┤
│ 🇯🇵 Japanese        │
│    0 due · 12 known  │
│    [Start Session]  │
└─────────────────────┘
```

---

## Phase 3: Review Session UI

### 3.1 New Route

Create `app/(app)/review/session/index.tsx`

### 3.2 Session Parameters

- Route params: `?language=fr&limit=20`
- Default limit: 20 cards per session

### 3.3 Card Component

Create `src/features/review/Flashcard.tsx`:

**Front State:**
- Large word display (surface form)
- Optional: show reading if available
- Hint: "Tap to reveal"

**Back State:**
- Word (large)
- Reading / pronunciation
- Part of speech
- Definition
- Example sentence (if available)
- Grading buttons below

### 3.4 Grading Buttons

Create `src/features/review/GradingButtons.tsx`:

```tsx
<View className="flex-row gap-2 justify-center">
  <Button variant="fail" onPress={() => grade(1)}>Again</Button>
  <Button variant="hard" onPress={() => grade(2)}>Hard</Button>
  <Button variant="good" onPress={() => grade(3)}>Good</Button>
  <Button variant="easy" onPress={() => grade(4)}>Easy</Button>
</View>
```

### 3.5 Interactions

**Mobile (iPad/touch):**
- Tap card to flip
- Tap grading buttons
- Swipe gestures (future enhancement)

**Desktop (web):**
- Tap to flip
- Keyboard shortcuts: 1, 2, 3, 4, 5

### 3.6 Session Flow

1. Fetch batch of due items via `getDueVocab`
2. Show front of card 1
3. User taps → show back + grading buttons
4. User grades → call `processReview` mutation
5. Animate to next card
6. When batch complete → show summary screen

### 3.7 Session Summary

```
┌─────────────────────┐
│   Session Complete  │
├─────────────────────┤
│   Reviewed: 10      │
│   Accuracy: 80%     │
│                    │
│   [Back to Review]  │
└─────────────────────┘
```

---

## Phase 4: Integration Points

### 4.1 Reader Integration

When user changes word status in Reader (WordDetails), if status is 1-3:
- Set `nextReviewAt` to now (due immediately)
- Set `intervalDays` to 0
- Set `reviews` to 0

### 4.2 Lesson Progress

Update `lessons.knownTokenCount` when vocab status changes to 4.

This requires a mutation that:
1. Patches the vocab item
2. Increments the lesson's knownTokenCount for that lesson's tokens

### 4.3 Settings

Add "Review Settings" section to settings page:
- Daily new card limit (default: 20)
- Daily review card limit (default: 100)
- Auto-advance cards (on/off)

---

## Phase 5: Testing

### Manual Testing Checklist

- [ ] Create lesson, mark words as learning (status 1-3)
- [ ] Go to review index, verify due count updates
- [ ] Start review session
- [ ] Grade words, verify dates update correctly
- [ ] Complete session, verify summary shows
- [ ] Verify words with status 4 don't appear in review
- [ ] Verify words with status 99 don't appear in review
- [ ] Verify words with nextReviewAt in future don't appear
- [ ] Test on iPad (touch interactions)
- [ ] Test on desktop web (keyboard shortcuts)

### Edge Cases

- No cards due: Show "All caught up!" message
- Session interrupted: Resume from where left off (local state)
- Empty definition: Show placeholder text
- Network error: Show retry UI, preserve session state

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `convex/review.ts` | Backend queries and mutations |
| `app/(app)/review/session/index.tsx` | Session UI route |
| `src/features/review/Flashcard.tsx` | Card component |
| `src/features/review/GradingButtons.tsx` | Grade buttons component |
| `src/features/review/SessionSummary.tsx` | End-of-session summary |

### Modified Files

| File | Change |
|------|--------|
| `app/(app)/review/index.tsx` | Add due counts, start session buttons |
| `app/(app)/review/_layout.tsx` | Add session route |
| `convex/vocab.ts` | May need to add helper for setting nextReviewAt |
| `app/(app)/settings/index.tsx` | Add review settings section (optional) |

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Backend | 2-3 hours |
| Phase 2: Index page | 1 hour |
| Phase 3: Session UI | 4-5 hours |
| Phase 4: Integration | 1-2 hours |
| Phase 5: Testing | 2 hours |

**Total: 10-13 hours**

---

## Future Enhancements (Post-MVP)

- Swipe gestures for card grading
- Audio pronunciation playback
- Example sentences from dictionary
- Statistics and charts
- Daily/weekly goals and streaks
- Custom decks or tags
- Leap day handling for intervals
