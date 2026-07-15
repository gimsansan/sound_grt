# AI Agents Rules & Context

## Target Platform: Android Only

- **Android Exclusive**: This project is designed and developed strictly for the Android mobile environment.
- **Exclude iOS Context**: Do not suggest, explain, or write any iOS-specific code, settings, or exception handling (e.g., `playsInSilentModeIOS: true`). Focus entirely on features and troubleshooting for Android.

## Code Analysis & Dead Code Rules

- **Dead Code Identification**: Do not blindly assume a file is "in use" just because it is `import`ed somewhere. You MUST verify two things: (1) Is it reachable from the main app router (`app/` directory)? (2) Are the exported values or hooks actually consumed/used within the components? (e.g., A Context `Provider` wrapping the app is Dead Code if its values are never read).
- **Beware of Island Code**: Watch out for clusters of files that only import each other in a cyclic manner within a specific feature folder. If this cluster is completely disconnected from the main router, classify it as Dead Code.

## Current Project Context

- **Active Main Screen**: Currently, the ONLY active screen is `app/(tabs)/sound_grt/index.tsx` (Piano Keyboard Tab). All other remnants of word games, mini-games, and other tabs that are not directly/indirectly connected to this screen are considered 'Dead Code' as of now.

## Auto-Learning & Self-Correction

- **Proactive Documentation**: This `AGENTS.md` file acts as your permanent memory and system prompt extension. 
- **Immediate Action on Errors/Learnings**: Whenever you encounter a new problem (e.g., bugs, library conflicts, missed context, dead code analysis failure) or the user corrects your mistake, you MUST IMMEDIATELY and PROACTIVELY use your file editing tools to append the root cause and the workaround/solution to `AGENTS.md`. Do NOT wait for the user to tell you to do this.
- **Language Policy**: ALL entries in `AGENTS.md` MUST be written in clear, concise English to ensure maximum logical clarity and strict adherence by the LLM system.
- **No Preemptive Execution or State Changes**: When the user asks a question, ONLY provide the answer. Do NOT execute, propose, or trigger any terminal commands or state changes (e.g., switching branches) unless the user explicitly requests that action. State-altering actions require clear and direct user command, not just a theoretical inquiry.
- **Strict Structural Adherence**: When mapping or explaining elements from user-provided materials (e.g., images, diagrams, lists), strictly maintain the exact numbering, separation, and structure presented. Never arbitrarily merge, omit, or group distinct items (such as combining step 3 and 4) unless explicitly instructed. Ensure a strict 1:1 mapping.
- **Technical Accuracy & Precision**: Do not exaggerate or distort technical facts; prioritize accuracy above all else. Strictly distinguish between the code's 'logical control flow (software-level wait/delay)' and the system-level 'physical resource occupation (thread blocking/UI freezing)'.

---
**Global Response Preference**: Please answer in Korean.