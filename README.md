PRD: Project "MatchPoint" (LinkedIn Rapid Job Discovery)
Status: Draft / MVP Planning
Team: Pedro Martins and Gamaliel Leguista
Availability: Afternoons & Nights (Slack - 1pm Tue-Fri)

1. Problem / Opportunity
The current LinkedIn job search experience is bogged down by high friction. Users must click into individual listings, navigate away from their search results, and manually filter through dense text blocks. This "slow-search" model leads to application fatigue and missed opportunities.
The Opportunity: To apply the high-velocity "swipe" UX pattern to professional networking. By turning job discovery into a low-friction, gesture-based activity, we can significantly increase the volume of jobs a user reviews while providing cleaner data to recruiters about candidate preferences.
2. Target Users & Use Cases
Active Job Seekers: Professionals who want to clear through 50+ listings in a morning commute.
Passive Seekers: Users who aren't ready for a full "application session" but want to quickly curate a "Shortlist" or "Archive" while on the go.
Recruiters: Hiring managers who need higher engagement rates on their postings.
3. Proposed Solution (Elevator Pitch)
MatchPoint is a high-speed interface layer for LinkedIn Jobs. It transforms the traditional list view into a stack of "Job Cards." Using intuitive gestures—Swipe Right to Save/Accept, Swipe Left to Decline, and Swipe Down to Archive—users can curate a massive volume of opportunities in minutes. It strips away the clutter, presenting only the essentials (Role, Salary, Top Skills, and Hybrid/Remote status) for a "decision-at-a-glance" experience.
4. Goals / Measurable Outcomes
Efficiency: Reduce the average time spent evaluating a single job listing to under 5 seconds.
Engagement: Increase the number of "Saved Jobs" per user session by 40% compared to the standard list view.
Clean Data: Build a "Decline Reason" feedback loop (e.g., swiping left prompts a quick "Salary too low" or "Wrong Tech Stack" tag).
5. MVP Functional Requirements
Core Functionality (The "Must-Haves")
[P0] Gesture Engine: Implementation of a card-stack UI with three distinct triggers:
Right: Add to "Interested" list (triggers LinkedIn's "Save" API).
Left: Hide/Dismiss from current search view.
Down: Move to "Archive" (hidden from future searches).
[P0] Snapshot Card View: A condensed UI showing only critical metadata: Job Title, Company Logo, Location, and "Must-Have" Skills.
[P1] Instant Filters: A persistent "Quick-Filter" bar for Salary Floor and Remote/On-site preference to ensure the stack remains relevant.
Telemetry & UX Sketches
[P1] Progress Haptics: Tactical feedback for each swipe to create a "gamified" feel.
[P2] One-Tap Detail: A "Tap to Expand" feature that reveals the full JD without leaving the stack.
[P2] Recruiter Matching: A "Mutual Interest" notification if a user swipes right on a job where their profile is already a "Top Applicant" match.
6. Constraints & "Don'ts"
DON'T build a new job board. This is a frontend layer/interface for existing LinkedIn data.
DON'T allow "Swipe to Apply" for the MVP. Swiping right should only "Save" the job to prevent accidental, low-quality applications.
DON'T include long-form descriptions on the primary card. If it doesn't fit in a 300x400 pixel card, it stays in the "Expand" view.
7. Appendix: Technical Stack
Logic Layer: Python (FastAPI) for processing job metadata and filtering.
Frontend Layer: React Native or Flutter (Essential for fluid, native-feeling swipe gestures).
Data Layer: LinkedIn Open API (or web-scraping/integration layer for MVP testing).
Communication: Slack (Synchronized for afternoon sessions).



