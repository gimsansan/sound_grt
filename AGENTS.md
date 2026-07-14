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
