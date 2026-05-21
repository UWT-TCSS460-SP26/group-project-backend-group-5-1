Week 2 Meeting 1

Agenda Item 1:
Decide on a Meeting Manager (This person is NOT the group leader. The meeting manager’s role is to keep the group on task during the meeting)
Meeting Manager: (Carson)

Agenda Item 2:
Decide on a Meeting Scribe (This person documents the meeting minutes. Group, help the scribe in their role. Keep your own notes. Work slowly enough so that the scribe may document the meeting)
Meeting Scribe: (Evin)

Agenda Item 3:
Get to know each group member. Each group member answer (at least) the following questions:
(Scribe - put the answers for ALL group members in your meeting minutes.)
What is your name/nickname and what do you prefer to be called?
Evin, Kylen, Carson, Geo

Where did you do Freshman/Sophomore year and/or where did you take 142/143? Did your 142/143 prepare you for this course?
Evin - Freshman/Sophomore years & 142/143 at UWT. 142/143 were mostly review from high school, so not much prep for this course.
Kylen - I took 142 and 143 at UWT. I would not say they prepared me for this course. Those classes teach strictly java, OOP and a small intro to data structures. There was no JavaScript, nor was I taught git/github or any other tools I would need to be prepared for this class. In fact, the only reason I'm actually prepared for this class is because I did learning outside of my classes that I'm able to do the work in this class proficiently.
Geo -
Carson - I took 142 and 143 at UWT. I only worked with python before, so they definetly prepared me for this course.

What are your programming strengths and weaknesses?
BE HONEST! It’s ok that you are not a good programmer. Let your group know so that the group as a whole can work with you.
Evin - Strengths: Quick learner, experience with a wide range of languages. Weaknesses: Unfamiliar with almost the entire tech stack.
Kylen - Strengths: Logic and project structure, implementation. Weaknesses: Tool familiarity.
Geo - Strengths: Tries his very best. Weaknesses: Tool and tech stack familiarity.
Carson - Strengths: Only needs to learn things once to replicate them consistently. Weaknesses: Takes a bit of time and effort to learn new stuff.

What other obligations take time away from your ability to work on this project?
Work, Family/Kids, 20 credits this quarter, etc. BE HONEST Let your group know so that the group as a whole can work with you.
Evin - Work, long commute
Kylen - Other classes, work
Geo - NONE.
Carson - Other classes, work

What is something you want others to know about yourself?
I’m a climber, I ride my bike to campus everyday, I’m weird and that's ok. I play Clash of Apex Duty 18 hours a day and am semi-pro. Etc.
Evin - This is my only class, so my time is dedicated exclusively to it. I do have a long (1hr+) commute though. I work on-campus TUES/WED/THUR
Kylen - I like programming and really want to break into a backend engineering role by the end of 2026. I like to play games, read light-novels and manga, watch anime. Am currently looking for other hobbies outside of class as well because my life is a little boring right now since it's really just work, exercise, eat, sleep for me right now.
Geo - Likes table top games
Carson - Plays trading card games

Agenda Item 4:
Decide on a group structure.
Do you want to have a dedicated group leader?
Who are the Subject Matter Experts (SME) for different areas? GUI, OO, Logic, Management, etc.
Students A and B pair program together while students C and D pair program together.
Student A is a dedicated tester/Unit test creator.
Consider your group's strengths and weaknesses. Pair a weak programmer with a strong programmer for pair programming sessions.
Who has Git experience and/or wants to dive into working with Git and GitHub to become the group's Git SME?
Etc.
During our discussion we realized we have a bit of a gap in frontend experience. We are all familiar with git and GitHub.
Kylen will be the dedicated group leader, and the SME on logic. We may set up a CI/CD pipeline. Strategy / structure revolved around
meeting up before sprints to determine responsibilities.

Agenda Item 5:
Discuss your concerns for the group project. Air any bad experiences from group work in the past. Discuss what you want to get out of this group project. Discuss strategies you think can work for a successful group project.
Evin - Surprisingly, I haven't really had bad experiences with group projects so far.
Kylen - Sometimes would have to carry the team (just how it is sometimes...), dealing with merge conflicts
Geo - Uneven workloads / balancing responsibilities
Carson - AWOL team members, lack of communication between team, exclusion from team meetings

Agenda Item 6:
The group needs to meet synchronously (online is OK) AT LEAST 3 times a Week. What times/days work for everyone?
https://www.when2meet.com/

1. Mondays @ 6pm
2. Tuesdays @ 1pm
3. Thursdays @ 6pm

Agenda Item 7:
Wrap-up
Smalltalk, critiques of the CS major pathway at UWT, other possible meeting times / strategies.

Week 3 Meeting 1
initial API design plans

some routes from IMDB:
GET /movie/popular
GET /tv/popular
GET /discover/movie Filter movies by genre, year, rating, region, etc.
GET /discover/tv Filter TV shows similarly
GET /movie/:movie_id
GET /tv/:tv_id
GET /discover

