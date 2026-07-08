I want to build a web application called “The Living Ink Diary,” inspired by the idea of a cursed magical diary that replies to whatever the user writes. The app should feel like a mysterious living diary, not like a normal AI chatbot.

The user experience should start with a closed dark diary on screen. When the user opens the app, the diary should reveal itself through a horizontal sliding/opening animation, as if an old magical book is opening. After the animation, the inside diary page should appear with an old parchment-style design.

The main screen should contain a large diary page where the user can both type text and draw using mouse, touch, or stylus. The typed text will be the main message sent to Gemini. The drawing layer should feel like magical ink, allowing the user to draw symbols, marks, signatures, or doodles on the page. In the first version, drawings are mainly visual and emotional; later they can be analyzed by Gemini using image input.

The diary should not look like a chatbot. There should be no chat bubbles, no modern send icon, and no normal loading spinner. The interaction should feel magical and cinematic.

The user writes something on the page. Then they press a button called “Let the ink sink.” After pressing it, the user’s text and drawing should visually react: the ink darkens, slightly spreads, fades, and sinks into the page. During this moment, the app should show subtle magical feedback such as “The diary is reading your words...” or “The ink is listening...”

After the message is sent to Gemini, the diary should reply directly on the page. The reply should appear letter by letter in a cursed handwritten style, as if the diary itself is writing back. The reply should not appear instantly. It should feel alive, slow, mysterious, and slightly unsettling.

The diary should remember the conversation using localStorage. Gemini itself does not remember past conversations automatically, so the app should store previous user messages and diary replies locally. Every time the user writes a new message, the app should send the latest user message plus recent localStorage conversation history to Gemini so the diary can respond with memory and continuity.

There should be a button at the top called “Reset Diary Memory.” When clicked, it should clear all saved localStorage conversation history and return the diary to a fresh state. After reset, the diary should act like it no longer remembers the user.

The Gemini response should follow a strong cursed diary personality. The diary should sound ancient, intelligent, calm, manipulative, poetic, mysterious, and dangerous. It should never say it is an AI. It should never mention Gemini, prompts, APIs, models, or technology. It should not use emojis or modern slang. It should avoid directly copying Harry Potter names, characters, places, spells, or story details. The project should feel inspired by magical cursed diaries but should have its own original identity.

The diary replies should usually be short, cinematic, and powerful. The diary should respond in 1 to 4 sentences. It should sometimes remember past things the user wrote. It should ask unsettling follow-up questions when appropriate. It should feel like it is slowly learning the user, but it should not become too verbose or generic.

The app should support different emotional effects based on the diary’s reply. Gemini should return not only the reply text, but also a mood and visual effect. Possible moods can include sinister, curious, mocking, whispering, angry, calm, or ominous. Possible effects can include fading ink, bleeding ink, page shake, glowing text, scratch marks, dark mist, or whisper-style reply. The frontend should use the mood and effect to change the animation and atmosphere of the diary reply.

The first version should focus only on the magical diary experience. It should not include login, database, user profiles, payments, dashboard, or social features. The goal is to create a polished, viral, 30-second demo experience where a user opens a magical diary, writes into it, watches the ink disappear, and receives a creepy intelligent reply.

The final product should feel immersive, dark, mysterious, and premium. The design should use parchment textures, dark ink, subtle shadows, candlelight-style glow, old book borders, handwritten typography, and smooth animations. The entire experience should make the user feel like the diary is alive.
