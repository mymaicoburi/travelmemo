# TravelMemo Product Source of Truth

`PRODUCT.md` defines the vision, principles, capabilities, and decision criteria for TravelMemo. It serves as the durable product guide for both human contributors and AI coding assistants.

---

## 1. Product Purpose

TravelMemo is a fast, lightweight, living itinerary for small groups traveling together whose plans evolve or split during the trip.

It provides a single, shared, authoritative view of **where group members are scheduled to be**, accessible instantly on mobile without account creation or app installation.

---

## 2. Origin Story

TravelMemo was born during a family trip to Kyoto involving parents and a baby.

- **Split Schedules:** Certain activities required the parents and baby to separate (e.g., one parent visiting a specific spot or shopping while the other stayed with the baby at the hotel or a park).
- **Day-of Uncertainty:** Specific details and timing could not be finalized until the morning or day of the trip.
- **The Chat Problem:** Coordinating via LINE messages resulted in critical plan details getting buried under ongoing conversation, photos, and questions. Members had to continuously scroll back through chat logs to guess which message contained the latest plan.
- **The Solution:** TravelMemo became the single canonical place to check and update the itinerary. Instead of asking in chat or hunting through message history, any traveler could open a single link and see the current plan immediately.

---

## 3. Core User Problem & Generalization

Group travel in the real world is dynamic and multi-track. Pre-trip schedules rarely survive contact with reality.

- **State vs. Stream:** Chat apps are append-only streams. As discussions evolve, the true current plan gets obscured. Travelers need the *current agreed state*, not the conversation history.
- **Split Tracks & Regrouping:** When groups split into subgroups, members need unambiguous answers to two questions:
  1. *What am I scheduled to do next, and where?*
  2. *Where are other members scheduled to be, and when/where do we regroup?*
- **Scheduled Presence vs. Real-Time Tracking:** TravelMemo represents *planned/scheduled presence and meeting points*, not real-time physical GPS tracking.
- **Canonical Itinerary:** The itinerary itself is the source of truth. While one person may take the lead on entering updates, the product does not require a fixed or privileged "coordinator" hierarchy.

---

## 4. Target Users & Use Cases

### Target Users
- Families (including children, babies, and elderly members).
- Couples and small friend groups (typically 2–6 people) traveling together.

### Primary Use Cases
1. **Split & Regroup:** Group splits into subgroups and needs an unambiguous time and place to rejoin.
2. **On-the-Fly Adjustments:** Delays, weather changes, or spontaneous discoveries require quickly moving times or adjusting stops during the day.
3. **Quick Ground Verification:** Checking scheduled transportation times, platform notes, or hotel check-in details while walking with luggage or a stroller.

---

## 5. Core Value Proposition

- **Frictionless Viewing:** Open a link on mobile and instantly see the current plan without logins, passwords, or app installations.
- **Current State Clarity:** A clean, uncluttered timeline showing what is happening, when, where, and who is participating.
- **Built for Live Mutability:** Updating the schedule on the ground is faster, cleaner, and less ambiguous than explaining changes in a chat group.

---

## 6. Product Principles

1. **State, Not Stream**
   TravelMemo displays the current consensus, not the conversation leading up to it. Updates mutate the plan in place; outdated details vanish from the active view.
2. **Glanceable in 3 Seconds (Design Heuristic)**
   The core information (time, activity, location, participants) must be immediately legible with one hand on a mobile screen. This is a design heuristic for cognitive clarity, not a formal SLA.
3. **Built for Change**
   Real travel is unpredictable. Shifting times, reordering stops, and adjusting participant assignments on the fly must be lightweight and forgiving.
4. **Share Without Friction**
   Anyone with the shared viewing link can check the itinerary immediately without creating an account or installing an app. *(Note: Frictionless viewing is decoupled from editing permissions. While viewing is frictionless, editing permissions and controls may evolve independently).*
5. **Complement Communication Tools**
   TravelMemo does not replace messaging apps (like LINE)—it complements them. Discussions and social chat belong in messaging; the resulting agreement belongs in TravelMemo.

---

## 7. Core vs. Supporting Capabilities

```
+-------------------------------------------------------------+
|                      CORE CAPABILITIES                      |
|  - Time, Activity, Location & Notes (Daily Timeline)        |
|  - Participant Assignment per Item (Split-Schedule Support) |
|  - Frictionless Link-Based Viewing                          |
|  - In-Place Schedule Mutability                             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                   SUPPORTING ENHANCEMENTS                   |
|  - Location Enhancements (Google Maps links, Places Autocomplete) |
|  - Pre-Trip Ingestion (AI Reservation Email Parser)         |
|  - Contextual Attachments (Photos, Reference Comments)      |
+-------------------------------------------------------------+
```

### Core Capabilities (The Essential Pillars)
- **Core Itinerary Elements:** Time, activity title, location, notes, and dates structured in a chronological daily timeline.
- **Participant Assignment:** Tagging members per schedule item to support split tracks and subgroup visibility.
- **Frictionless Viewing:** Instant URL-based access without authentication barriers.
- **Direct Mutability:** Fast in-place editing of schedule items on mobile.

### Supporting Capabilities (Enhancements, Not Core Value)
- **Location Enhancements:** Google Maps embed/links and Google Places autocomplete improve pin accuracy, but plain location text remains the baseline.
- **Pre-Trip Ingestion:** AI reservation parsing speeds up initial data entry, but does not solve live on-the-ground synchronization.
- **Contextual Attachments:** Lightweight photos and reference comments per card provide supplemental context.

---

## 8. Explicit Non-Goals & Scope Boundaries

To preserve simplicity and speed, TravelMemo intentionally avoids the following:

- **Not a Messaging / Chat App:** No direct messages, group chats, or social feeds.
- **Not a Scrapbook / Photo Album:** No high-resolution photo galleries or social travel blogging.
- **Not an Expense / Budget Tracker:** No receipt scanning, currency exchange, or bill splitting.
- **Not a Packing / To-Do App:** No generic packing checklists or unrelated task managers.
- **Not an Enterprise Project Manager:** No complex permission hierarchies, approval workflows, or heavy Gantt charts.
- **Not a Real-Time GPS Tracker:** No live device location tracking or background geofencing.

---

## 9. Criteria for Evaluating Future Features

Every proposed feature, backlog item, or pull request should be evaluated against these 5 questions:

1. **Does this feature make the current or upcoming itinerary easier to understand at a glance?**
2. **Does it make adapting to changes on the day of the trip faster and easier?**
3. **Does it preserve zero-friction viewing for all group members?**
4. **Could this capability be handled better in dedicated external apps (e.g., LINE, Splitwise, Apple Photos) without cluttering the itinerary?**
5. **Does this feature strengthen TravelMemo’s core purpose enough to justify the additional complexity?**