some information from movie details we might want:
Adult
Backdrop_path
Genre {
id:
name:
}
Id
Imbd_id
Origin_country
Original_language
Original_title
Overview
Popularity
Poster_path
Production_companies {
Id
Logo_path
Name
origin_country
}
Release_date
runtime
Spoken_langagues {
English_name
Iso_639_1
name
}
Title

Week 4 Meeting

- debugged JWT auth and checked that the post route for dev-login is working
- removed duplicate mounted auth route
- cleared up prisma confusion and fixed VS code errors for prisma features
- docker container for database composed for everyone

Sprint 4 Planning Meeting (Week 5)

Attendees: Kylen, Evin, Carson, Geo

Sprint Goal: Complete all remaining deliverables for Sprint 4 submission.

Backlog items assigned this sprint:

- Kylen: Admin-gated issue management routes (GET list, GET detail, PATCH status, DELETE); OpenAPI documentation for all new routes; partner-facing README
- Evin: Community discovery routes (top-rated, most-reviewed) with SQL aggregates; discovery tests
- Carson: Authenticated self-list routes (/ratings/me, /reviews/me); CORS allowlist configuration
- Geo: Author object on all rating and review responses; ratings/reviews serialization consistency; bug-fix tests

Ceremony notes:

- Sprint review: demoed all Sprint 4 routes against the deployed Render instance; confirmed Auth² token validation and role gates work end-to-end
- Retrospective: team agreed to keep PR reviews async (comment + approve on GitHub) to avoid blocking merges; identified merge conflicts as main friction point — resolved by rebasing feature branches onto main before opening PRs
- Next sprint: address any partner integration feedback; improve test coverage for edge cases flagged during review

Sprint 4 Daily Standups (async in group chat):

May 5 — blocked on Prisma schema migration for Issue model; Kylen unblocked by clarifying the migration flow
May 6 — discovery routes drafted by Evin; ratings serialization in progress by Geo
May 7 — merge conflicts resolved; all routes passing locally; OpenAPI spec updated
May 8 — final tests written and passing; README updated; submitted

Sprint 5 Planning Meeting (Week 6)

Attendees: Kylen, Evin, Carson, Geo

Sprint Goal: Deliver a working, deployed frontend bug-report form that integrates end-to-end with the live POST /issues endpoint.

Individual scaffold review:

Each member demoed their individually-built scaffold. Notes captured per member:

- Kylen: React + Vite scaffold with a controlled form component and fetch-based submission; used environment variables for API URL; included basic error state display
- Evin: Next.js scaffold; clean layout and loading spinner on submit; hardcoded API URL (flagged for fix before merge); no network-failure state
- Carson: Vanilla HTML/CSS/JS scaffold; lightest bundle; all three UI states (success, validation error, network failure) implemented; no env-var support
- Geo: React + Vite scaffold; styled with Tailwind; success/error toasts; env-var aware; missing DELETE and PATCH wiring (not required for this sprint)

Comparison and pick-or-merge decision:

After reviewing all four builds, the team agreed to merge Kylen's scaffold as the base (env-var pattern + React + Vite already in place) and pull Carson's three-state UI feedback approach into it. Evin's loading spinner will be cherry-picked in. Geo's Tailwind styling will be adopted if time permits. Agent-assisted merge is acceptable for the boilerplate reconciliation.

Backlog items assigned this sprint:

- Kylen: Accept the Sprint 5 GitHub Classroom group repository; push the merged final build; wire all API calls through VITE_API_URL env var (no hardcoded URLs); verify form posts to live POST /issues via Postman and Prisma Studio
- Evin: Port the loading spinner into the merged build; write up individual workflow document and commit it to the team FE repo (README or WORKFLOWS.md)
- Carson: Port the three UI feedback states (success, validation-error, network-failure) into the merged build; confirm each state renders correctly against the live API
- Geo: Deploy the final build to Vercel; set VITE_API_URL to the production BE URL in Vercel environment settings; share the public Vercel URL with the team; add individual workflow writeup to the team FE repo

Shared / cross-cutting tasks:

- All four members must make at least one commit to the final team FE repository before submission
- Kylen: Update BE CORS allowlist (CORS_ALLOWED_ORIGINS on Render) to include the Vercel origin; verify OPTIONS preflight returns 204 end-to-end
- Kylen: Add the final FE URL to the partner-facing README in the BE repo (Done — https://group-project-bug-tracker-front-end-one.vercel.app/) and send it to the downstream partner

Ceremony notes:

- Sprint review: demo the deployed Vercel URL end-to-end — submit a valid bug report, trigger a validation error, and simulate a network failure; confirm each state shows visible UI feedback; verify the submission appears in Prisma Studio on the BE side
- Retrospective: keep async standups going; flag any Vercel build failures in the group chat immediately so the team can unblock quickly
- All individual workflow writeups must be committed to the team FE repo before the sprint closes

Sprint 5 Daily Standups (async in group chat):

May 18 — merged scaffolds; Kylen pushed initial merge to team FE repo; CORS update in progress
May 19 — Carson porting UI feedback states; Evin adding spinner; Geo deploying to Vercel
May 20 — Vercel deploy live; CORS preflight verified; all members committing workflow writeups
May 21 — final testing against live API; Prisma Studio confirmation; submission
