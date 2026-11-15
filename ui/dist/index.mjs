import * as sdk from "@kirocrew/app-sdk";
import { activeLocale, fmtNumber, useAppApi, useChatLauncher, useImeGuard, useLanguageGeneration } from "@kirocrew/app-sdk";
import { ErrorNotice } from "@kirocrew/app-sdk/ui";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Brain, Building2, Check, Circle, Ghost, MessageSquare, Pause, PictureInPicture2, Rocket, Sparkles, TreePine, Wand2, Waves, X } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/hostSdk.ts
/**
* The host seams above App Kit level 0 this page uses, read off a namespace
* import. A named import of an export the host does not provide fails the whole
* bundle at load; read this way, an older host leaves the name undefined and
* the page says what it needs instead.
*
* `useHostSessions` (App Kit level 8) is the dashboard's own live session list
* and the acts the page takes on a session: reply or steer, decide its pending
* tool approval, start a new session. Each is admitted by this app's declared
* `permissions.api`.
*/
var useHostSessions = sdk.useHostSessions;
// src/hooks/hostSessionsContext.ts
/** The host's session control for every scene's popover, set once by the page
*  so the eight scenes keep the built-in's call shape. Null outside the page. */
var HostSessionsContext = createContext(null);
// src/i18n/t.ts
/**
* The app's own strings. A bundle cannot read the dashboard's catalogs (those
* belong to the host and change with it), so every locale the dashboard ships is
* bundled here and looked up against the host's active language.
*
* Lookup order: the exact locale (`pt`, `zh-CN`), then its base language, then
* English, then the key itself, so a missing translation shows English rather
* than nothing. `{{name}}` placeholders are filled from `vars`; one with no value
* is left as written. With a numeric `count`, the CLDR plural form of that
* locale is tried first (`result_count_one`, `_few`, `_many`, `_other`), the
* same key shape the dashboard's catalogs use.
*
* `t` reads the language at call time. The root component subscribes to the
* host's language changes (`useLanguageGeneration`), and its re-render reaches
* every child, so a language switch repaints the page without a reload.
*/
var CATALOGS = {
	bn: {
		app: { "needs_newer_host": "Kiro Crew-এর এই সংস্করণে Agent Worlds তোমার সেশনগুলো দেখতে পারছে না। এখানে তোমার এজেন্টদের দেখতে Kiro Crew আপডেট করো।" },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "সব স্লট ভর্তি",
			"approve": "অনুমোদন",
			"click_for_thread": "থ্রেড দেখতে ক্লিক করুন",
			"close_thread_view": "থ্রেড ভিউ বন্ধ করুন",
			"couldn_t_load_messages": "মেসেজ লোড করা যায়নি",
			"create_a_new_chat_session_a_new_agent_joins_this": "নতুন চ্যাট সেশন তৈরি করো: এই জগতে নতুন একজন এজেন্ট যোগ দেবে",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · চলছে",
			"deny": "প্রত্যাখ্যান",
			"idle": "নিষ্ক্রিয়",
			"kiro_is_working": "kiro কাজ করছে…",
			"loading_thread": "থ্রেড লোড হচ্ছে…",
			"message": "{{name}}-কে বার্তা",
			"message_sent": "মেসেজ পাঠানো হয়েছে",
			"message_this_agent": "এই এজেন্টকে মেসেজ করো…",
			"needs_approval": "অনুমোদন প্রয়োজন:",
			"new_session": "+ নতুন সেশন",
			"no_messages_yet": "এখনও কোনো মেসেজ নেই",
			"open_chat": "চ্যাট খুলুন",
			"recent_messages_for": "{{name}}-এর সাম্প্রতিক বার্তা",
			"retry": "আবার চেষ্টা করো",
			"retry_sending_message": "মেসেজ আবার পাঠানোর চেষ্টা করো",
			"send": "পাঠাও",
			"send_message": "মেসেজ পাঠাও",
			"sending_message": "মেসেজ পাঠানো হচ্ছে",
			"steer_this_agent": "এই এজেন্টকে স্টিয়ার করো…",
			"subagent": "সাবএজেন্ট{{detail}}",
			"summoning": "ডাকা হচ্ছে…",
			"waiting_on_approval": "অনুমোদনের অপেক্ষায়:",
			"working": "কাজ করছে"
		} },
		manifest: {
			"configuration_1": "অ্যাপটি চালু করে Agent Worlds খুলুন, একটি দৃশ্য বেছে নিন এবং চাইলে আলাদা উইন্ডোতে নিন; কোনো পরিচয়পত্র বা বাইরের পরিষেবা লাগে না।",
			"description": "তোমার চলমান এজেন্টগুলোকে অ্যানিমেটেড পিক্সেল-আর্ট দৃশ্যের চরিত্রে বদলে দেয়, যাতে এক নজরেই বোঝা যায় Kiro Crew কতটা ব্যস্ত। প্রতিটি সক্রিয় এজেন্ট একটি স্প্রাইট হিসেবে দেখা যায়, যা কাজ শুরু ও শেষ হওয়ার সঙ্গে প্রতিক্রিয়া দেখায়, সাধারণ অফিস থেকে জাদুকরের মিনার বা পানির নিচের ল্যাব পর্যন্ত থিমযুক্ত দৃশ্যে। আলাদা উইন্ডোতে বের করে নিলে কাজ করার সময় এটি দ্বিতীয় স্ক্রিনে রাখা যায়।",
			"display_name": "Agent Worlds",
			"highlight_1": "কোন এজেন্টগুলো চলছে তার লাইভ ভিউ, তালিকা নয় বরং চরিত্র হিসেবে",
			"highlight_2": "থিমযুক্ত দৃশ্য, যেমন Office, Panda Den, Neural Net, Wizard Tower ও Deep Lab",
			"highlight_3": "দ্বিতীয় মনিটরের জন্য আলাদা উইন্ডোতে বের করে নাও; দৃশ্যের নির্বাচন সিঙ্কে থাকে",
			"highlight_4": "তুমি যে দৃশ্য বেছেছ, পরের বারও তা মনে রাখে",
			"highlight_5": "কোনো চরিত্রে ক্লিক করে তার সাম্প্রতিক বার্তা পড়ো, তাকে উত্তর দাও বা দিক বদলাও, আর যে টুলের জন্য সে অপেক্ষা করছে তা অনুমোদন বা প্রত্যাখ্যান করো",
			"page_label": "Worlds",
			"use_case_1": "Crew কাজ করার সময় লাইভ এজেন্ট, cron ও subagent-এর কার্যকলাপ দ্বিতীয় স্ক্রিনে এক নজরে দেখুন।"
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "ডেলিভারি নিশ্চিত হয়নি: আপনার লেখা ইনপুট বাক্সে ফিরিয়ে দেওয়া হয়েছে; আবার পাঠানোর আগে কথোপকথনটি দেখে নিন।",
				"send_failed_with_error": "পাঠানো যায়নি: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "টুপি, চশমা আর কেপ পরা Kiro ভূত",
					"ghost_label": "Kiro ভূতুড়ে ডেরা",
					"mission_desc": "NASA অপারেশন কেন্দ্র",
					"mission_label": "Mission Control",
					"neural_desc": "নক্ষত্রমণ্ডলের মানচিত্র",
					"neural_label": "নিউরাল নেটওয়ার্ক",
					"office_desc": "ক্লাসিক পিক্সেল অফিস",
					"office_label": "অফিস",
					"panda_desc": "বাঁশবনের কর্মক্ষেত্র, সবাই পান্ডা",
					"panda_label": "পান্ডার ডেরা",
					"serengeti_desc": "জিরাফ, ওয়ার্টহগ আর হাতির সেরেঙ্গেটি সাভানা",
					"serengeti_label": "জলাশয়",
					"underwater_desc": "জলের নিচের স্টেশন",
					"underwater_label": "গভীর সমুদ্র ল্যাব",
					"wizard_desc": "আলকেমির পরীক্ষাগার",
					"wizard_label": "জাদুকরের মিনার"
				},
				"ghostScene": {
					"friendly_hauntings_only": "শুধু বন্ধুত্বপূর্ণ ভূতুড়েপনা",
					"kiro_ghost_haunt_animation": "Kiro ভূতের ভুতুড়ে অ্যানিমেশন",
					"kiro_ghost_haunt_text_overlay": "Kiro ভূতের ভুতুড়ে টেক্সট ওভারলে",
					"kiro_haunt": "Kiro ভূতুড়ে ডেরা"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "লেভেল {{level}} {{title}}",
					"mission_control_scene": "মিশন কন্ট্রোল দৃশ্য"
				} },
				"neuralConstellationScene": {
					"active": "সক্রিয়",
					"idle": "নিষ্ক্রিয়",
					"neural_constellation_animation": "নিউরাল কনস্টেলেশন অ্যানিমেশন",
					"neural_constellation_text_overlay": "নিউরাল কনস্টেলেশন টেক্সট ওভারলে",
					"neural_network": "নিউরাল নেটওয়ার্ক"
				},
				"officeScene": {
					"active": "সক্রিয়",
					"agent_office": "এজেন্ট অফিস",
					"done": "সম্পন্ন",
					"headquarters": "সদর দপ্তর",
					"no_tasks": "কোনো টাস্ক নেই",
					"office_scene": "অফিস দৃশ্য",
					"office_scene_labels": "অফিস দৃশ্যের লেবেল",
					"to_do": "করতে হবে"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 পান্ডার ডেরা",
					"panda_office_scene": "পান্ডা অফিস দৃশ্য",
					"panda_office_scene_labels": "পান্ডা অফিস দৃশ্যের লেবেল"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "গভীর সমুদ্র ল্যাব",
					"research_station": "গবেষণা কেন্দ্র",
					"underwater_lab_scene": "পানির নিচের ল্যাব দৃশ্য",
					"underwater_lab_scene_labels": "পানির নিচের ল্যাব দৃশ্যের লেবেল"
				},
				"wateringHoleScene": {
					"on_the_savanna": "সাভানায় {{n}}/{{total}}",
					"watering_hole": "জলাশয়",
					"watering_hole_scene": "জলাশয় দৃশ্য",
					"watering_hole_scene_labels": "জলাশয় দৃশ্যের লেবেল"
				},
				"wizardTowerScene": {
					"arcane_academy": "জাদুবিদ্যা অ্যাকাডেমি",
					"casting": "মন্ত্র পড়ছে",
					"empty": "খালি",
					"i_see": "বুঝলাম!",
					"resting": "বিশ্রামে",
					"wizard_tower_scene": "জাদুকরের টাওয়ার দৃশ্য",
					"wizard_tower_spell_text": "জাদুকরের টাওয়ারের মন্ত্র টেক্সট"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_one": "{{n}}টি সক্রিয়",
				"agents_active_other": "{{n}}টি সক্রিয়",
				"agents_present_one": "{{n}}টি এজেন্ট উপস্থিত",
				"agents_present_other": "{{n}}টি এজেন্ট উপস্থিত",
				"focus_popout": "পপআউটে ফোকাস করুন",
				"hide_controls": "কন্ট্রোল লুকাও",
				"playing_in_popout_window": "পপআউট উইন্ডোতে চলছে",
				"pop_out_to_separate_window": "আলাদা উইন্ডোতে পপ আউট করুন",
				"scene_button": "{{label}} দৃশ্য: {{desc}}",
				"scene_label": "দৃশ্য",
				"show_controls": "কন্ট্রোল দেখাও",
				"slots_open_one": "{{n}}টি স্লট খোলা",
				"slots_open_other": "{{n}}টি স্লট খোলা",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "কন্ট্রোল লুকাও",
				"scene_label": "দৃশ্য",
				"show_controls": "কন্ট্রোল দেখাও"
			}
		}
	},
	de: {
		app: { "needs_newer_host": "Agent Worlds kann in dieser Version von Kiro Crew deine Sitzungen nicht erreichen. Aktualisiere Kiro Crew, um deine Agenten hier zu sehen." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Alle Slots sind belegt",
			"approve": "Genehmigen",
			"click_for_thread": "für Thread klicken",
			"close_thread_view": "Thread-Ansicht schließen",
			"couldn_t_load_messages": "Nachrichten konnten nicht geladen werden",
			"create_a_new_chat_session_a_new_agent_joins_this": "Neue Chat-Sitzung erstellen: ein neuer Agent betritt diese Welt",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · läuft",
			"deny": "Ablehnen",
			"idle": "Inaktiv",
			"kiro_is_working": "Kiro arbeitet…",
			"loading_thread": "Thread wird geladen…",
			"message": "Nachricht {{name}}",
			"message_sent": "Nachricht gesendet",
			"message_this_agent": "Diesem Agenten schreiben…",
			"needs_approval": "benötigt Genehmigung:",
			"new_session": "+ Neue Sitzung",
			"no_messages_yet": "Noch keine Nachrichten",
			"open_chat": "Chat öffnen",
			"recent_messages_for": "Neueste Nachrichten für {{name}}",
			"retry": "Erneut versuchen",
			"retry_sending_message": "Senden erneut versuchen",
			"send": "Senden",
			"send_message": "Nachricht senden",
			"sending_message": "Nachricht wird gesendet",
			"steer_this_agent": "Diesen Agenten steuern…",
			"subagent": "Subagent{{detail}}",
			"summoning": "wird herbeigerufen…",
			"waiting_on_approval": "Warten auf Genehmigung:",
			"working": "Arbeitet"
		} },
		manifest: {
			"configuration_1": "Aktiviere die App, öffne Agent Worlds, wähle eine Szene und kopple sie optional in ein eigenes Fenster aus; Anmeldedaten oder externe Dienste sind nicht erforderlich.",
			"description": "Verwandelt deine laufenden Agenten in Figuren einer animierten Pixel-Art-Szene, sodass ein Blick genügt, um zu sehen, wie ausgelastet Kiro Crew ist. Jeder aktive Agent erscheint als Sprite, das reagiert, wenn Arbeit beginnt und endet, über Themenszenen hinweg, vom klassischen Büro bis zum Zauberturm oder Unterwasserlabor. Kopple es in ein eigenes Fenster aus, um es beim Arbeiten auf einem zweiten Bildschirm zu behalten.",
			"display_name": "Agent Worlds",
			"highlight_1": "Live-Ansicht der laufenden Agenten, als Figuren statt als Liste",
			"highlight_2": "Themenszenen wie Büro, Panda-Höhle, Neuronales Netz, Zauberturm und Tiefseelabor",
			"highlight_3": "In ein separates Fenster für einen zweiten Monitor auskoppeln; die Szenenauswahl bleibt synchron",
			"highlight_4": "Merkt sich deine gewählte Szene zwischen den Besuchen",
			"highlight_5": "Klicke auf eine Figur, um ihre neuesten Nachrichten zu lesen, ihr zu antworten oder sie umzulenken und das Tool zu erlauben oder abzulehnen, auf das sie wartet",
			"page_label": "Welten",
			"use_case_1": "Behalte aktive Agenten, Cronjobs und Subagenten während der Crew-Arbeit auf einem zweiten Bildschirm jederzeit im Blick."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Zustellung nicht bestätigt: dein Text steht wieder im Eingabefeld; prüfe den Verlauf, bevor du erneut sendest.",
				"send_failed_with_error": "Senden fehlgeschlagen: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Kiro-Geister mit Hüten, Brillen und Umhängen",
					"ghost_label": "Kiro-Spuk",
					"mission_desc": "NASA-Kontrollzentrum",
					"mission_label": "Mission Control",
					"neural_desc": "Sternbildkarte",
					"neural_label": "Neuronales Netz",
					"office_desc": "Klassisches Pixel-Büro",
					"office_label": "Büro",
					"panda_desc": "Arbeitsplatz im Bambuswald, nur Pandas",
					"panda_label": "Panda-Höhle",
					"serengeti_desc": "Serengeti-Savanne mit Giraffen, Warzenschweinen und Elefanten",
					"serengeti_label": "Wasserloch",
					"underwater_desc": "Unterwasserstation",
					"underwater_label": "Tiefseelabor",
					"wizard_desc": "Alchemielabor",
					"wizard_label": "Zauberturm"
				},
				"ghostScene": {
					"friendly_hauntings_only": "nur freundliches Spuken",
					"kiro_ghost_haunt_animation": "Animation des Kiro-Geisterspuks",
					"kiro_ghost_haunt_text_overlay": "Text-Overlay des Kiro-Geisterspuks",
					"kiro_haunt": "Kiro-Spuk"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Lv.{{level}} {{title}}",
					"mission_control_scene": "Kontrollzentrum-Szene"
				} },
				"neuralConstellationScene": {
					"active": "aktiv",
					"idle": "inaktiv",
					"neural_constellation_animation": "Animation der neuronalen Konstellation",
					"neural_constellation_text_overlay": "Text-Overlay der neuronalen Konstellation",
					"neural_network": "Neuronales Netz"
				},
				"officeScene": {
					"active": "Aktiv",
					"agent_office": "Agentenbüro",
					"done": "Fertig",
					"headquarters": "Hauptquartier",
					"no_tasks": "Keine Aufgaben",
					"office_scene": "Büroszene",
					"office_scene_labels": "Beschriftungen der Büroszene",
					"to_do": "Zu erledigen"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Panda-Höhle",
					"panda_office_scene": "Panda-Büroszene",
					"panda_office_scene_labels": "Beschriftungen der Panda-Büroszene"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Tiefseelabor",
					"research_station": "Forschungsstation",
					"underwater_lab_scene": "Unterwasserlabor-Szene",
					"underwater_lab_scene_labels": "Beschriftungen der Unterwasserlabor-Szene"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} in der Savanne",
					"watering_hole": "Wasserloch",
					"watering_hole_scene": "Wasserloch-Szene",
					"watering_hole_scene_labels": "Beschriftungen der Wasserloch-Szene"
				},
				"wizardTowerScene": {
					"arcane_academy": "Arkane Akademie",
					"casting": "zaubert",
					"empty": "leer",
					"i_see": "Aha!",
					"resting": "ruht",
					"wizard_tower_scene": "Zauberturm-Szene",
					"wizard_tower_spell_text": "Zauberspruchtext des Zauberturms"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_one": "{{n}} aktiv",
				"agents_active_other": "{{n}} aktiv",
				"agents_present_one": "{{n}} Agent vorhanden",
				"agents_present_other": "{{n}} Agenten vorhanden",
				"focus_popout": "Ausgekoppeltes Fenster fokussieren",
				"hide_controls": "Steuerung ausblenden",
				"playing_in_popout_window": "Wird im ausgekoppelten Fenster abgespielt",
				"pop_out_to_separate_window": "In ein separates Fenster auskoppeln",
				"scene_button": "Szene {{label}}: {{desc}}",
				"scene_label": "Szene",
				"show_controls": "Steuerung anzeigen",
				"slots_open_one": "{{n}} Slot frei",
				"slots_open_other": "{{n}} Slots frei",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Steuerung ausblenden",
				"scene_label": "Szene",
				"show_controls": "Steuerung anzeigen"
			}
		}
	},
	en: {
		app: { "needs_newer_host": "Agent Worlds can't reach your sessions on this version of Kiro Crew. Update Kiro Crew to see your agents here." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "All slots are occupied",
			"approve": "Approve",
			"click_for_thread": "click for thread",
			"close_thread_view": "Close thread view",
			"couldn_t_load_messages": "Couldn't load messages",
			"create_a_new_chat_session_a_new_agent_joins_this": "Create a new chat session: a new agent joins this world",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · running",
			"deny": "Deny",
			"idle": "Idle",
			"kiro_is_working": "kiro is working…",
			"loading_thread": "Loading thread…",
			"message": "Message {{name}}",
			"message_sent": "Message sent",
			"message_this_agent": "Message this agent…",
			"needs_approval": "needs approval:",
			"new_session": "+ New session",
			"no_messages_yet": "No messages yet",
			"open_chat": "Open chat",
			"recent_messages_for": "Recent messages for {{name}}",
			"retry": "Retry",
			"retry_sending_message": "Retry sending message",
			"send": "Send",
			"send_message": "Send message",
			"sending_message": "Sending message",
			"steer_this_agent": "Steer this agent…",
			"subagent": "Subagent{{detail}}",
			"summoning": "summoning…",
			"waiting_on_approval": "Waiting on approval:",
			"working": "Working"
		} },
		manifest: {
			"configuration_1": "Enable the app, open Agent Worlds, choose a scene, and optionally pop it out; no credentials or external service are required.",
			"description": "Turns your running agents into characters in an animated pixel-art scene, so a glance tells you how busy Kiro Crew is. Each active agent appears as a sprite that reacts as work starts and finishes, across themed scenes from a classic office to a wizard tower or an underwater lab. Pop it out into its own window to keep it on a second screen while you work.",
			"display_name": "Agent Worlds",
			"highlight_1": "Live view of which agents are running, as characters rather than a list",
			"highlight_2": "Themed scenes including Office, Panda Den, Neural Net, Wizard Tower, and Deep Lab",
			"highlight_3": "Pop out into a separate window for a second monitor; scene choice stays in sync",
			"highlight_4": "Remembers your chosen scene between visits",
			"highlight_5": "Click a character to read its latest messages, reply to or steer it, and approve or deny the tool it is waiting on",
			"page_label": "Worlds",
			"use_case_1": "Keep an at-a-glance, second-screen view of live agents, crons, and subagents while a crew is working."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Delivery not confirmed: your text is back in the composer; check the conversation above before sending it again.",
				"send_failed_with_error": "Send failed: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Kiro ghosts in hats, glasses, and capes",
					"ghost_label": "Kiro Haunt",
					"mission_desc": "NASA ops center",
					"mission_label": "Mission Control",
					"neural_desc": "Constellation map",
					"neural_label": "Neural Net",
					"office_desc": "Classic pixel office",
					"office_label": "Office",
					"panda_desc": "Bamboo forest workspace, all pandas",
					"panda_label": "Panda Den",
					"serengeti_desc": "Serengeti savanna with giraffes, warthogs, and elephants",
					"serengeti_label": "Watering Hole",
					"underwater_desc": "Underwater station",
					"underwater_label": "Deep Lab",
					"wizard_desc": "Alchemy lab",
					"wizard_label": "Wizard Tower"
				},
				"ghostScene": {
					"friendly_hauntings_only": "friendly hauntings only",
					"kiro_ghost_haunt_animation": "Kiro ghost haunt animation",
					"kiro_ghost_haunt_text_overlay": "Kiro ghost haunt text overlay",
					"kiro_haunt": "Kiro Haunt"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Lv.{{level}} {{title}}",
					"mission_control_scene": "Mission control scene"
				} },
				"neuralConstellationScene": {
					"active": "active",
					"idle": "idle",
					"neural_constellation_animation": "Neural constellation animation",
					"neural_constellation_text_overlay": "Neural constellation text overlay",
					"neural_network": "Neural Network"
				},
				"officeScene": {
					"active": "Active",
					"agent_office": "Agent Office",
					"done": "Done",
					"headquarters": "headquarters",
					"no_tasks": "No tasks",
					"office_scene": "Office scene",
					"office_scene_labels": "Office scene labels",
					"to_do": "To Do"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Panda Den",
					"panda_office_scene": "Panda office scene",
					"panda_office_scene_labels": "Panda office scene labels"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Deep Sea Lab",
					"research_station": "research station",
					"underwater_lab_scene": "Underwater lab scene",
					"underwater_lab_scene_labels": "Underwater lab scene labels"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} on the savanna",
					"watering_hole": "Watering Hole",
					"watering_hole_scene": "Watering hole scene",
					"watering_hole_scene_labels": "Watering hole scene labels"
				},
				"wizardTowerScene": {
					"arcane_academy": "Arcane Academy",
					"casting": "casting",
					"empty": "empty",
					"i_see": "I see!",
					"resting": "resting",
					"wizard_tower_scene": "Wizard tower scene",
					"wizard_tower_spell_text": "Wizard tower spell text"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_one": "{{n}} active",
				"agents_active_other": "{{n}} active",
				"agents_present_one": "{{n}} agent present",
				"agents_present_other": "{{n}} agents present",
				"focus_popout": "Focus popout",
				"hide_controls": "Hide controls",
				"playing_in_popout_window": "Playing in popout window",
				"pop_out_to_separate_window": "Pop out to separate window",
				"scene_button": "{{label}} scene: {{desc}}",
				"scene_label": "Scene",
				"show_controls": "Show controls",
				"slots_open_one": "{{n}} slot open",
				"slots_open_other": "{{n}} slots open",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Hide controls",
				"scene_label": "Scene",
				"show_controls": "Show controls"
			}
		}
	},
	es: {
		app: { "needs_newer_host": "Agent Worlds no puede acceder a tus sesiones en esta versión de Kiro Crew. Actualiza Kiro Crew para ver aquí a tus agentes." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Todos los slots están ocupados",
			"approve": "Aprobar",
			"click_for_thread": "haz clic para ver el hilo",
			"close_thread_view": "Cerrar la vista de hilo",
			"couldn_t_load_messages": "No se pudieron cargar los mensajes",
			"create_a_new_chat_session_a_new_agent_joins_this": "Crear una sesión de chat nueva: un agente nuevo se une a este mundo",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · en ejecución",
			"deny": "Denegar",
			"idle": "Inactivo",
			"kiro_is_working": "kiro está trabajando…",
			"loading_thread": "Cargando hilo…",
			"message": "Envía un mensaje a {{name}}",
			"message_sent": "Mensaje enviado",
			"message_this_agent": "Envía un mensaje a este agente…",
			"needs_approval": "necesita aprobación:",
			"new_session": "+ Sesión nueva",
			"no_messages_yet": "Aún no hay mensajes",
			"open_chat": "Abrir chat",
			"recent_messages_for": "Mensajes recientes de {{name}}",
			"retry": "Reintentar",
			"retry_sending_message": "Reintentar el envío del mensaje",
			"send": "Enviar",
			"send_message": "Enviar mensaje",
			"sending_message": "Enviando el mensaje",
			"steer_this_agent": "Redirige a este agente…",
			"subagent": "Subagente{{detail}}",
			"summoning": "invocando…",
			"waiting_on_approval": "Esperando aprobación:",
			"working": "Trabajando"
		} },
		manifest: {
			"configuration_1": "Activa la app, abre Agent Worlds, elige una escena y, si quieres, sepárala en otra ventana; no se requieren credenciales ni servicios externos.",
			"description": "Convierte tus agentes en ejecución en personajes de una escena animada de pixel art, así un vistazo te dice qué tan ocupado está Kiro Crew. Cada agente activo aparece como un sprite que reacciona cuando el trabajo empieza y termina, en escenas temáticas que van de una oficina clásica a una torre del mago o un laboratorio submarino. Ábrelo en su propia ventana para mantenerlo en una segunda pantalla mientras trabajas.",
			"display_name": "Agent Worlds",
			"highlight_1": "Vista en vivo de qué agentes están en ejecución, como personajes en lugar de una lista",
			"highlight_2": "Escenas temáticas como Oficina, Guarida de pandas, Red neuronal, Torre del mago y Laboratorio submarino",
			"highlight_3": "Ábrela en una ventana aparte para un segundo monitor; la escena elegida se mantiene sincronizada",
			"highlight_4": "Recuerda la escena que elegiste entre visitas",
			"highlight_5": "Haz clic en un personaje para leer sus últimos mensajes, responderle o reorientarlo, y aprobar o denegar la herramienta que está esperando",
			"page_label": "Worlds",
			"use_case_1": "Mantén a la vista en una segunda pantalla los agentes activos, las tareas cron y los subagentes mientras trabaja el equipo."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Entrega sin confirmar: tu texto ha vuelto al cuadro de redacción; revisa la conversación antes de enviarlo de nuevo.",
				"send_failed_with_error": "Error al enviar: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Fantasmas de Kiro con sombreros, gafas y capas",
					"ghost_label": "Ronda de Kiro",
					"mission_desc": "Centro de operaciones de la NASA",
					"mission_label": "Mission Control",
					"neural_desc": "Mapa de constelaciones",
					"neural_label": "Red neuronal",
					"office_desc": "Oficina clásica en píxeles",
					"office_label": "Oficina",
					"panda_desc": "Espacio de trabajo en un bosque de bambú, todo pandas",
					"panda_label": "Guarida de pandas",
					"serengeti_desc": "Sabana del Serengueti con jirafas, facóqueros y elefantes",
					"serengeti_label": "Abrevadero",
					"underwater_desc": "Estación submarina",
					"underwater_label": "Laboratorio de las profundidades",
					"wizard_desc": "Laboratorio de alquimia",
					"wizard_label": "Torre del mago"
				},
				"ghostScene": {
					"friendly_hauntings_only": "solo apariciones amistosas",
					"kiro_ghost_haunt_animation": "Animación del fantasma de Kiro rondando",
					"kiro_ghost_haunt_text_overlay": "Superposición de texto del fantasma de Kiro",
					"kiro_haunt": "Ronda de Kiro"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Nv.{{level}} {{title}}",
					"mission_control_scene": "Escena de control de misión"
				} },
				"neuralConstellationScene": {
					"active": "activo",
					"idle": "inactivo",
					"neural_constellation_animation": "Animación de la constelación neuronal",
					"neural_constellation_text_overlay": "Superposición de texto de la constelación neuronal",
					"neural_network": "Red neuronal"
				},
				"officeScene": {
					"active": "Activo",
					"agent_office": "Oficina de agentes",
					"done": "Hecho",
					"headquarters": "cuartel general",
					"no_tasks": "Sin tareas",
					"office_scene": "Escena de oficina",
					"office_scene_labels": "Etiquetas de la escena de oficina",
					"to_do": "Por hacer"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Guarida de pandas",
					"panda_office_scene": "Escena de la oficina de pandas",
					"panda_office_scene_labels": "Etiquetas de la escena de la oficina de pandas"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Laboratorio de las profundidades",
					"research_station": "estación de investigación",
					"underwater_lab_scene": "Escena del laboratorio submarino",
					"underwater_lab_scene_labels": "Etiquetas de la escena del laboratorio submarino"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} en la sabana",
					"watering_hole": "Abrevadero",
					"watering_hole_scene": "Escena del abrevadero",
					"watering_hole_scene_labels": "Etiquetas de la escena del abrevadero"
				},
				"wizardTowerScene": {
					"arcane_academy": "Academia arcana",
					"casting": "conjurando",
					"empty": "vacío",
					"i_see": "¡Ya veo!",
					"resting": "descansando",
					"wizard_tower_scene": "Escena de la torre del mago",
					"wizard_tower_spell_text": "Texto del hechizo de la torre del mago"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_many": "{{n}} en activo",
				"agents_active_one": "{{n}} en activo",
				"agents_active_other": "{{n}} en activo",
				"agents_present_many": "{{n}} agentes en la sala",
				"agents_present_one": "{{n}} agente en la sala",
				"agents_present_other": "{{n}} agentes en la sala",
				"focus_popout": "Enfocar la ventana emergente",
				"hide_controls": "Ocultar los controles",
				"playing_in_popout_window": "Reproduciéndose en la ventana emergente",
				"pop_out_to_separate_window": "Abrir en una ventana aparte",
				"scene_button": "Escena {{label}}: {{desc}}",
				"scene_label": "Escena",
				"show_controls": "Mostrar los controles",
				"slots_open_many": "{{n}} slots libres",
				"slots_open_one": "{{n}} slot libre",
				"slots_open_other": "{{n}} slots libres",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Ocultar los controles",
				"scene_label": "Escena",
				"show_controls": "Mostrar los controles"
			}
		}
	},
	fr: {
		app: { "needs_newer_host": "Agent Worlds ne peut pas accéder à tes sessions dans cette version de Kiro Crew. Mets Kiro Crew à jour pour voir tes agents ici." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Tous les emplacements sont occupés",
			"approve": "Approuver",
			"click_for_thread": "cliquez pour le fil",
			"close_thread_view": "Fermer la vue du fil",
			"couldn_t_load_messages": "Impossible de charger les messages",
			"create_a_new_chat_session_a_new_agent_joins_this": "Créer une nouvelle session de chat: un nouvel agent rejoint ce monde",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · en cours",
			"deny": "Refuser",
			"idle": "Inactif",
			"kiro_is_working": "kiro travaille…",
			"loading_thread": "Chargement du fil…",
			"message": "Message {{name}}",
			"message_sent": "Message envoyé",
			"message_this_agent": "Écrire à cet agent…",
			"needs_approval": "nécessite une approbation :",
			"new_session": "+ Nouvelle session",
			"no_messages_yet": "Aucun message pour l'instant",
			"open_chat": "Ouvrir le chat",
			"recent_messages_for": "Messages récents pour {{name}}",
			"retry": "Réessayer",
			"retry_sending_message": "Réessayer l’envoi du message",
			"send": "Envoyer",
			"send_message": "Envoyer le message",
			"sending_message": "Envoi du message",
			"steer_this_agent": "Réorienter cet agent…",
			"subagent": "Sous-agent{{detail}}",
			"summoning": "invocation…",
			"waiting_on_approval": "En attente d'approbation :",
			"working": "En cours"
		} },
		manifest: {
			"configuration_1": "Active l'app, ouvre Agent Worlds, choisis une scène et détache-la éventuellement dans une fenêtre séparée ; aucun identifiant ni service externe n'est requis.",
			"description": "Transforme tes agents en cours d’exécution en personnages d’une scène animée en pixel art : un coup d’œil suffit pour savoir à quel point Kiro Crew est occupé. Chaque agent actif apparaît sous forme de sprite qui réagit quand une tâche démarre et quand elle se termine, dans des scènes thématiques allant du bureau classique à la tour du magicien ou au laboratoire sous-marin. Détache la scène dans sa propre fenêtre pour la garder sur un second écran pendant que tu travailles.",
			"display_name": "Agent Worlds",
			"highlight_1": "Vue en direct des agents en cours d’exécution, sous forme de personnages plutôt que de liste",
			"highlight_2": "Scènes thématiques, dont Bureau, Repaire des pandas, Réseau neuronal, Tour du magicien et Labo des profondeurs",
			"highlight_3": "Détache la scène dans une fenêtre séparée pour un second écran ; le choix de scène reste synchronisé",
			"highlight_4": "Retient la scène que tu as choisie d’une visite à l’autre",
			"highlight_5": "Clique sur un personnage pour lire ses derniers messages, lui répondre ou le réorienter, et approuver ou refuser l’outil qu’il attend",
			"page_label": "Mondes",
			"use_case_1": "Garde sous les yeux, sur un second écran, les agents actifs, les tâches cron et les sous-agents pendant que l'équipe travaille."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Envoi non confirmé: votre texte est de retour dans le champ de saisie ; vérifiez la conversation avant de renvoyer.",
				"send_failed_with_error": "Échec de l'envoi : {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Fantômes Kiro avec chapeaux, lunettes et capes",
					"ghost_label": "Repaire hanté de Kiro",
					"mission_desc": "Centre des opérations de la NASA",
					"mission_label": "Mission Control",
					"neural_desc": "Carte des constellations",
					"neural_label": "Réseau neuronal",
					"office_desc": "Bureau classique en pixel art",
					"office_label": "Bureau",
					"panda_desc": "Espace de travail dans une forêt de bambous, rien que des pandas",
					"panda_label": "Repaire des pandas",
					"serengeti_desc": "Savane du Serengeti avec girafes, phacochères et éléphants",
					"serengeti_label": "Point d’eau",
					"underwater_desc": "Station sous-marine",
					"underwater_label": "Laboratoire abyssal",
					"wizard_desc": "Laboratoire d’alchimie",
					"wizard_label": "Tour du sorcier"
				},
				"ghostScene": {
					"friendly_hauntings_only": "hantises amicales uniquement",
					"kiro_ghost_haunt_animation": "Animation du fantôme Kiro",
					"kiro_ghost_haunt_text_overlay": "Superposition de texte du fantôme Kiro",
					"kiro_haunt": "Repaire hanté de Kiro"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Niv.{{level}} {{title}}",
					"mission_control_scene": "Scène du centre de contrôle"
				} },
				"neuralConstellationScene": {
					"active": "actif",
					"idle": "inactif",
					"neural_constellation_animation": "Animation de constellation neuronale",
					"neural_constellation_text_overlay": "Superposition de texte de la constellation neuronale",
					"neural_network": "Réseau neuronal"
				},
				"officeScene": {
					"active": "Actif",
					"agent_office": "Bureau des agents",
					"done": "Terminé",
					"headquarters": "quartier général",
					"no_tasks": "Aucune tâche",
					"office_scene": "Scène de bureau",
					"office_scene_labels": "Étiquettes de la scène de bureau",
					"to_do": "À faire"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Repaire des pandas",
					"panda_office_scene": "Scène du bureau des pandas",
					"panda_office_scene_labels": "Étiquettes de la scène du bureau des pandas"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Laboratoire abyssal",
					"research_station": "station de recherche",
					"underwater_lab_scene": "Scène du laboratoire sous-marin",
					"underwater_lab_scene_labels": "Étiquettes de la scène du laboratoire sous-marin"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} dans la savane",
					"watering_hole": "Point d’eau",
					"watering_hole_scene": "Scène du point d’eau",
					"watering_hole_scene_labels": "Étiquettes de la scène du point d’eau"
				},
				"wizardTowerScene": {
					"arcane_academy": "Académie des arcanes",
					"casting": "incantation",
					"empty": "vide",
					"i_see": "Je vois !",
					"resting": "au repos",
					"wizard_tower_scene": "Scène de la tour du magicien",
					"wizard_tower_spell_text": "Texte de sort de la tour du magicien"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_many": "{{n}} actifs",
				"agents_active_one": "{{n}} actif",
				"agents_active_other": "{{n}} actifs",
				"agents_present_many": "{{n}} agents présents",
				"agents_present_one": "{{n}} agent présent",
				"agents_present_other": "{{n}} agents présents",
				"focus_popout": "Afficher la fenêtre détachée",
				"hide_controls": "Masquer les commandes",
				"playing_in_popout_window": "Lecture dans la fenêtre détachée",
				"pop_out_to_separate_window": "Détacher dans une fenêtre séparée",
				"scene_button": "Scène {{label}} : {{desc}}",
				"scene_label": "Scène",
				"show_controls": "Afficher les commandes",
				"slots_open_many": "{{n}} emplacements libres",
				"slots_open_one": "{{n}} emplacement libre",
				"slots_open_other": "{{n}} emplacements libres",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Masquer les commandes",
				"scene_label": "Scène",
				"show_controls": "Afficher les commandes"
			}
		}
	},
	hi: {
		app: { "needs_newer_host": "Kiro Crew के इस संस्करण में Agent Worlds तुम्हारे सेशन तक नहीं पहुँच पा रहा। अपने एजेंट यहाँ देखने के लिए Kiro Crew अपडेट करो।" },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "सभी स्लॉट भरे हुए हैं",
			"approve": "स्वीकृत करें",
			"click_for_thread": "थ्रेड के लिए क्लिक करें",
			"close_thread_view": "थ्रेड दृश्य बंद करें",
			"couldn_t_load_messages": "संदेश लोड नहीं हो सके",
			"create_a_new_chat_session_a_new_agent_joins_this": "नया चैट सेशन बनाएँ: इस दुनिया में एक नया एजेंट शामिल होता है",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · चल रहा है",
			"deny": "अस्वीकार करें",
			"idle": "निष्क्रिय",
			"kiro_is_working": "kiro काम कर रहा है…",
			"loading_thread": "थ्रेड लोड हो रहा है…",
			"message": "{{name}} को संदेश भेजें",
			"message_sent": "संदेश भेजा गया",
			"message_this_agent": "इस एजेंट को संदेश भेजें…",
			"needs_approval": "स्वीकृति चाहिए:",
			"new_session": "+ नया सेशन",
			"no_messages_yet": "अभी कोई संदेश नहीं",
			"open_chat": "चैट खोलें",
			"recent_messages_for": "{{name}} के हाल के संदेश",
			"retry": "फिर कोशिश करें",
			"retry_sending_message": "संदेश फिर भेजने की कोशिश करें",
			"send": "भेजें",
			"send_message": "संदेश भेजें",
			"sending_message": "संदेश भेजा जा रहा है",
			"steer_this_agent": "इस एजेंट को दिशा दें…",
			"subagent": "सबएजेंट{{detail}}",
			"summoning": "बुलाया जा रहा है…",
			"waiting_on_approval": "स्वीकृति की प्रतीक्षा:",
			"working": "काम कर रहा है"
		} },
		manifest: {
			"configuration_1": "ऐप सक्षम करें, Agent Worlds खोलें, कोई दृश्य चुनें और चाहें तो उसे अलग विंडो में खोलें; किसी क्रेडेंशियल या बाहरी सेवा की आवश्यकता नहीं है।",
			"description": "तुम्हारे चल रहे एजेंट को एनिमेटेड पिक्सेल-आर्ट दृश्य के किरदारों में बदल देता है, ताकि एक नज़र में पता चल जाए कि Kiro Crew कितना व्यस्त है। हर सक्रिय एजेंट एक स्प्राइट के रूप में दिखता है जो काम शुरू और खत्म होने पर प्रतिक्रिया देता है, और दृश्य क्लासिक ऑफ़िस से लेकर जादूगर की मीनार या पानी के नीचे की प्रयोगशाला तक थीम पर आधारित होते हैं। इसे अपनी अलग विंडो में निकालो और काम करते वक़्त दूसरी स्क्रीन पर रखो।",
			"display_name": "Agent Worlds",
			"highlight_1": "कौन-कौन से एजेंट चल रहे हैं इसका लाइव नज़ारा, सूची की जगह किरदारों के रूप में",
			"highlight_2": "थीम वाले दृश्य जिनमें Office, Panda Den, Neural Net, Wizard Tower और Deep Lab शामिल हैं",
			"highlight_3": "दूसरे मॉनिटर के लिए अलग विंडो में निकालो; दृश्य का चुनाव सिंक में रहता है",
			"highlight_4": "तुम्हारा चुना हुआ दृश्य अगली बार के लिए याद रखता है",
			"highlight_5": "किसी किरदार पर क्लिक करके उसके ताज़ा संदेश पढ़ो, उसे जवाब दो या दिशा बदलो, और जिस टूल का वह इंतज़ार कर रहा है उसे मंज़ूर या नामंज़ूर करो",
			"page_label": "Worlds",
			"use_case_1": "Crew के काम करते समय लाइव एजेंट, cron और subagent की गतिविधि पर दूसरी स्क्रीन से एक नज़र में नज़र रखें।"
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "डिलीवरी की पुष्टि नहीं हुई: तुम्हारा टेक्स्ट इनपुट बॉक्स में वापस आ गया है; दोबारा भेजने से पहले बातचीत देखो।",
				"send_failed_with_error": "भेजना विफल: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "टोपी, चश्मा और लबादा पहने Kiro भूत",
					"ghost_label": "Kiro भूत-अड्डा",
					"mission_desc": "NASA संचालन केंद्र",
					"mission_label": "Mission Control",
					"neural_desc": "तारामंडल का नक्शा",
					"neural_label": "न्यूरल नेटवर्क",
					"office_desc": "क्लासिक पिक्सेल ऑफ़िस",
					"office_label": "ऑफ़िस",
					"panda_desc": "बाँस के जंगल में कार्यस्थल, सब पांडा",
					"panda_label": "पांडा अड्डा",
					"serengeti_desc": "जिराफ़, वॉर्टहॉग और हाथियों वाला सेरेनगेटी सवाना",
					"serengeti_label": "पानी का ठिकाना",
					"underwater_desc": "पानी के नीचे का स्टेशन",
					"underwater_label": "गहरे समुद्र की लैब",
					"wizard_desc": "कीमियागरी प्रयोगशाला",
					"wizard_label": "जादूगर की मीनार"
				},
				"ghostScene": {
					"friendly_hauntings_only": "केवल दोस्ताना भूत",
					"kiro_ghost_haunt_animation": "Kiro भूत एनिमेशन",
					"kiro_ghost_haunt_text_overlay": "Kiro भूत टेक्स्ट ओवरले",
					"kiro_haunt": "Kiro भूत-अड्डा"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "स्तर {{level}} {{title}}",
					"mission_control_scene": "मिशन कंट्रोल दृश्य"
				} },
				"neuralConstellationScene": {
					"active": "सक्रिय",
					"idle": "निष्क्रिय",
					"neural_constellation_animation": "न्यूरल तारामंडल एनिमेशन",
					"neural_constellation_text_overlay": "न्यूरल तारामंडल टेक्स्ट ओवरले",
					"neural_network": "न्यूरल नेटवर्क"
				},
				"officeScene": {
					"active": "सक्रिय",
					"agent_office": "एजेंट ऑफ़िस",
					"done": "पूर्ण",
					"headquarters": "मुख्यालय",
					"no_tasks": "कोई टास्क नहीं",
					"office_scene": "ऑफ़िस दृश्य",
					"office_scene_labels": "ऑफ़िस दृश्य के लेबल",
					"to_do": "बाकी"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 पांडा अड्डा",
					"panda_office_scene": "पांडा ऑफ़िस दृश्य",
					"panda_office_scene_labels": "पांडा ऑफ़िस दृश्य के लेबल"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "गहरे समुद्र की लैब",
					"research_station": "शोध केंद्र",
					"underwater_lab_scene": "अंडरवाटर लैब दृश्य",
					"underwater_lab_scene_labels": "अंडरवाटर लैब दृश्य के लेबल"
				},
				"wateringHoleScene": {
					"on_the_savanna": "सवाना में {{n}}/{{total}}",
					"watering_hole": "पानी का ठिकाना",
					"watering_hole_scene": "पानी के ठिकाने का दृश्य",
					"watering_hole_scene_labels": "पानी के ठिकाने के दृश्य के लेबल"
				},
				"wizardTowerScene": {
					"arcane_academy": "जादुई अकादमी",
					"casting": "जादू कर रहा है",
					"empty": "खाली",
					"i_see": "समझ गया!",
					"resting": "आराम कर रहा है",
					"wizard_tower_scene": "जादूगर की मीनार का दृश्य",
					"wizard_tower_spell_text": "जादूगर की मीनार का मंत्र टेक्स्ट"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_one": "{{n}} सक्रिय",
				"agents_active_other": "{{n}} सक्रिय",
				"agents_present_one": "{{n}} एजेंट मौजूद",
				"agents_present_other": "{{n}} एजेंट मौजूद",
				"focus_popout": "पॉपआउट पर फ़ोकस करें",
				"hide_controls": "नियंत्रण छिपाएँ",
				"playing_in_popout_window": "पॉपआउट विंडो में चल रहा है",
				"pop_out_to_separate_window": "अलग विंडो में पॉप आउट करें",
				"scene_button": "{{label}} दृश्य: {{desc}}",
				"scene_label": "दृश्य",
				"show_controls": "नियंत्रण दिखाएँ",
				"slots_open_one": "{{n}} स्लॉट खाली",
				"slots_open_other": "{{n}} स्लॉट खाली",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "नियंत्रण छिपाएँ",
				"scene_label": "दृश्य",
				"show_controls": "नियंत्रण दिखाएँ"
			}
		}
	},
	it: {
		app: { "needs_newer_host": "Agent Worlds non riesce a raggiungere le tue sessioni in questa versione di Kiro Crew. Aggiorna Kiro Crew per vedere qui i tuoi agenti." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Tutti gli slot sono occupati",
			"approve": "Approva",
			"click_for_thread": "clicca per il thread",
			"close_thread_view": "Chiudi la vista del thread",
			"couldn_t_load_messages": "Impossibile caricare i messaggi",
			"create_a_new_chat_session_a_new_agent_joins_this": "Crea una nuova sessione di chat: un nuovo agente si unisce a questo mondo",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · in esecuzione",
			"deny": "Nega",
			"idle": "Inattivo",
			"kiro_is_working": "Kiro sta lavorando…",
			"loading_thread": "Caricamento del thread…",
			"message": "Messaggio {{name}}",
			"message_sent": "Messaggio inviato",
			"message_this_agent": "Scrivi a questo agente…",
			"needs_approval": "richiede approvazione:",
			"new_session": "+ Nuova sessione",
			"no_messages_yet": "Ancora nessun messaggio",
			"open_chat": "Apri la chat",
			"recent_messages_for": "Messaggi recenti di {{name}}",
			"retry": "Riprova",
			"retry_sending_message": "Riprova a inviare il messaggio",
			"send": "Invia",
			"send_message": "Invia il messaggio",
			"sending_message": "Invio del messaggio",
			"steer_this_agent": "Indirizza questo agente…",
			"subagent": "Subagente{{detail}}",
			"summoning": "evocazione in corso…",
			"waiting_on_approval": "In attesa di approvazione:",
			"working": "Al lavoro"
		} },
		manifest: {
			"configuration_1": "Attiva l'app, apri Agent Worlds, scegli una scena e, se vuoi, spostala in una finestra separata; non servono credenziali o servizi esterni.",
			"description": "Trasforma gli agenti in esecuzione in personaggi di una scena animata in pixel art: un’occhiata ti dice quanto è occupato Kiro Crew. Ogni agente attivo appare come uno sprite che reagisce quando il lavoro inizia e finisce, in scene a tema che vanno da un ufficio classico a una torre da mago o a un laboratorio sottomarino. Aprila in una finestra separata per tenerla su un secondo schermo mentre lavori.",
			"display_name": "Agent Worlds",
			"highlight_1": "Vista in tempo reale di quali agenti sono in esecuzione, come personaggi anziché come elenco",
			"highlight_2": "Scene a tema tra cui Office, Panda Den, Neural Net, Wizard Tower e Deep Lab",
			"highlight_3": "Aprila in una finestra separata per un secondo monitor; la scena scelta resta sincronizzata",
			"highlight_4": "Ricorda la scena scelta tra una visita e l’altra",
			"highlight_5": "Fai clic su un personaggio per leggerne gli ultimi messaggi, rispondergli o reindirizzarlo, e approvare o negare lo strumento che sta aspettando",
			"page_label": "Worlds",
			"use_case_1": "Tieni sotto controllo su un secondo schermo agenti attivi, attività cron e subagenti mentre la squadra lavora."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Consegna non confermata: il testo è tornato nel campo di scrittura; controlla la conversazione prima di inviarlo di nuovo.",
				"send_failed_with_error": "Invio non riuscito: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Fantasmi Kiro con cappelli, occhiali e mantelli",
					"ghost_label": "Dimora di Kiro",
					"mission_desc": "Centro operativo della NASA",
					"mission_label": "Mission Control",
					"neural_desc": "Mappa delle costellazioni",
					"neural_label": "Rete neurale",
					"office_desc": "Classico ufficio in pixel art",
					"office_label": "Ufficio",
					"panda_desc": "Spazio di lavoro in una foresta di bambù, solo panda",
					"panda_label": "Covo dei panda",
					"serengeti_desc": "Savana del Serengeti con giraffe, facoceri ed elefanti",
					"serengeti_label": "Pozza d'acqua",
					"underwater_desc": "Stazione sottomarina",
					"underwater_label": "Laboratorio degli abissi",
					"wizard_desc": "Laboratorio di alchimia",
					"wizard_label": "Torre del mago"
				},
				"ghostScene": {
					"friendly_hauntings_only": "solo apparizioni amichevoli",
					"kiro_ghost_haunt_animation": "Animazione del fantasma Kiro",
					"kiro_ghost_haunt_text_overlay": "Sovrapposizione di testo del fantasma Kiro",
					"kiro_haunt": "Dimora di Kiro"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Liv.{{level}} {{title}}",
					"mission_control_scene": "Scena del centro di controllo"
				} },
				"neuralConstellationScene": {
					"active": "attivo",
					"idle": "inattivo",
					"neural_constellation_animation": "Animazione della costellazione neurale",
					"neural_constellation_text_overlay": "Sovrapposizione di testo della costellazione neurale",
					"neural_network": "Rete neurale"
				},
				"officeScene": {
					"active": "Attivo",
					"agent_office": "Ufficio degli agenti",
					"done": "Fatto",
					"headquarters": "quartier generale",
					"no_tasks": "Nessuna attività",
					"office_scene": "Scena dell'ufficio",
					"office_scene_labels": "Etichette della scena dell'ufficio",
					"to_do": "Da fare"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Covo dei panda",
					"panda_office_scene": "Scena dell'ufficio dei panda",
					"panda_office_scene_labels": "Etichette della scena dell'ufficio dei panda"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Laboratorio degli abissi",
					"research_station": "stazione di ricerca",
					"underwater_lab_scene": "Scena del laboratorio subacqueo",
					"underwater_lab_scene_labels": "Etichette della scena del laboratorio subacqueo"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} nella savana",
					"watering_hole": "Pozza d'acqua",
					"watering_hole_scene": "Scena della pozza d'acqua",
					"watering_hole_scene_labels": "Etichette della scena della pozza d'acqua"
				},
				"wizardTowerScene": {
					"arcane_academy": "Accademia arcana",
					"casting": "lancio incantesimo",
					"empty": "vuoto",
					"i_see": "Capisco!",
					"resting": "a riposo",
					"wizard_tower_scene": "Scena della torre del mago",
					"wizard_tower_spell_text": "Testo dell'incantesimo della torre del mago"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_many": "{{n}} attivi",
				"agents_active_one": "{{n}} attivo",
				"agents_active_other": "{{n}} attivi",
				"agents_present_many": "{{n}} agenti presenti",
				"agents_present_one": "{{n}} agente presente",
				"agents_present_other": "{{n}} agenti presenti",
				"focus_popout": "Metti a fuoco la finestra separata",
				"hide_controls": "Nascondi i controlli",
				"playing_in_popout_window": "In riproduzione nella finestra separata",
				"pop_out_to_separate_window": "Apri in una finestra separata",
				"scene_button": "Scena {{label}}: {{desc}}",
				"scene_label": "Scena",
				"show_controls": "Mostra i controlli",
				"slots_open_many": "{{n}} slot liberi",
				"slots_open_one": "{{n}} slot libero",
				"slots_open_other": "{{n}} slot liberi",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Nascondi i controlli",
				"scene_label": "Scena",
				"show_controls": "Mostra i controlli"
			}
		}
	},
	ja: {
		app: { "needs_newer_host": "このバージョンの Kiro Crew では Agent Worlds がセッションにアクセスできません。ここにエージェントを表示するには Kiro Crew を更新してください。" },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "すべてのスロットが使用中です",
			"approve": "承認",
			"click_for_thread": "スレッドをクリック",
			"close_thread_view": "スレッドビューを閉じる",
			"couldn_t_load_messages": "メッセージを読み込めませんでした",
			"create_a_new_chat_session_a_new_agent_joins_this": "新しいチャットセッションを作成：新しいエージェントがこの世界に参加します",
			"cron": "定期実行{{detail}}",
			"cron_running": "Cron · 実行中",
			"deny": "却下",
			"idle": "アイドル",
			"kiro_is_working": "kiro が作業中…",
			"loading_thread": "スレッドを読み込み中…",
			"message": "{{name}} にメッセージ",
			"message_sent": "メッセージが送信されました",
			"message_this_agent": "このエージェントにメッセージを送信…",
			"needs_approval": "承認が必要です：",
			"new_session": "+ 新しいセッション",
			"no_messages_yet": "まだメッセージがありません",
			"open_chat": "チャットを開く",
			"recent_messages_for": "{{name}} の最近のメッセージ",
			"retry": "再試行",
			"retry_sending_message": "メッセージ送信を再試行",
			"send": "送信",
			"send_message": "メッセージを送信",
			"sending_message": "メッセージを送信中",
			"steer_this_agent": "このエージェントを操作…",
			"subagent": "サブエージェント{{detail}}",
			"summoning": "召喚中…",
			"waiting_on_approval": "承認待ち中：",
			"working": "作業中"
		} },
		manifest: {
			"configuration_1": "アプリを有効にして Agent Worlds を開き、シーンを選択します。必要なら別ウィンドウにポップアウトできます。認証情報や外部サービスは不要です。",
			"description": "実行中のエージェントをアニメーション化されたピクセルアートシーンの文字に変えます。そのため、ひと目で Kiro Crew がどのくらい忙しいかがわかります。各アクティブなエージェントはスプライトとして表示され、仕事が開始および完了するときに反応します。クラシックなオフィスからウィザードタワーまたは水中ラボへのテーマシーンをまたいでいます。別のウィンドウにポップアウトして、作業中に2番目の画面に保つことができます。",
			"display_name": "Agent Worlds",
			"highlight_1": "実行中のエージェントをリストではなく文字として表示するライブビュー",
			"highlight_2": "オフィス、パンダの巣穴、ニューラルネット、ウィザードタワー、ディープラボを含むテーマシーン",
			"highlight_3": "別のウィンドウにポップアウトします。シーンの選択は同期したまま",
			"highlight_4": "訪問のたびに選択したシーンを記憶します",
			"highlight_5": "キャラクターをクリックすると、最新のメッセージを読み、返信や方向修正をし、待機中のツールを承認または拒否できます",
			"page_label": "ワールド",
			"use_case_1": "クルーの作業中、実行中のエージェント、cron、サブエージェントをセカンドスクリーンで一覧できます。"
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "送信が確認できません：入力欄にテキストを戻しました。再送信する前に会話履歴を確認してください。",
				"send_failed_with_error": "送信に失敗しました: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "帽子、メガネ、マントを身につけた Kiro のゴーストたち",
					"ghost_label": "Kiro ゴースト",
					"mission_desc": "NASA の運用センター",
					"mission_label": "Mission Control",
					"neural_desc": "星座マップ",
					"neural_label": "ニューラルネットワーク",
					"office_desc": "クラシックなピクセルオフィス",
					"office_label": "オフィス",
					"panda_desc": "竹林のワークスペース、全員パンダ",
					"panda_label": "パンダのすみか",
					"serengeti_desc": "キリン、イボイノシシ、ゾウがいるセレンゲティのサバンナ",
					"serengeti_label": "水飲み場",
					"underwater_desc": "海中ステーション",
					"underwater_label": "深海ラボ",
					"wizard_desc": "錬金術の実験室",
					"wizard_label": "魔法使いの塔"
				},
				"ghostScene": {
					"friendly_hauntings_only": "友好的な幽霊だけ",
					"kiro_ghost_haunt_animation": "Kiro ゴーストの出没アニメーション",
					"kiro_ghost_haunt_text_overlay": "Kiro ゴーストの出没テキストオーバーレイ",
					"kiro_haunt": "Kiro ゴースト"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Lv.{{level}} {{title}}",
					"mission_control_scene": "ミッションコントロールのシーン"
				} },
				"neuralConstellationScene": {
					"active": "アクティブ",
					"idle": "アイドル",
					"neural_constellation_animation": "ニューラル星座のアニメーション",
					"neural_constellation_text_overlay": "ニューラル星座のテキストオーバーレイ",
					"neural_network": "ニューラルネットワーク"
				},
				"officeScene": {
					"active": "アクティブ",
					"agent_office": "エージェントオフィス",
					"done": "完了",
					"headquarters": "本部",
					"no_tasks": "タスクなし",
					"office_scene": "オフィスのシーン",
					"office_scene_labels": "オフィスシーンのラベル",
					"to_do": "未着手"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 パンダのすみか",
					"panda_office_scene": "パンダオフィスのシーン",
					"panda_office_scene_labels": "パンダオフィスシーンのラベル"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "深海ラボ",
					"research_station": "研究ステーション",
					"underwater_lab_scene": "海中ラボのシーン",
					"underwater_lab_scene_labels": "海中ラボシーンのラベル"
				},
				"wateringHoleScene": {
					"on_the_savanna": "サバンナに {{n}}/{{total}}",
					"watering_hole": "水飲み場",
					"watering_hole_scene": "水飲み場のシーン",
					"watering_hole_scene_labels": "水飲み場シーンのラベル"
				},
				"wizardTowerScene": {
					"arcane_academy": "魔法学院",
					"casting": "詠唱中",
					"empty": "空き",
					"i_see": "なるほど！",
					"resting": "休憩中",
					"wizard_tower_scene": "魔法使いの塔のシーン",
					"wizard_tower_spell_text": "魔法使いの塔の呪文テキスト"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_other": "{{n}} 件アクティブ",
				"agents_present_other": "{{n}} エージェント在席",
				"focus_popout": "ポップアウトをフォーカス",
				"hide_controls": "コントロールを隠す",
				"playing_in_popout_window": "ポップアウトウィンドウで再生中",
				"pop_out_to_separate_window": "別ウィンドウにポップアウト",
				"scene_button": "{{label}} シーン：{{desc}}",
				"scene_label": "シーン",
				"show_controls": "コントロールを表示",
				"slots_open_other": "空きスロット {{n}} 個",
				"summary": "{{present}}、{{active}}、{{open}}"
			},
			"worldsPopout": {
				"hide_controls": "コントロールを隠す",
				"scene_label": "シーン",
				"show_controls": "コントロールを表示"
			}
		}
	},
	ko: {
		app: { "needs_newer_host": "이 버전의 Kiro Crew에서는 Agent Worlds가 세션에 접근할 수 없습니다. 여기에서 에이전트를 보려면 Kiro Crew를 업데이트하세요." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "모든 슬롯이 사용 중입니다",
			"approve": "승인",
			"click_for_thread": "클릭하면 스레드 표시",
			"close_thread_view": "스레드 보기 닫기",
			"couldn_t_load_messages": "메시지를 불러오지 못했습니다",
			"create_a_new_chat_session_a_new_agent_joins_this": "새 채팅 세션 만들기: 새 에이전트가 이 세계에 참여합니다",
			"cron": "정기 실행{{detail}}",
			"cron_running": "정기 실행 · 실행 중",
			"deny": "거부",
			"idle": "유휴",
			"kiro_is_working": "kiro가 작업 중…",
			"loading_thread": "스레드 불러오는 중…",
			"message": "{{name}}에게 메시지",
			"message_sent": "메시지를 보냈습니다",
			"message_this_agent": "이 에이전트에게 메시지…",
			"needs_approval": "승인 필요:",
			"new_session": "+ 새 세션",
			"no_messages_yet": "아직 메시지가 없습니다",
			"open_chat": "채팅 열기",
			"recent_messages_for": "{{name}}의 최근 메시지",
			"retry": "다시 시도",
			"retry_sending_message": "메시지 보내기 다시 시도",
			"send": "보내기",
			"send_message": "메시지 보내기",
			"sending_message": "메시지 보내는 중",
			"steer_this_agent": "이 에이전트에 지시…",
			"subagent": "서브에이전트{{detail}}",
			"summoning": "소환 중…",
			"waiting_on_approval": "승인 대기 중:",
			"working": "작업 중"
		} },
		manifest: {
			"configuration_1": "앱을 활성화하고 Agent Worlds를 연 다음 장면을 선택하세요. 필요하면 별도 창으로 띄울 수 있습니다. 자격 증명이나 외부 서비스는 필요하지 않습니다.",
			"description": "실행 중인 에이전트를 애니메이션 픽셀 아트 장면 속 캐릭터로 바꿔, 한눈에 Kiro Crew가 얼마나 바쁜지 알 수 있게 합니다. 활성 에이전트마다 스프라이트로 나타나 작업이 시작되고 끝날 때 반응하며, 고전적인 사무실부터 마법사 탑이나 심해 연구소까지 테마 장면을 넘나듭니다. 별도 창으로 띄워 작업하는 동안 두 번째 화면에 계속 띄워 둘 수 있습니다.",
			"display_name": "Agent Worlds",
			"highlight_1": "어떤 에이전트가 실행 중인지 목록이 아닌 캐릭터로 보여 주는 실시간 뷰",
			"highlight_2": "사무실·판다 굴·뉴럴 넷·마법사 탑·심해 연구소 등 테마 장면",
			"highlight_3": "보조 모니터용으로 별도 창으로 띄우기. 장면 선택은 계속 동기화됩니다",
			"highlight_4": "다시 방문해도 선택한 장면을 기억합니다",
			"highlight_5": "캐릭터를 클릭해 최근 메시지를 읽고, 답장하거나 방향을 바꾸고, 기다리는 도구를 승인하거나 거부할 수 있습니다",
			"page_label": "월드",
			"use_case_1": "크루가 작업하는 동안 실행 중인 에이전트, cron, 서브에이전트를 세컨드 스크린에서 한눈에 확인합니다."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "전송이 확인되지 않았습니다: 입력한 텍스트를 입력창에 되돌려 두었습니다. 다시 보내기 전에 대화 기록을 확인하세요.",
				"send_failed_with_error": "전송 실패: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "모자, 안경, 망토를 걸친 Kiro 유령들",
					"ghost_label": "Kiro 유령 출몰",
					"mission_desc": "NASA 운영 센터",
					"mission_label": "Mission Control",
					"neural_desc": "별자리 지도",
					"neural_label": "뉴럴 네트워크",
					"office_desc": "클래식 픽셀 오피스",
					"office_label": "오피스",
					"panda_desc": "대나무 숲 작업 공간, 모두 판다",
					"panda_label": "판다 소굴",
					"serengeti_desc": "기린, 혹멧돼지, 코끼리가 있는 세렝게티 사바나",
					"serengeti_label": "물웅덩이",
					"underwater_desc": "수중 기지",
					"underwater_label": "심해 연구소",
					"wizard_desc": "연금술 실험실",
					"wizard_label": "마법사의 탑"
				},
				"ghostScene": {
					"friendly_hauntings_only": "친절한 유령만",
					"kiro_ghost_haunt_animation": "Kiro 유령 출몰 애니메이션",
					"kiro_ghost_haunt_text_overlay": "Kiro 유령 출몰 텍스트 오버레이",
					"kiro_haunt": "Kiro 유령 출몰"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Lv.{{level}} {{title}}",
					"mission_control_scene": "미션 컨트롤 장면"
				} },
				"neuralConstellationScene": {
					"active": "활성",
					"idle": "대기",
					"neural_constellation_animation": "뉴럴 별자리 애니메이션",
					"neural_constellation_text_overlay": "뉴럴 별자리 텍스트 오버레이",
					"neural_network": "뉴럴 네트워크"
				},
				"officeScene": {
					"active": "활성",
					"agent_office": "에이전트 오피스",
					"done": "완료",
					"headquarters": "본부",
					"no_tasks": "태스크 없음",
					"office_scene": "오피스 장면",
					"office_scene_labels": "오피스 장면 레이블",
					"to_do": "할 일"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 판다 소굴",
					"panda_office_scene": "판다 오피스 장면",
					"panda_office_scene_labels": "판다 오피스 장면 레이블"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "심해 연구소",
					"research_station": "연구 기지",
					"underwater_lab_scene": "수중 연구소 장면",
					"underwater_lab_scene_labels": "수중 연구소 장면 레이블"
				},
				"wateringHoleScene": {
					"on_the_savanna": "사바나에 {{n}}/{{total}}",
					"watering_hole": "물웅덩이",
					"watering_hole_scene": "물웅덩이 장면",
					"watering_hole_scene_labels": "물웅덩이 장면 레이블"
				},
				"wizardTowerScene": {
					"arcane_academy": "비전 학원",
					"casting": "시전 중",
					"empty": "비어 있음",
					"i_see": "그렇군요!",
					"resting": "휴식 중",
					"wizard_tower_scene": "마법사 탑 장면",
					"wizard_tower_spell_text": "마법사 탑 주문 텍스트"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_other": "{{n}}개 활동 중",
				"agents_present_other": "에이전트 {{n}}개 참석",
				"focus_popout": "팝아웃 포커스",
				"hide_controls": "컨트롤 숨기기",
				"playing_in_popout_window": "팝아웃 창에서 재생 중",
				"pop_out_to_separate_window": "별도 창으로 팝아웃",
				"scene_button": "{{label}} 장면: {{desc}}",
				"scene_label": "장면",
				"show_controls": "컨트롤 표시",
				"slots_open_other": "빈 슬롯 {{n}}개",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "컨트롤 숨기기",
				"scene_label": "장면",
				"show_controls": "컨트롤 표시"
			}
		}
	},
	pt: {
		app: { "needs_newer_host": "O Agent Worlds não consegue acessar suas sessões nesta versão do Kiro Crew. Atualize o Kiro Crew para ver seus agentes aqui." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Todos os slots estão ocupados",
			"approve": "Aprovar",
			"click_for_thread": "clique para ver a thread",
			"close_thread_view": "Fechar visualização da thread",
			"couldn_t_load_messages": "Não foi possível carregar as mensagens",
			"create_a_new_chat_session_a_new_agent_joins_this": "Criar uma nova sessão de chat: um novo agente entra neste mundo",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · em execução",
			"deny": "Recusar",
			"idle": "Inativo",
			"kiro_is_working": "kiro está trabalhando…",
			"loading_thread": "Carregando thread…",
			"message": "Mensagem {{name}}",
			"message_sent": "Mensagem enviada",
			"message_this_agent": "Envie uma mensagem para este agente…",
			"needs_approval": "precisa de aprovação:",
			"new_session": "+ Nova sessão",
			"no_messages_yet": "Nenhuma mensagem ainda",
			"open_chat": "Abrir chat",
			"recent_messages_for": "Mensagens recentes de {{name}}",
			"retry": "Tentar novamente",
			"retry_sending_message": "Tentar enviar a mensagem novamente",
			"send": "Enviar",
			"send_message": "Enviar mensagem",
			"sending_message": "Enviando mensagem",
			"steer_this_agent": "Direcione este agente…",
			"subagent": "Subagente{{detail}}",
			"summoning": "invocando…",
			"waiting_on_approval": "Aguardando aprovação:",
			"working": "Trabalhando"
		} },
		manifest: {
			"configuration_1": "Ative o app, abra o Agent Worlds, escolha uma cena e, se quiser, abra-a em uma janela separada; não são necessárias credenciais nem serviços externos.",
			"description": "Transforma seus agentes em execução em personagens de uma cena animada em pixel art, para você saber num relance o quanto o Kiro Crew está ocupado. Cada agente ativo aparece como um sprite que reage conforme o trabalho começa e termina, em cenas temáticas que vão de um escritório clássico a uma torre de mago ou um laboratório submarino. Abra em uma janela separada para deixá-la em uma segunda tela enquanto você trabalha.",
			"display_name": "Agent Worlds",
			"highlight_1": "Visão ao vivo de quais agentes estão em execução, como personagens em vez de uma lista",
			"highlight_2": "Cenas temáticas, incluindo Office, Panda Den, Neural Net, Wizard Tower e Deep Lab",
			"highlight_3": "Abra em uma janela separada para um segundo monitor; a escolha da cena continua sincronizada",
			"highlight_4": "Lembra a cena que você escolheu entre visitas",
			"highlight_5": "Clique em um personagem para ler as mensagens mais recentes, responder ou redirecionar, e aprovar ou negar a ferramenta que ele está aguardando",
			"page_label": "Mundos",
			"use_case_1": "Mantenha em uma segunda tela uma visão rápida dos agentes ativos, tarefas cron e subagentes enquanto a equipe trabalha."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Entrega não confirmada: seu texto voltou para a caixa de composição; verifique a conversa antes de enviar novamente.",
				"send_failed_with_error": "Falha ao enviar: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Fantasmas Kiro de chapéu, óculos e capa",
					"ghost_label": "Assombração Kiro",
					"mission_desc": "Centro de operações da NASA",
					"mission_label": "Mission Control",
					"neural_desc": "Mapa de constelações",
					"neural_label": "Rede Neural",
					"office_desc": "Escritório clássico em pixel art",
					"office_label": "Escritório",
					"panda_desc": "Espaço de trabalho em uma floresta de bambu, só pandas",
					"panda_label": "Covil dos Pandas",
					"serengeti_desc": "Savana do Serengeti com girafas, javalis-africanos e elefantes",
					"serengeti_label": "Bebedouro",
					"underwater_desc": "Estação subaquática",
					"underwater_label": "Laboratório das Profundezas",
					"wizard_desc": "Laboratório de alquimia",
					"wizard_label": "Torre do Mago"
				},
				"ghostScene": {
					"friendly_hauntings_only": "só assombrações amigáveis",
					"kiro_ghost_haunt_animation": "Animação da assombração do fantasma Kiro",
					"kiro_ghost_haunt_text_overlay": "Sobreposição de texto do fantasma Kiro",
					"kiro_haunt": "Assombração Kiro"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Nv.{{level}} {{title}}",
					"mission_control_scene": "Cena do centro de controle"
				} },
				"neuralConstellationScene": {
					"active": "ativo",
					"idle": "ocioso",
					"neural_constellation_animation": "Animação da constelação neural",
					"neural_constellation_text_overlay": "Sobreposição de texto da constelação neural",
					"neural_network": "Rede Neural"
				},
				"officeScene": {
					"active": "Ativo",
					"agent_office": "Escritório dos Agentes",
					"done": "Concluído",
					"headquarters": "sede",
					"no_tasks": "Sem tarefas",
					"office_scene": "Cena do escritório",
					"office_scene_labels": "Rótulos da cena do escritório",
					"to_do": "A Fazer"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Covil dos Pandas",
					"panda_office_scene": "Cena do escritório dos pandas",
					"panda_office_scene_labels": "Rótulos da cena do escritório dos pandas"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Laboratório das Profundezas",
					"research_station": "estação de pesquisa",
					"underwater_lab_scene": "Cena do laboratório submarino",
					"underwater_lab_scene_labels": "Rótulos da cena do laboratório submarino"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} na savana",
					"watering_hole": "Bebedouro",
					"watering_hole_scene": "Cena do bebedouro",
					"watering_hole_scene_labels": "Rótulos da cena do bebedouro"
				},
				"wizardTowerScene": {
					"arcane_academy": "Academia Arcana",
					"casting": "conjurando",
					"empty": "vazio",
					"i_see": "Entendi!",
					"resting": "descansando",
					"wizard_tower_scene": "Cena da torre do mago",
					"wizard_tower_spell_text": "Texto do feitiço da torre do mago"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_many": "{{n}} ativos",
				"agents_active_one": "{{n}} ativo",
				"agents_active_other": "{{n}} ativos",
				"agents_present_many": "{{n}} agentes presentes",
				"agents_present_one": "{{n}} agente presente",
				"agents_present_other": "{{n}} agentes presentes",
				"focus_popout": "Focar janela destacada",
				"hide_controls": "Ocultar controles",
				"playing_in_popout_window": "Reproduzindo na janela destacada",
				"pop_out_to_separate_window": "Abrir em janela separada",
				"scene_button": "Cena {{label}}: {{desc}}",
				"scene_label": "Cena",
				"show_controls": "Mostrar controles",
				"slots_open_many": "{{n}} slots livres",
				"slots_open_one": "{{n}} slot livre",
				"slots_open_other": "{{n}} slots livres",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Ocultar controles",
				"scene_label": "Cena",
				"show_controls": "Mostrar controles"
			}
		}
	},
	ru: {
		app: { "needs_newer_host": "В этой версии Kiro Crew приложение Agent Worlds не может получить доступ к твоим сессиям. Обнови Kiro Crew, чтобы видеть здесь своих агентов." },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "Все слоты заняты",
			"approve": "Разрешить",
			"click_for_thread": "нажмите, чтобы открыть ветку",
			"close_thread_view": "Закрыть просмотр ветки",
			"couldn_t_load_messages": "Не удалось загрузить сообщения",
			"create_a_new_chat_session_a_new_agent_joins_this": "Создать новый чат: в этот мир придёт новый агент",
			"cron": "Cron{{detail}}",
			"cron_running": "Cron · выполняется",
			"deny": "Запретить",
			"idle": "Простой",
			"kiro_is_working": "kiro работает…",
			"loading_thread": "Загрузка ветки…",
			"message": "Написать {{name}}",
			"message_sent": "Сообщение отправлено",
			"message_this_agent": "Написать этому агенту...",
			"needs_approval": "требуется разрешение:",
			"new_session": "+ Новый сеанс",
			"no_messages_yet": "Сообщений пока нет",
			"open_chat": "Открыть чат",
			"recent_messages_for": "Последние сообщения для {{name}}",
			"retry": "Повторить",
			"retry_sending_message": "Повторить отправку сообщения",
			"send": "Отправить",
			"send_message": "Отправить сообщение",
			"sending_message": "Отправка сообщения",
			"steer_this_agent": "Скорректировать этого агента...",
			"subagent": "Субагент{{detail}}",
			"summoning": "вызов...",
			"waiting_on_approval": "Ожидание разрешения:",
			"working": "Работает"
		} },
		manifest: {
			"configuration_1": "Включите приложение, откройте Agent Worlds, выберите сцену и при желании вынесите её в отдельное окно; учётные данные и внешние сервисы не требуются.",
			"description": "Превращает запущенных агентов в персонажей анимированной пиксельной сцены, чтобы по одному взгляду было понятно, насколько загружен Kiro Crew. Каждый активный агент показан спрайтом, который реагирует на начало и завершение работы, а сцены оформлены по-разному, от классического офиса до башни волшебника или подводной лаборатории. Открой сцену в отдельном окне, чтобы держать её на втором экране во время работы.",
			"display_name": "Agent Worlds",
			"highlight_1": "Наглядная картина работающих агентов: персонажи вместо списка",
			"highlight_2": "Оформленные сцены, среди них Office, Panda Den, Neural Net, Wizard Tower и Deep Lab",
			"highlight_3": "Открывается в отдельном окне для второго монитора; выбранная сцена остаётся синхронизированной",
			"highlight_4": "Запоминает выбранную сцену между визитами",
			"highlight_5": "Нажми на персонажа, чтобы прочитать его последние сообщения, ответить ему или скорректировать курс, а также разрешить или отклонить инструмент, которого он ждёт",
			"page_label": "Миры",
			"use_case_1": "Следите одним взглядом на втором экране за активными агентами, cron-задачами и субагентами во время работы команды."
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "Доставка не подтверждена: ваш текст возвращён в поле ввода; проверьте переписку, прежде чем отправлять снова.",
				"send_failed_with_error": "Не удалось отправить: {{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "Призраки Kiro в шляпах, очках и плащах",
					"ghost_label": "Призраки Kiro",
					"mission_desc": "Операционный центр NASA",
					"mission_label": "Mission Control",
					"neural_desc": "Карта созвездий",
					"neural_label": "Нейросеть",
					"office_desc": "Классический пиксельный офис",
					"office_label": "Офис",
					"panda_desc": "Рабочее место в бамбуковом лесу, одни панды",
					"panda_label": "Логово панды",
					"serengeti_desc": "Саванна Серенгети с жирафами, бородавочниками и слонами",
					"serengeti_label": "Водопой",
					"underwater_desc": "Подводная станция",
					"underwater_label": "Глубоководная лаборатория",
					"wizard_desc": "Алхимическая лаборатория",
					"wizard_label": "Башня волшебника"
				},
				"ghostScene": {
					"friendly_hauntings_only": "только дружелюбные призраки",
					"kiro_ghost_haunt_animation": "Анимация призрака Kiro",
					"kiro_ghost_haunt_text_overlay": "Текстовый слой анимации призрака Kiro",
					"kiro_haunt": "Призраки Kiro"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "Ур.{{level}} {{title}}",
					"mission_control_scene": "Сцена центра управления"
				} },
				"neuralConstellationScene": {
					"active": "активно",
					"idle": "простой",
					"neural_constellation_animation": "Анимация нейронного созвездия",
					"neural_constellation_text_overlay": "Текстовый слой нейронного созвездия",
					"neural_network": "Нейросеть"
				},
				"officeScene": {
					"active": "Активно",
					"agent_office": "Офис агентов",
					"done": "Готово",
					"headquarters": "штаб",
					"no_tasks": "Нет задач",
					"office_scene": "Сцена офиса",
					"office_scene_labels": "Подписи сцены офиса",
					"to_do": "К выполнению"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 Логово панды",
					"panda_office_scene": "Сцена офиса панд",
					"panda_office_scene_labels": "Подписи сцены офиса панд"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "Глубоководная лаборатория",
					"research_station": "исследовательская станция",
					"underwater_lab_scene": "Сцена подводной лаборатории",
					"underwater_lab_scene_labels": "Подписи сцены подводной лаборатории"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} в саванне",
					"watering_hole": "Водопой",
					"watering_hole_scene": "Сцена водопоя",
					"watering_hole_scene_labels": "Подписи сцены водопоя"
				},
				"wizardTowerScene": {
					"arcane_academy": "Академия магии",
					"casting": "колдует",
					"empty": "пусто",
					"i_see": "Понятно!",
					"resting": "отдыхает",
					"wizard_tower_scene": "Сцена башни волшебника",
					"wizard_tower_spell_text": "Текст заклинания в башне волшебника"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_few": "{{n}} активных",
				"agents_active_many": "{{n}} активных",
				"agents_active_one": "{{n}} активный",
				"agents_active_other": "{{n}} активного",
				"agents_present_few": "{{n}} агента на месте",
				"agents_present_many": "{{n}} агентов на месте",
				"agents_present_one": "{{n}} агент на месте",
				"agents_present_other": "{{n}} агента на месте",
				"focus_popout": "Перейти к отдельному окну",
				"hide_controls": "Скрыть управление",
				"playing_in_popout_window": "Воспроизводится в отдельном окне",
				"pop_out_to_separate_window": "Открыть в отдельном окне",
				"scene_button": "Сцена {{label}}: {{desc}}",
				"scene_label": "Сцена",
				"show_controls": "Показать управление",
				"slots_open_few": "{{n}} свободных слота",
				"slots_open_many": "{{n}} свободных слотов",
				"slots_open_one": "{{n}} свободный слот",
				"slots_open_other": "{{n}} свободного слота",
				"summary": "{{present}} · {{active}} · {{open}}"
			},
			"worldsPopout": {
				"hide_controls": "Скрыть управление",
				"scene_label": "Сцена",
				"show_controls": "Показать управление"
			}
		}
	},
	"zh-CN": {
		app: { "needs_newer_host": "在此版本的 Kiro Crew 中，Agent Worlds 无法访问你的会话。请更新 Kiro Crew，以便在这里看到你的代理。" },
		hooks: { "useSceneInteraction": {
			"all_slots_are_occupied": "所有槽位都已占用",
			"approve": "批准",
			"click_for_thread": "点击查看话题",
			"close_thread_view": "关闭话题视图",
			"couldn_t_load_messages": "无法加载消息",
			"create_a_new_chat_session_a_new_agent_joins_this": "创建新的聊天会话：会有新代理加入这个世界",
			"cron": "定时任务{{detail}}",
			"cron_running": "定时任务 · 运行中",
			"deny": "拒绝",
			"idle": "空闲",
			"kiro_is_working": "kiro 正在工作…",
			"loading_thread": "加载话题…",
			"message": "消息 {{name}}",
			"message_sent": "消息已发送",
			"message_this_agent": "给此代理发消息…",
			"needs_approval": "需要审批：",
			"new_session": "+ 新建会话",
			"no_messages_yet": "暂无消息",
			"open_chat": "打开聊天",
			"recent_messages_for": "{{name}} 的最近消息",
			"retry": "重试",
			"retry_sending_message": "重新发送消息",
			"send": "发送",
			"send_message": "发送消息",
			"sending_message": "正在发送消息",
			"steer_this_agent": "引导此代理…",
			"subagent": "子代理{{detail}}",
			"summoning": "正在召唤…",
			"waiting_on_approval": "等待审批：",
			"working": "工作中"
		} },
		manifest: {
			"configuration_1": "启用应用，打开 Agent Worlds，选择场景，并可弹出为独立窗口；无需凭据或外部服务。",
			"description": "把正在运行的代理变成动态像素画场景里的角色，一眼就能看出 Kiro Crew 有多忙。每个活跃代理都是一个精灵图，随着工作开始和结束做出反应；场景主题从经典办公室到巫师塔或水下实验室。弹出为独立窗口，就能在工作时把它放在第二块屏幕上。",
			"display_name": "Agent Worlds",
			"highlight_1": "实时查看哪些代理正在运行，以角色而非列表呈现",
			"highlight_2": "主题场景包括 Office、Panda Den、Neural Net、Wizard Tower 和 Deep Lab",
			"highlight_3": "弹出为独立窗口放到第二台显示器上；场景选择保持同步",
			"highlight_4": "记住你选择的场景，下次打开时沿用",
			"highlight_5": "点击一个角色即可阅读它的最新消息、回复或引导它，并批准或拒绝它正在等待的工具",
			"page_label": "Worlds",
			"use_case_1": "在团队工作时，通过第二块屏幕上的概览视图实时查看代理、定时任务和子代理。"
		},
		pages: {
			"chatPage": {
				"delivery_unconfirmed": "尚未确认送达：你的文字已放回输入框；再次发送前请先查看对话记录。",
				"send_failed_with_error": "发送失败：{{error}}"
			},
			"scenes": {
				"config": {
					"ghost_desc": "戴着帽子、眼镜和披风的 Kiro 幽灵",
					"ghost_label": "Kiro 出没",
					"mission_desc": "NASA 指挥中心",
					"mission_label": "Mission Control",
					"neural_desc": "星座图",
					"neural_label": "神经网络",
					"office_desc": "经典像素办公室",
					"office_label": "办公室",
					"panda_desc": "竹林工作区，全是熊猫",
					"panda_label": "熊猫窝",
					"serengeti_desc": "塞伦盖蒂草原，有长颈鹿、疣猪和大象",
					"serengeti_label": "水源地",
					"underwater_desc": "水下工作站",
					"underwater_label": "深海实验室",
					"wizard_desc": "炼金实验室",
					"wizard_label": "巫师塔"
				},
				"ghostScene": {
					"friendly_hauntings_only": "仅限友好出没",
					"kiro_ghost_haunt_animation": "Kiro 幽灵出没动画",
					"kiro_ghost_haunt_text_overlay": "Kiro 幽灵出没文字浮层",
					"kiro_haunt": "Kiro 出没"
				},
				"missionControl": { "missionControlScene": {
					"lv_level_title": "{{level}} 级 {{title}}",
					"mission_control_scene": "任务控制中心场景"
				} },
				"neuralConstellationScene": {
					"active": "活跃",
					"idle": "空闲",
					"neural_constellation_animation": "神经星座动画",
					"neural_constellation_text_overlay": "神经星座文字浮层",
					"neural_network": "神经网络"
				},
				"officeScene": {
					"active": "进行中",
					"agent_office": "代理办公室",
					"done": "已完成",
					"headquarters": "总部",
					"no_tasks": "暂无任务",
					"office_scene": "办公室场景",
					"office_scene_labels": "办公室场景标签",
					"to_do": "待办"
				},
				"pandaOfficeScene": {
					"panda_den": "🐼 熊猫窝",
					"panda_office_scene": "熊猫办公室场景",
					"panda_office_scene_labels": "熊猫办公室场景标签"
				},
				"underwaterLabScene": {
					"deep_sea_lab": "深海实验室",
					"research_station": "研究站",
					"underwater_lab_scene": "水下实验室场景",
					"underwater_lab_scene_labels": "水下实验室场景标签"
				},
				"wateringHoleScene": {
					"on_the_savanna": "{{n}}/{{total}} 只在草原上",
					"watering_hole": "水源地",
					"watering_hole_scene": "水源地场景",
					"watering_hole_scene_labels": "水源地场景标签"
				},
				"wizardTowerScene": {
					"arcane_academy": "秘法学院",
					"casting": "施法中",
					"empty": "空位",
					"i_see": "原来如此！",
					"resting": "休息中",
					"wizard_tower_scene": "巫师塔场景",
					"wizard_tower_spell_text": "巫师塔法术文字"
				}
			},
			"worldsPage": {
				"agent_worlds": "Agent Worlds",
				"agents_active_other": "{{n}} 个活动",
				"agents_present_other": "{{n}} 个代理在场",
				"focus_popout": "聚焦弹出窗口",
				"hide_controls": "隐藏控制项",
				"playing_in_popout_window": "正在弹出窗口中播放",
				"pop_out_to_separate_window": "弹出到独立窗口",
				"scene_button": "{{label}} 场景：{{desc}}",
				"scene_label": "场景",
				"show_controls": "展开控制项",
				"slots_open_other": "{{n}} 个空闲槽位",
				"summary": "{{present}}，{{active}}，{{open}}"
			},
			"worldsPopout": {
				"hide_controls": "隐藏控制项",
				"scene_label": "场景",
				"show_controls": "展开控制项"
			}
		}
	}
};
var own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function lookup(catalog, key) {
	let node = catalog;
	for (const part of key.split(".")) {
		if (node === void 0 || typeof node === "string" || !own(node, part)) return void 0;
		node = node[part];
	}
	return typeof node === "string" ? node : void 0;
}
/** The catalogs to try for `locale`, most specific first, always ending in English. */
function localeChain(locale) {
	const chain = [];
	const add = (candidate) => {
		if (own(CATALOGS, candidate) && !chain.includes(candidate)) chain.push(candidate);
	};
	add(locale);
	add(locale.split("-")[0]);
	add("en");
	return chain;
}
function currentLocale() {
	try {
		const locale = activeLocale();
		return typeof locale === "string" && locale ? locale : "en";
	} catch {
		return "en";
	}
}
var PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;
function pluralSuffix(locale, count) {
	try {
		return new Intl.PluralRules(locale).select(count);
	} catch {
		return "other";
	}
}
function fill(text, vars) {
	return text.replace(PLACEHOLDER, (whole, name) => vars && own(vars, name) ? String(vars[name]) : whole);
}
function t(key, vars) {
	const count = vars && typeof vars.count === "number" ? vars.count : void 0;
	for (const locale of localeChain(currentLocale())) {
		const catalog = CATALOGS[locale];
		if (count !== void 0) {
			const forms = [`${key}_${pluralSuffix(locale, count)}`, `${key}_other`];
			for (const form of forms) {
				const text = lookup(catalog, form);
				if (text !== void 0) return fill(text, vars);
			}
		}
		const text = lookup(catalog, key);
		if (text !== void 0) return fill(text, vars);
	}
	return key;
}
/** The name the page's components call `t` by, kept from the built-in. */
var i18nT = t;
// src/utils/safeStorage.ts
/**
* Best-effort localStorage writes.
*
* The page saves two small things: the scene the user chose and which agents
* a scene has already greeted. Neither is worth an error, so a write that throws
* (storage full, storage disabled) is dropped. The dashboard's own helper also
* frees space by deleting the dashboard's cache entries; this page owns none of
* those entries, so it never deletes them.
*/
function safeSetItem(key, value) {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}
// src/utils/codePoints.ts
var isHighSurrogate = (code) => code >= 55296 && code <= 56319;
var isLowSurrogate = (code) => code >= 56320 && code <= 57343;
/** `s.slice(start, end)` with both edges moved off a surrogate pair. A plain
*  UTF-16 slice through an astral character (an emoji) leaves a lone
*  surrogate in the text sent to the agent, which is not valid Unicode and
*  wedges the turn. Edges only ever move inward. */
function sliceCodePoints(s, start, end = s.length) {
	const from = snapOffPair(s, Math.max(0, start), 1);
	const to = snapOffPair(s, Math.min(s.length, end), -1);
	return from < to ? s.slice(from, to) : "";
}
/** Move UTF-16 index `i` off the middle of a surrogate pair: `dir` is +1 for
*  a start edge, -1 for an end edge, so the edge always moves inward. */
function snapOffPair(s, i, dir) {
	return i > 0 && i < s.length && isHighSurrogate(s.charCodeAt(i - 1)) && isLowSurrogate(s.charCodeAt(i)) ? i + dir : i;
}
// src/hooks/useAgentSync.ts
var MAX_AGENTS = 8;
var CRON_POLL_MS = 5e3;
var SPAWN_POLL_MS = 3e3;
function shortName(s, max = 45) {
	if (s.length <= max) return s;
	return sliceCodePoints(s, 0, max - 1) + "…";
}
/**
* The scene's agents: the person's live sessions (newest first, as the session
* list orders them), then up to three enabled or running crons and three
* running subagents, eight in all.
*
* The sessions are the host's own (`useHostSessions`), titled and labelled as
* the session list shows them. The crons and subagents are polled through the
* scoped client.
*/
function useAgentSync(host) {
	const api = useAppApi();
	const apiRef = useRef(api);
	apiRef.current = api;
	const [extras, setExtras] = useState([]);
	const slotAgents = useMemo(() => (host.sessions ?? []).map((s) => ({
		id: "slot-" + s.key,
		name: shortName(s.title),
		label: s.agentLabel,
		kind: "slot",
		running: s.running,
		detail: s.messageCount + " msgs",
		lastMessage: s.lastMessage,
		waitingForInput: s.waitingForInput,
		pendingApproval: s.pendingApproval ? {
			tool: s.pendingApproval.tool,
			approval: s.pendingApproval
		} : null
	})), [host.sessions]);
	useEffect(() => {
		let cancelled = false;
		let cronTimer;
		let spawnTimer;
		let cronResult = [];
		let spawnResult = [];
		const update = () => {
			if (!cancelled) setExtras([...cronResult, ...spawnResult]);
		};
		const pollCron = async () => {
			try {
				const cronData = await apiRef.current.get("/api/crons");
				cronResult = (Array.isArray(cronData?.jobs) ? cronData.jobs : []).filter((c) => c.enabled || c.is_running === true).slice(0, 3).map((cr) => ({
					id: "cron-" + cr.id,
					name: shortName(cr.name || cr.id),
					label: "cron",
					kind: "cron",
					running: cr.is_running === true,
					detail: cr.schedule
				}));
			} catch {}
			update();
			if (!cancelled) cronTimer = setTimeout(pollCron, CRON_POLL_MS);
		};
		const pollSpawn = async () => {
			try {
				const spawnData = await apiRef.current.get("/api/spawn");
				spawnResult = (Array.isArray(spawnData?.agents) ? spawnData.agents : []).filter((s) => !s.done).slice(0, 3).map((sp) => ({
					id: "spawn-" + sp.id,
					name: shortName(sp.task, 45),
					label: "spawn",
					kind: "spawn",
					running: !sp.done,
					detail: sp.done ? "done" : "running"
				}));
			} catch {}
			update();
			if (!cancelled) spawnTimer = setTimeout(pollSpawn, SPAWN_POLL_MS);
		};
		pollCron();
		pollSpawn();
		return () => {
			cancelled = true;
			clearTimeout(cronTimer);
			clearTimeout(spawnTimer);
		};
	}, []);
	return {
		agents: useMemo(() => [...slotAgents, ...extras].slice(0, MAX_AGENTS), [slotAgents, extras]),
		maxAgents: MAX_AGENTS
	};
}
// src/pages/scenes/config.tsx
var SCENES = [
	{
		key: "office",
		get label() {
			return i18nT("pages.scenes.config.office_label");
		},
		icon: /* @__PURE__ */ jsx(Building2, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.office_desc");
		}
	},
	{
		key: "panda",
		get label() {
			return i18nT("pages.scenes.config.panda_label");
		},
		icon: /* @__PURE__ */ jsx(Sparkles, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.panda_desc");
		}
	},
	{
		key: "neural",
		get label() {
			return i18nT("pages.scenes.config.neural_label");
		},
		icon: /* @__PURE__ */ jsx(Brain, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.neural_desc");
		}
	},
	{
		key: "wizard",
		get label() {
			return i18nT("pages.scenes.config.wizard_label");
		},
		icon: /* @__PURE__ */ jsx(Wand2, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.wizard_desc");
		}
	},
	{
		key: "underwater",
		get label() {
			return i18nT("pages.scenes.config.underwater_label");
		},
		icon: /* @__PURE__ */ jsx(Waves, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.underwater_desc");
		}
	},
	{
		key: "mission",
		get label() {
			return i18nT("pages.scenes.config.mission_label");
		},
		icon: /* @__PURE__ */ jsx(Rocket, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.mission_desc");
		}
	},
	{
		key: "serengeti",
		get label() {
			return i18nT("pages.scenes.config.serengeti_label");
		},
		icon: /* @__PURE__ */ jsx(TreePine, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.serengeti_desc");
		}
	},
	{
		key: "ghost",
		get label() {
			return i18nT("pages.scenes.config.ghost_label");
		},
		icon: /* @__PURE__ */ jsx(Ghost, { className: "lucide-inline" }),
		get desc() {
			return i18nT("pages.scenes.config.ghost_desc");
		}
	}
];
var SCENE_STORAGE_KEY = "mc-agent-scene";
/** Canvas pixel-buffer multiplier - sharp on HiDPI screens */
var SCENE_SCALE = 3 * Math.min(Math.ceil(window.devicePixelRatio ?? 1), 2);
var POPOUT_CHANNEL = "kirocrew-worlds-popout";
// src/utils/popoutRoute.ts
/**
* Where this page's pop-out window opens, and whether this window is one.
*
* The dashboard opens any app page in a window of its own under
* `/popout/app/<route>`, with its own store and socket. The page is reached at
* `/apps/agent-worlds` on a fresh install and at `/worlds` on a copy that took
* over the built-in (the route the built-in had, which adoption keeps), so the
* route is read off the address the page was opened at. What comes before it is
* the dashboard's base path, if it is served under one.
*/
/** Document-path prefix of the dashboard's app pop-out window. */
var APP_POPOUT_PREFIX = "/popout/app";
/** This page's routes, the most specific first. */
var PAGE_ROUTES = ["/apps/agent-worlds", "/worlds"];
/** Whether the page is rendered in a pop-out window rather than the dashboard. */
function isPopoutWindow(pathname = window.location.pathname) {
	return pathname.includes("/popout/app/");
}
/** The pop-out window's address for the page opened at `pathname`. */
function popoutUrl(pathname = window.location.pathname, origin = window.location.origin) {
	for (const route of PAGE_ROUTES) {
		const at = pathname.lastIndexOf(route);
		const end = at + route.length;
		if (at >= 0 && (end === pathname.length || pathname[end] === "/")) return origin + pathname.slice(0, at) + APP_POPOUT_PREFIX + route;
	}
	return origin + APP_POPOUT_PREFIX + PAGE_ROUTES[0];
}
// src/hooks/usePopoutSync.ts
var HEARTBEAT_MS = 5e3;
function usePopoutSync(isPopout, onSceneChange) {
	const [popoutActive, setPopoutActive] = useState(false);
	const channelRef = useRef(null);
	const popoutRef = useRef(null);
	const pongReceived = useRef(false);
	const onSceneChangeRef = useRef(onSceneChange);
	onSceneChangeRef.current = onSceneChange;
	useEffect(() => {
		if (typeof BroadcastChannel === "undefined") return;
		const ch = new BroadcastChannel(POPOUT_CHANNEL);
		channelRef.current = ch;
		ch.onmessage = (e) => {
			const msg = e.data;
			if (!isPopout) {
				if (msg.type === "popout-open") {
					pongReceived.current = true;
					setPopoutActive(true);
				}
				if (msg.type === "popout-close") setPopoutActive(false);
				if (msg.type === "scene") {
					safeSetItem(SCENE_STORAGE_KEY, msg.scene);
					onSceneChangeRef.current?.(msg.scene);
				}
				if (msg.type === "pong") {
					pongReceived.current = true;
					setPopoutActive(true);
				}
			} else {
				if (msg.type === "scene") {
					safeSetItem(SCENE_STORAGE_KEY, msg.scene);
					onSceneChangeRef.current?.(msg.scene);
				}
				if (msg.type === "ping") ch.postMessage({ type: "pong" });
			}
		};
		let heartbeat;
		if (isPopout) ch.postMessage({ type: "popout-open" });
		else {
			ch.postMessage({ type: "ping" });
			heartbeat = setInterval(() => {
				if (!pongReceived.current) setPopoutActive(false);
				pongReceived.current = false;
				ch.postMessage({ type: "ping" });
			}, HEARTBEAT_MS);
		}
		return () => {
			if (heartbeat) clearInterval(heartbeat);
			if (isPopout) ch.postMessage({ type: "popout-close" });
			ch.close();
			channelRef.current = null;
		};
	}, [isPopout]);
	useEffect(() => {
		if (!isPopout) return;
		const onUnload = () => channelRef.current?.postMessage({ type: "popout-close" });
		window.addEventListener("beforeunload", onUnload);
		return () => window.removeEventListener("beforeunload", onUnload);
	}, [isPopout]);
	return {
		popoutActive,
		broadcastScene: useCallback((scene) => {
			channelRef.current?.postMessage({
				type: "scene",
				scene
			});
		}, []),
		openPopout: useCallback(() => {
			if (popoutRef.current && !popoutRef.current.closed) {
				popoutRef.current.focus();
				return;
			}
			const w = Math.min(960, screen.availWidth * .6);
			const h = Math.round(w / 1.5) + 80;
			const multiScreen = screen;
			const left = (multiScreen.availLeft ?? 0) + (screen.availWidth - w) / 2;
			const top = (multiScreen.availTop ?? 0) + (screen.availHeight - h) / 2;
			popoutRef.current = window.open(popoutUrl(), "kirocrew-worlds", `width=${w},height=${h},left=${left},top=${top},resizable=yes`);
		}, [])
	};
}
// src/hooks/sceneStateCache.ts
/**
* Tracks which agent IDs have been seen in each scene.
* If an agent was previously seen, scenes skip the entrance animation.
* Uses module-level Map (survives unmount) + localStorage (survives reload).
*/
var STORAGE_KEY = "mc-scene-known-agents";
var memoryCache = /* @__PURE__ */ new Map();
function loadFromStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
function saveToStorage() {
	const obj = {};
	memoryCache.forEach((set, key) => {
		obj[key] = [...set];
	});
	try {
		safeSetItem(STORAGE_KEY, JSON.stringify(obj));
	} catch {}
}
function getOrInit(sceneKey) {
	if (memoryCache.has(sceneKey)) return memoryCache.get(sceneKey);
	const stored = loadFromStorage();
	const set = new Set(stored[sceneKey] || []);
	memoryCache.set(sceneKey, set);
	return set;
}
/** Check if this agent was previously seen in this scene */
function isKnownAgent(sceneKey, agentId) {
	return getOrInit(sceneKey).has(agentId);
}
/** Mark agent IDs as known for this scene and persist */
function markAgentsKnown(sceneKey, agentIds) {
	const set = getOrInit(sceneKey);
	let changed = false;
	for (const id of agentIds) if (!set.has(id)) {
		set.add(id);
		changed = true;
	}
	if (changed) saveToStorage();
}
/** Remove agent IDs that are no longer present (skip if currentIds is empty to avoid wiping cache on mount) */
function pruneAgents(sceneKey, currentIds) {
	if (currentIds.length === 0) return;
	const set = getOrInit(sceneKey);
	const currentSet = new Set(currentIds);
	let changed = false;
	for (const id of set) if (!currentSet.has(id)) {
		set.delete(id);
		changed = true;
	}
	if (changed) saveToStorage();
}
// src/hooks/sceneText.ts
var FONT_FAMILY = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", system-ui, sans-serif";
var BASE_SIZE = 14 * (SCENE_SCALE / 3);
var ROLE_SCALE = {
	title: 1.1,
	spell: .85,
	name: .8,
	status: .66,
	detail: .58,
	label: .5
};
/** Get a font string for a given role and optional weight */
function sceneFont(role, weight = "") {
	const size = BASE_SIZE * ROLE_SCALE[role];
	return weight ? `${weight} ${size}px ${FONT_FAMILY}` : `${size}px ${FONT_FAMILY}`;
}
/** Get the computed font size for a role */
function sceneFontSize(role) {
	return BASE_SIZE * ROLE_SCALE[role];
}
/** Vertical advance between wrapped lines for a role, in canvas px */
function sceneLineHeight(role) {
	return sceneFontSize(role) * 1.3;
}
/** Word-wrap text to fit maxWidth using the current canvas font. Hard-breaks over-long words. */
function wrapText(T, text, maxWidth) {
	if (T.measureText(text).width <= maxWidth) return [text];
	const words = text.split(/\s+/).filter(Boolean);
	const lines = [];
	let line = "";
	const push = () => {
		if (line) {
			lines.push(line);
			line = "";
		}
	};
	for (const word of words) {
		const candidate = line ? line + " " + word : word;
		if (T.measureText(candidate).width <= maxWidth) {
			line = candidate;
			continue;
		}
		push();
		if (T.measureText(word).width <= maxWidth) {
			line = word;
			continue;
		}
		let chunk = "";
		for (const ch of word) if (T.measureText(chunk + ch).width > maxWidth && chunk) {
			lines.push(chunk);
			chunk = ch;
		} else chunk += ch;
		line = chunk;
	}
	push();
	return lines.length ? lines : [text];
}
/**
* Initialize a text overlay canvas for high-DPI rendering.
* Returns the 2D context. Call once during effect setup.
*/
function initTextCanvas(canvas, w, h, scale) {
	const dpr = window.devicePixelRatio || 1;
	const cssW = w * scale;
	const cssH = h * scale;
	canvas.width = cssW * dpr;
	canvas.height = cssH * dpr;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2d context for text canvas");
	ctx.imageSmoothingEnabled = true;
	ctx.scale(dpr, dpr);
	return ctx;
}
/**
* Draw text with an optional auto-sized background box.
* Both background and text are drawn on the text canvas (T) for correct DPI alignment.
* When `maxWidth` (canvas px) is provided, text word-wraps into multiple lines.
* Returns the number of lines drawn so callers can offset content below.
*/
function drawLabel(T, text, x, y, opts) {
	const { role, weight = "", color, bgColor, align = "start", padX = 3, padY = 2, scale: S, maxWidth } = opts;
	T.font = sceneFont(role, weight);
	T.fillStyle = color;
	T.textAlign = align;
	T.textBaseline = "middle";
	const lines = maxWidth ? wrapText(T, text, maxWidth) : [text];
	const lineH = sceneLineHeight(role);
	lines.forEach((line, i) => {
		const ly = y + i * lineH;
		if (bgColor) {
			const tw = T.measureText(line).width;
			const bh = sceneFontSize(role) + padY * 2 * S;
			let bx = x;
			if (align === "center") bx = x - tw / 2;
			else if (align === "end") bx = x - tw;
			T.fillStyle = bgColor;
			T.fillRect(bx - padX * S, ly - bh / 2, tw + padX * 2 * S, bh);
			T.fillStyle = color;
		}
		T.fillText(line, x, ly);
	});
	T.textAlign = "start";
	T.textBaseline = "alphabetic";
	return lines.length;
}
/** How long a fresh message bubble stays visible, in ms */
var SPEECH_BUBBLE_MS = 7e3;
/** Kiro ghost bitmap, 24×28 - traced from the reference art. Shared by the
*  Ghost scene sprite and the mini agent avatar in the thread popover. */
var KIRO_GHOST_PIXELS = [
	"..........#######.......",
	".......#############....",
	"......##############....",
	"......###############...",
	".....#################..",
	"....##################..",
	"....###################.",
	"....###################.",
	"....####################",
	"...#####################",
	"...#####################",
	"...#####################",
	"...#####################",
	"...#####################",
	"..######################",
	"..######################",
	".#######################",
	".######################.",
	"#######################.",
	"######################..",
	".#####################..",
	".###.#################..",
	"....#################...",
	"....#################...",
	"....########.#######....",
	"....#######..######.....",
	"....#######...####......",
	"......###..............."
];
/**
* Draw a speech bubble with wrapped text above an agent.
* (bx, by) is the bubble tail anchor in canvas px (the agent's head).
* Text is clamped to `maxLines` with an ellipsis on the last line.
*/
function drawSpeechBubble(T, text, bx, by, opts) {
	const { scale: S, maxWidth = 82 * S, maxLines = 3, alpha = 1 } = opts;
	const role = "detail";
	T.font = sceneFont(role);
	const flat = text.replace(/\s+/g, " ").trim();
	if (!flat) return;
	let lines = wrapText(T, flat, maxWidth);
	if (lines.length > maxLines) {
		lines = lines.slice(0, maxLines);
		lines[maxLines - 1] = lines[maxLines - 1].replace(/.{2}$/, "") + "…";
	}
	const lineH = sceneLineHeight(role);
	const padX = 4 * S, padY = 3 * S;
	const bw = Math.max(...lines.map((l) => T.measureText(l).width)) + padX * 2;
	const bh = lines.length * lineH + padY * 2;
	const left = bx - bw / 2;
	const top = by - bh - 6 * S;
	T.save();
	T.globalAlpha = alpha;
	T.fillStyle = "rgba(255,255,255,0.94)";
	T.beginPath();
	const r = 4 * S;
	T.roundRect(left, top, bw, bh, r);
	T.fill();
	T.beginPath();
	T.moveTo(bx - 3 * S, top + bh);
	T.lineTo(bx, top + bh + 5 * S);
	T.lineTo(bx + 3 * S, top + bh);
	T.closePath();
	T.fill();
	T.fillStyle = "#222";
	T.textAlign = "left";
	T.textBaseline = "middle";
	lines.forEach((line, i) => {
		T.fillText(line, left + padX, top + padY + lineH * i + lineH / 2);
	});
	T.restore();
	T.textAlign = "start";
	T.textBaseline = "alphabetic";
}
/** CSS props for the text overlay canvas element */
var TEXT_CANVAS_STYLE = {
	position: "absolute",
	inset: 0,
	width: "100%",
	height: "100%",
	pointerEvents: "none",
	borderRadius: 8
};
/** CSS props for the scene container div */
var SCENE_CONTAINER_STYLE = (w, h) => ({
	position: "relative",
	maxWidth: "100%",
	aspectRatio: `${w}/${h}`
});
/** CSS props for the pixel art canvas */
var PIXEL_CANVAS_STYLE = {
	imageRendering: "pixelated",
	border: "2px solid var(--accent, #f90)",
	cursor: "pointer",
	width: "100%",
	maxHeight: "100%",
	objectFit: "contain",
	borderRadius: 8
};
// src/hooks/sceneCanvas.ts
/**
* Shared canvas utilities for Worlds scenes.
* Provides the canvas initialiser and the animation loop.
*/
/** Shared canvas init: sets up pixel canvas + text overlay, returns bound draw-pixel fn */
function initSceneCanvases(canvas, textCanvas, W, H, S) {
	const X = canvas.getContext("2d");
	canvas.width = W * S;
	canvas.height = H * S;
	X.imageSmoothingEnabled = false;
	const T = initTextCanvas(textCanvas, W, H, S);
	const d = (x, y, w, h, c) => {
		X.fillStyle = c;
		X.fillRect(x * S, y * S, w * S, h * S);
	};
	return {
		X,
		T,
		d
	};
}
/** Shared animation loop: runs update+draw on each frame when visible */
function runSceneLoop(visibleRef, tickRef, update, draw) {
	let raf;
	const loop = () => {
		if (visibleRef.current) {
			tickRef.current++;
			update(tickRef.current);
			draw(tickRef.current);
		}
		raf = requestAnimationFrame(loop);
	};
	loop();
	return () => cancelAnimationFrame(raf);
}
/** Sync visible prop to a ref for use in animation loops */
function useVisibleSync(visibleRef, visible) {
	useEffect(() => {
		visibleRef.current = visible;
	}, [visible, visibleRef]);
}
// src/hooks/useSceneInteraction.tsx
/** Tiny pixel Kiro ghost used as the popover's agent identity marker */
function MiniGhost({ color }) {
	const ref = useRef(null);
	useEffect(() => {
		const cv = ref.current;
		const ctx = cv?.getContext("2d");
		if (!cv || !ctx) return;
		ctx.clearRect(0, 0, 24, 28);
		ctx.fillStyle = color;
		KIRO_GHOST_PIXELS.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) if (row[x] === "#") ctx.fillRect(x, y, 1, 1);
		});
		ctx.fillStyle = "#14141e";
		ctx.fillRect(11, 8, 3, 4);
		ctx.fillRect(17, 8, 3, 4);
	}, [color]);
	return /* @__PURE__ */ jsx("canvas", {
		ref,
		width: 24,
		height: 28,
		style: {
			width: 18,
			height: 21,
			imageRendering: "pixelated",
			flexShrink: 0
		},
		"aria-hidden": true
	});
}
/** Derive the agent's true state line from its kind, running flag, and detail. */
function agentStatusLine(agent) {
	const detail = agent.detail ? ` · ${agent.detail}` : "";
	switch (agent.kind) {
		case "cron": return agent.running ? i18nT("hooks.useSceneInteraction.cron_running") : i18nT("hooks.useSceneInteraction.cron", { detail });
		case "spawn": return i18nT("hooks.useSceneInteraction.subagent", { detail });
		default: return (agent.running ? i18nT("hooks.useSceneInteraction.working") : i18nT("hooks.useSceneInteraction.idle")) + detail;
	}
}
/** Truncate a message preview to a single tooltip-friendly line. */
function messagePreview(text, max = 64) {
	const flat = text.replace(/\s+/g, " ").trim();
	if (flat.length <= max) return flat;
	return sliceCodePoints(flat, 0, max - 1) + "…";
}
/** Streaming-bookkeeping roles the main chat filters out of history */
var THREAD_SKIP_ROLES = /* @__PURE__ */ new Set(["chunk", "done"]);
/** Clean raw slot history for the mini thread: drop streaming roles and
*  collapse consecutive duplicates (a streamed chunk + its persisted final). */
function cleanThread(msgs) {
	const out = [];
	for (const m of msgs) {
		if (THREAD_SKIP_ROLES.has(m.role)) continue;
		const prev = out[out.length - 1];
		if (prev && prev.role === m.role && prev.content === m.content) continue;
		out.push(m);
	}
	return out.slice(-8);
}
/** A session's newest messages, through the scoped client
*  (`GET /api/chat/slots/<key>`, declared under `/api/chat/slots`). */
function readThread(scoped, slotKey) {
	return scoped.get(`/api/chat/slots/${encodeURIComponent(slotKey)}?limit=24`);
}
/**
* Shared tooltip + mini thread view for all Worlds scenes.
* Hover shows true state (+ real last message when sources are provided).
* Clicking a chat-slot agent opens a mini thread popover with recent messages
* and an "Open chat" action.
* @param canvasRef - ref to the pixel canvas element
* @param agentsRef - ref to the scene's agent array
* @param W - scene width in logical pixels
* @param H - scene height in logical pixels
* @param theme - scene-specific tooltip messages
* @param hitRadius - hit-test radius in logical pixels (default 10)
* @param extraLine - optional scene-specific tooltip line
* @param sources - live AgentSource list (enables last-message tooltip line)
*/
function useSceneInteraction(canvasRef, agentsRef, W, H, theme, hitRadius = 10, extraLine, sources) {
	const host = useContext(HostSessionsContext);
	const scoped = useAppApi();
	const { openChat: launchChat } = useChatLauncher();
	const ime = useImeGuard();
	const [tooltip, setTooltip] = useState(null);
	const [threadView, setThreadView] = useState(null);
	const sourcesRef = useRef(sources);
	sourcesRef.current = sources;
	const popoverRef = useRef(null);
	const getAgentAt = useCallback((e) => {
		const cv = canvasRef.current;
		if (!cv) return void 0;
		const rect = cv.getBoundingClientRect();
		const mx = (e.clientX - rect.left) / rect.width * W;
		const my = (e.clientY - rect.top) / rect.height * H;
		return agentsRef.current?.find((a) => Math.abs(a.x - mx) < hitRadius && Math.abs(a.y - my) < hitRadius);
	}, [
		canvasRef,
		agentsRef,
		W,
		H,
		hitRadius
	]);
	const onMouseMove = useCallback((e) => {
		const a = getAgentAt(e);
		if (a) {
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			setTooltip({
				x: e.clientX - rect.left + 12,
				y: e.clientY - rect.top - 50,
				agent: a
			});
		} else setTooltip(null);
	}, [getAgentAt, canvasRef]);
	const onMouseLeave = useCallback(() => setTooltip(null), []);
	const openChat = useCallback((agent) => {
		const slotKey = agent.id.replace(/^slot-/, "");
		launchChat({ slotKey });
	}, [launchChat]);
	const onClick = useCallback((e) => {
		const a = getAgentAt(e);
		if (!a || a.kind !== "slot") {
			setThreadView(null);
			return;
		}
		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;
		if (threadView && threadView.agent.id === a.id) {
			setThreadView(null);
			return;
		}
		const px = Math.min(e.clientX - rect.left + 12, rect.width - 280);
		const py = Math.min(Math.max(e.clientY - rect.top - 60, 8), rect.height - 200);
		setTooltip(null);
		setThreadView({
			x: Math.max(8, px),
			y: py,
			agent: a,
			loading: true,
			messages: [],
			error: false
		});
		const slotKey = a.id.replace(/^slot-/, "");
		readThread(scoped, slotKey).then((d) => {
			setThreadView((tv) => tv && tv.agent.id === a.id ? {
				...tv,
				loading: false,
				messages: cleanThread(d.messages || [])
			} : tv);
		}).catch(() => {
			setThreadView((tv) => tv && tv.agent.id === a.id ? {
				...tv,
				loading: false,
				error: true
			} : tv);
		});
	}, [
		getAgentAt,
		canvasRef,
		threadView,
		scoped
	]);
	useEffect(() => {
		if (!threadView) return;
		const onPointerDown = (ev) => {
			const el = popoverRef.current;
			if (el && ev.target instanceof Node && !el.contains(ev.target) && ev.target !== canvasRef.current) setThreadView(null);
		};
		const onKey = (ev) => {
			if (ev.key === "Escape") setThreadView(null);
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKey);
		};
	}, [threadView, canvasRef]);
	const threadAgentId = threadView?.agent.id;
	const lastSentRef = useRef(null);
	const scopedRef = useRef(scoped);
	scopedRef.current = scoped;
	const hostRef = useRef(host);
	hostRef.current = host;
	const messagesEndRef = useRef(null);
	useEffect(() => {
		if (!threadAgentId || !threadAgentId.startsWith("slot-")) return;
		const slotKey = threadAgentId.replace(/^slot-/, "");
		const refresh = () => {
			readThread(scopedRef.current, slotKey).then((d) => {
				setThreadView((tv) => {
					if (!tv || tv.agent.id !== threadAgentId) return tv;
					let msgs = cleanThread(d.messages || []);
					const sent = lastSentRef.current;
					if (sent && sent.slotKey === slotKey && Date.now() - sent.at < 8e3 && !msgs.some((m) => m.role === "user" && m.content === sent.content)) msgs = [...msgs, {
						role: "user",
						content: sent.content
					}].slice(-8);
					return {
						...tv,
						loading: false,
						messages: msgs
					};
				});
			}).catch(() => {});
		};
		const timer = setInterval(refresh, 2e3);
		return () => clearInterval(timer);
	}, [threadAgentId]);
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ block: "nearest" });
	}, [threadView?.messages.length, threadView?.loading]);
	const sourceFor = (agent) => sourcesRef.current?.find((s) => s.id === agent.id);
	const [draft, setDraft] = useState("");
	const [sendState, setSendState] = useState("idle");
	const [sendFailReason, setSendFailReason] = useState("");
	const [sendUnconfirmed, setSendUnconfirmed] = useState(false);
	/** A send that FAILED (refused / never left) -- the state the Retry treatment is for. */
	const sendFailedHard = sendState === "failed" && !sendUnconfirmed;
	const [approvalState, setApprovalState] = useState("idle");
	const [approvalError, setApprovalError] = useState(null);
	const [goneApprovalKey, setGoneApprovalKey] = useState(null);
	const [failedApprovalKey, setFailedApprovalKey] = useState(null);
	const composerTargetRef = useRef(null);
	const composerEpochRef = useRef(0);
	useEffect(() => {
		composerTargetRef.current = threadView?.agent.id ?? null;
		composerEpochRef.current += 1;
		setDraft("");
		setSendState("idle");
		setSendFailReason("");
		setApprovalState("idle");
		setApprovalError(null);
		setFailedApprovalKey(null);
	}, [threadView?.agent.id]);
	const [dragPos, setDragPos] = useState(null);
	useEffect(() => {
		setDragPos(null);
	}, [threadView?.agent.id]);
	const onHeaderPointerDown = useCallback((e) => {
		if (!threadView) return;
		if (e.target instanceof Element && e.target.closest("button")) return;
		e.preventDefault();
		const startX = e.clientX, startY = e.clientY;
		const base = dragPos ?? {
			x: threadView.x,
			y: threadView.y
		};
		const parent = popoverRef.current?.offsetParent;
		const bounds = parent ? {
			w: parent.clientWidth,
			h: parent.clientHeight
		} : null;
		const onMove = (ev) => {
			let nx = base.x + (ev.clientX - startX);
			let ny = base.y + (ev.clientY - startY);
			if (bounds) {
				nx = Math.min(Math.max(nx, -180), bounds.w - 90);
				ny = Math.min(Math.max(ny, 0), bounds.h - 40);
			}
			setDragPos({
				x: nx,
				y: ny
			});
		};
		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}, [threadView, dragPos]);
	const sendToAgent = useCallback(async (agent, text) => {
		const msg = text.trim();
		if (!msg) return;
		const slotKey = agent.id.replace(/^slot-/, "");
		setSendState("sending");
		const epochAtSend = composerEpochRef.current;
		const sameComposer = () => composerTargetRef.current === agent.id && composerEpochRef.current === epochAtSend;
		setDraft("");
		const reportFailedSend = (reason, opts) => {
			if (!sameComposer()) return;
			setSendState("failed");
			setSendFailReason(reason || "");
			setSendUnconfirmed(!!opts?.unconfirmed);
			setDraft((prev) => {
				const keep = prev.replace(/\s+$/, "");
				if (!keep.trim()) return msg;
				if (keep === msg) return prev;
				return [keep, msg].join(" ");
			});
		};
		const src = sourceFor(agent);
		const current = hostRef.current;
		if (!current) {
			reportFailedSend();
			return;
		}
		let receipt;
		try {
			receipt = await current.send(slotKey, msg, { steer: !!src?.running });
		} catch (err) {
			reportFailedSend(err instanceof Error ? err.message : void 0);
			return;
		}
		switch (receipt.status) {
			case "refused":
				reportFailedSend(receipt.reason);
				return;
			case "transport-error":
				reportFailedSend();
				return;
			case "unknown":
				if (sameComposer()) setSendState("idle");
				return;
			case "response-late":
				reportFailedSend(i18nT("pages.chatPage.delivery_unconfirmed"), { unconfirmed: true });
				return;
		}
		lastSentRef.current = {
			slotKey,
			content: msg,
			at: Date.now()
		};
		if (sameComposer()) {
			setSendState("sent");
			setTimeout(() => setSendState((s) => s === "sent" ? "idle" : s), 1500);
		}
		setThreadView((tv) => tv && tv.agent.id === agent.id ? {
			...tv,
			messages: [...tv.messages, {
				role: "user",
				content: msg
			}].slice(-8)
		} : tv);
	}, []);
	const resolvePendingApproval = useCallback(async (agent, action) => {
		const src = sourceFor(agent);
		const current = hostRef.current;
		if (!src?.pendingApproval || !current) return;
		const approval = src.pendingApproval.approval;
		setApprovalState("resolving");
		setApprovalError(null);
		let result;
		try {
			result = await current.decide(approval, action);
		} catch (err) {
			result = {
				outcome: "failed",
				message: err instanceof Error ? err.message : String(err)
			};
		}
		if (result.outcome === "decided") {
			setApprovalState("idle");
			return;
		}
		setApprovalError(result);
		setApprovalState("failed");
		setFailedApprovalKey(approval.key);
		if (result.outcome === "gone" || result.outcome === "settled") setGoneApprovalKey(approval.key);
	}, []);
	const tooltipSource = tooltip ? sourceFor(tooltip.agent) : void 0;
	const [creating, setCreating] = useState(false);
	const createSession = useCallback(async () => {
		setCreating(true);
		try {
			await hostRef.current?.create();
		} catch {}
		setCreating(false);
	}, []);
	const worldFull = (sourcesRef.current?.length ?? 0) >= 8;
	const spawnEl = sources ? /* @__PURE__ */ jsx("button", {
		onClick: createSession,
		disabled: creating || worldFull,
		title: worldFull ? i18nT("hooks.useSceneInteraction.all_slots_are_occupied") : i18nT("hooks.useSceneInteraction.create_a_new_chat_session_a_new_agent_joins_this"),
		style: {
			position: "absolute",
			right: 10,
			bottom: 10,
			zIndex: 8,
			background: "rgba(10,10,20,0.72)",
			border: "1.5px solid var(--accent, #f90)",
			borderRadius: 6,
			color: "var(--accent, #f90)",
			fontSize: 11,
			fontWeight: "bold",
			padding: "4px 10px",
			cursor: worldFull ? "default" : "pointer",
			opacity: creating || worldFull ? .45 : .9,
			fontFamily: "var(--font-body, inherit)"
		},
		children: creating ? i18nT("hooks.useSceneInteraction.summoning") : i18nT("hooks.useSceneInteraction.new_session")
	}) : null;
	const tooltipEl = tooltip && !threadView ? /* @__PURE__ */ jsxs("div", {
		style: {
			position: "absolute",
			left: tooltip.x,
			top: tooltip.y,
			background: "#111",
			border: "1px solid #555",
			borderRadius: 4,
			padding: "4px 8px",
			fontSize: 11,
			color: "#ccc",
			pointerEvents: "none",
			whiteSpace: "nowrap",
			zIndex: 10,
			maxWidth: 300
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					color: "#f90",
					fontWeight: "bold",
					overflow: "hidden",
					textOverflow: "ellipsis"
				},
				children: tooltip.agent.name
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					/* @__PURE__ */ jsx(Circle, {
						size: 8,
						fill: tooltip.agent.running ? "#4f4" : "#ccc",
						color: tooltip.agent.running ? "#4f4" : "#ccc",
						"aria-hidden": true
					}),
					" ",
					agentStatusLine(tooltip.agent)
				]
			}),
			tooltipSource?.pendingApproval ? /* @__PURE__ */ jsxs("div", {
				style: {
					color: "#fb0",
					display: "flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					/* @__PURE__ */ jsx(Pause, {
						size: 10,
						"aria-hidden": true
					}),
					" ",
					i18nT("hooks.useSceneInteraction.needs_approval"),
					" ",
					tooltipSource.pendingApproval.tool
				]
			}) : null,
			tooltipSource?.lastMessage ? /* @__PURE__ */ jsxs("div", {
				style: {
					color: "#aab",
					overflow: "hidden",
					textOverflow: "ellipsis",
					display: "flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					/* @__PURE__ */ jsx(MessageSquare, {
						size: 10,
						style: { flexShrink: 0 },
						"aria-hidden": true
					}),
					" ",
					/* @__PURE__ */ jsx("span", {
						style: {
							overflow: "hidden",
							textOverflow: "ellipsis"
						},
						children: messagePreview(tooltipSource.lastMessage)
					})
				]
			}) : null,
			/* @__PURE__ */ jsx("div", {
				style: {
					color: "#777",
					fontStyle: "italic"
				},
				children: tooltip.agent.running ? theme.active : theme.idle
			}),
			extraLine && extraLine(tooltip.agent),
			tooltip.agent.kind === "slot" ? /* @__PURE__ */ jsx("div", {
				style: {
					color: "#666",
					marginTop: 2
				},
				children: i18nT("hooks.useSceneInteraction.click_for_thread")
			}) : null
		]
	}) : null;
	const threadViewEl = threadView ? /* @__PURE__ */ jsxs("div", {
		ref: popoverRef,
		role: "dialog",
		"aria-label": i18nT("hooks.useSceneInteraction.recent_messages_for", { name: threadView.agent.name }),
		style: {
			position: "absolute",
			left: (dragPos ?? threadView).x,
			top: (dragPos ?? threadView).y,
			width: 272,
			background: "#15151f",
			border: "1px solid #555",
			borderRadius: 6,
			fontSize: 11,
			color: "#ccc",
			zIndex: 20,
			boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
			overflow: "hidden"
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				onPointerDown: onHeaderPointerDown,
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6,
					padding: "6px 8px",
					borderBottom: "1px solid #333",
					cursor: "grab",
					touchAction: "none",
					userSelect: "none"
				},
				children: [
					/* @__PURE__ */ jsx(MiniGhost, { color: threadView.agent.color || "#e8ecf4" }),
					/* @__PURE__ */ jsx("span", {
						style: {
							color: "#f90",
							fontWeight: "bold",
							flex: 1,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap"
						},
						children: threadView.agent.name
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: () => openChat(threadView.agent),
						style: {
							background: "#2a2a3a",
							border: "1px solid #555",
							borderRadius: 4,
							color: "#ddd",
							fontSize: 10,
							padding: "2px 8px",
							cursor: "pointer"
						},
						children: i18nT("hooks.useSceneInteraction.open_chat")
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: () => setThreadView(null),
						"aria-label": i18nT("hooks.useSceneInteraction.close_thread_view"),
						style: {
							background: "transparent",
							border: "none",
							color: "#888",
							fontSize: 12,
							cursor: "pointer",
							padding: "0 2px",
							lineHeight: 1
						},
						children: /* @__PURE__ */ jsx(X, {
							size: 12,
							"aria-hidden": true
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					maxHeight: 180,
					overflowY: "auto",
					padding: "6px 8px",
					display: "flex",
					flexDirection: "column",
					gap: 5
				},
				children: [
					threadView.loading ? /* @__PURE__ */ jsx("div", {
						style: {
							color: "#777",
							fontStyle: "italic"
						},
						children: i18nT("hooks.useSceneInteraction.loading_thread")
					}) : threadView.error ? /* @__PURE__ */ jsx("div", {
						style: { color: "#c66" },
						children: i18nT("hooks.useSceneInteraction.couldn_t_load_messages")
					}) : threadView.messages.length === 0 ? /* @__PURE__ */ jsx("div", {
						style: {
							color: "#777",
							fontStyle: "italic"
						},
						children: i18nT("hooks.useSceneInteraction.no_messages_yet")
					}) : threadView.messages.map((m, i) => /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							gap: 5,
							alignItems: "baseline"
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: {
								color: m.role === "user" ? "#f90" : "#7a8",
								flexShrink: 0,
								fontWeight: "bold"
							},
							children: m.role === "user" ? "you" : "kiro"
						}), /* @__PURE__ */ jsx("span", {
							style: {
								color: "#bbb",
								overflow: "hidden",
								display: "-webkit-box",
								WebkitLineClamp: 3,
								WebkitBoxOrient: "vertical"
							},
							children: messagePreview(m.content, 200)
						})]
					}, i)),
					sourceFor(threadView.agent)?.running ? /* @__PURE__ */ jsx("div", {
						style: {
							color: "#7a8",
							fontStyle: "italic"
						},
						children: i18nT("hooks.useSceneInteraction.kiro_is_working")
					}) : null,
					/* @__PURE__ */ jsx("div", { ref: messagesEndRef })
				]
			}),
			(() => {
				const src = sourceFor(threadView.agent);
				const gone = !!src?.pendingApproval && goneApprovalKey === src.pendingApproval.approval.key;
				return src?.pendingApproval && !gone ? /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						padding: "6px 8px",
						borderTop: "1px solid #333",
						background: "#241d10"
					},
					children: [
						/* @__PURE__ */ jsxs("span", {
							style: {
								color: "#fb0",
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								display: "flex",
								alignItems: "center",
								gap: 4
							},
							children: [
								/* @__PURE__ */ jsx(Pause, {
									size: 10,
									style: { flexShrink: 0 },
									"aria-hidden": true
								}),
								" ",
								i18nT("hooks.useSceneInteraction.waiting_on_approval"),
								" ",
								src.pendingApproval.tool
							]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => resolvePendingApproval(threadView.agent, "approve"),
							disabled: approvalState === "resolving",
							style: {
								background: "#1e4620",
								border: "1px solid #3a7a3d",
								borderRadius: 4,
								color: "#8f8",
								fontSize: 10,
								padding: "2px 8px",
								cursor: "pointer"
							},
							children: i18nT("hooks.useSceneInteraction.approve")
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => resolvePendingApproval(threadView.agent, "reject"),
							disabled: approvalState === "resolving",
							style: {
								background: "#46201e",
								border: "1px solid #7a3d3a",
								borderRadius: 4,
								color: "#f88",
								fontSize: 10,
								padding: "2px 8px",
								cursor: "pointer"
							},
							children: i18nT("hooks.useSceneInteraction.deny")
						})
					]
				}) : null;
			})(),
			(() => {
				const pending = sourceFor(threadView.agent)?.pendingApproval;
				if (approvalState !== "failed" || !failedApprovalKey) return false;
				if (!pending) return approvalError?.outcome === "settled";
				return failedApprovalKey === pending.approval.key;
			})() ? approvalError?.outcome === "gone" || approvalError?.outcome === "settled" ? /* @__PURE__ */ jsx("div", {
				role: "status",
				"data-testid": "scene-approval-gone",
				style: {
					padding: "6px 8px",
					borderTop: "1px solid #333",
					color: "#aaa"
				},
				children: approvalError.message
			}) : /* @__PURE__ */ jsx(ErrorNotice, {
				variant: "inline",
				testId: "scene-approval-failure",
				report: approvalError?.outcome === "failed" ? approvalError.report : void 0,
				message: approvalError?.message,
				className: "mc-aw-notice mc-aw-danger"
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6,
					padding: "6px 8px",
					borderTop: "1px solid #333"
				},
				children: [/* @__PURE__ */ jsx("input", {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					...ime.bindComposition(),
					onKeyDown: (e) => {
						if (e.key !== "Enter" || e.shiftKey) return;
						if (ime.claimEnter(e)) sendToAgent(threadView.agent, draft);
					},
					placeholder: sourceFor(threadView.agent)?.running ? i18nT("hooks.useSceneInteraction.steer_this_agent") : i18nT("hooks.useSceneInteraction.message_this_agent"),
					"aria-label": i18nT("hooks.useSceneInteraction.message", { name: threadView.agent.name }),
					style: {
						flex: 1,
						background: "#0d0d15",
						border: "1px solid #444",
						borderRadius: 4,
						color: "#ddd",
						fontSize: 11,
						padding: "4px 7px",
						outline: "none"
					}
				}), /* @__PURE__ */ jsx("button", {
					onClick: () => sendToAgent(threadView.agent, draft),
					disabled: sendState === "sending" || !draft.trim(),
					"aria-label": sendState === "sending" ? i18nT("hooks.useSceneInteraction.sending_message") : sendState === "sent" ? i18nT("hooks.useSceneInteraction.message_sent") : sendFailedHard ? i18nT("hooks.useSceneInteraction.retry_sending_message") : i18nT("hooks.useSceneInteraction.send_message"),
					style: {
						background: "#2a2a3a",
						border: "1px solid #555",
						borderRadius: 4,
						color: sendFailedHard ? "#f88" : "#ddd",
						fontSize: 10,
						padding: "2px 9px",
						cursor: "pointer",
						opacity: draft.trim() ? 1 : .5
					},
					children: sendState === "sending" ? "…" : sendState === "sent" ? /* @__PURE__ */ jsx(Check, {
						size: 12,
						"aria-hidden": true
					}) : sendFailedHard ? i18nT("hooks.useSceneInteraction.retry") : i18nT("hooks.useSceneInteraction.send")
				})]
			}),
			sendFailedHard && sendFailReason ? /* @__PURE__ */ jsx(ErrorNotice, {
				variant: "inline",
				message: i18nT("pages.chatPage.send_failed_with_error", { error: sendFailReason }),
				className: "mc-aw-notice mc-aw-red"
			}) : null,
			sendState === "failed" && sendFailReason && sendUnconfirmed ? /* @__PURE__ */ jsxs("div", {
				role: "status",
				className: "mc-aw-warn",
				style: { color: "#fb0" },
				children: [/* @__PURE__ */ jsx(AlertTriangle, {
					size: 14,
					className: "mc-aw-warn-icon",
					"aria-hidden": "true"
				}), /* @__PURE__ */ jsx("span", {
					style: { overflowWrap: "anywhere" },
					children: sendFailReason
				})]
			}) : null
		]
	}) : null;
	return {
		canvasProps: {
			onMouseMove,
			onMouseLeave,
			onClick,
			style: { cursor: tooltip?.agent.kind === "slot" ? "pointer" : "default" }
		},
		tooltipEl: /* @__PURE__ */ jsxs(Fragment, { children: [
			tooltipEl,
			threadViewEl,
			spawnEl
		] })
	};
}
// src/pages/scenes/OfficeScene.tsx
var OFFICE_THEME$1 = {
	active: "Grinding PRs",
	idle: "Waiting for CR approval"
};
var W$6 = 440;
var H$6 = 300;
var S$7 = SCENE_SCALE;
var DOOR$2 = {
	x: 0,
	y: 100,
	w: 12,
	h: 50
};
var MAX_DESKS$1 = 8;
var DESK_POSITIONS$1 = [
	{
		x: 40,
		y: 120
	},
	{
		x: 120,
		y: 120
	},
	{
		x: 200,
		y: 120
	},
	{
		x: 280,
		y: 120
	},
	{
		x: 40,
		y: 200
	},
	{
		x: 120,
		y: 200
	},
	{
		x: 200,
		y: 200
	},
	{
		x: 280,
		y: 200
	}
];
var AGENT_COLORS$2 = [
	"#e74c3c",
	"#3498db",
	"#f39c12",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#2ecc71",
	"#e84393"
];
var DESK_ACCENTS$1 = [
	"#c0392b",
	"#2980b9",
	"#d35400",
	"#8e44ad",
	"#16a085",
	"#f39c12",
	"#27ae60",
	"#e84393"
];
var DESK_ITEM_SETS$1 = [
	[{
		kind: "mug",
		ox: 2,
		oy: 12
	}, {
		kind: "photo",
		ox: 22,
		oy: 6
	}],
	[{
		kind: "plant",
		ox: 1,
		oy: 8
	}, {
		kind: "notebook",
		ox: 20,
		oy: 13
	}],
	[{
		kind: "headphones",
		ox: 23,
		oy: 10
	}, {
		kind: "mug",
		ox: 1,
		oy: 13
	}],
	[{
		kind: "photo",
		ox: 1,
		oy: 6
	}, {
		kind: "plant",
		ox: 24,
		oy: 8
	}],
	[{
		kind: "notebook",
		ox: 2,
		oy: 13
	}, {
		kind: "headphones",
		ox: 22,
		oy: 10
	}],
	[{
		kind: "mug",
		ox: 23,
		oy: 12
	}, {
		kind: "photo",
		ox: 1,
		oy: 6
	}],
	[{
		kind: "plant",
		ox: 24,
		oy: 8
	}, {
		kind: "notebook",
		ox: 2,
		oy: 13
	}],
	[{
		kind: "headphones",
		ox: 1,
		oy: 10
	}, {
		kind: "mug",
		ox: 23,
		oy: 12
	}]
];
var COL$4 = {
	floor: "#2a1f14",
	floorAlt: "#33261a",
	wall: "#1a1209",
	wallTrim: "#4a3520",
	desk: "#5c4033",
	deskTop: "#7a5c47",
	monitor: "#333",
	screen: "#0a2a0a",
	screenText: "#33ff33",
	screenCursor: "#33ff33",
	screenOff: "#1a1a1a",
	cubicleWall: "#4a4a4a",
	cubicleTop: "#5a5a5a",
	plant: "#2d8a4e",
	plantPot: "#8b4513",
	plantLight: "#3cb371",
	chair: "#3a2a1a",
	coffee: "#6b4226",
	coffeeMug: "#ddd",
	whiteboard: "#e8e8e0",
	whiteboardFrame: "#888",
	lightFixture: "#555",
	rug: "#3a1a2a",
	rugPattern: "#4a2a3a",
	window: "#1a3050",
	windowFrame: "#666",
	sky: "#2a4a6a",
	star: "#fff",
	door: "#6b4226",
	doorFrame: "#4a3520",
	doorKnob: "#d4a017",
	mug: "#e74c3c",
	photo: "#f1c40f",
	notebook: "#3498db",
	headphones: "#555"
};
var CHAT_LINES$1 = [
	["New audiobook?", "Adding to lib!"],
	["Ch.5 has a bug", "Narrating fix!"],
	["Deploy ready?", "Ship it!"],
	["Review the PR?", "LGTM!"],
	["Metadata sync?", "Ingested!"],
	["Latency up...", "Scaling now!"],
	["Coffee break?", "Always!"],
	["A/B test done", "+12% listens!"]
];
var COFFEE_MACHINE$1 = {
	x: 390,
	y: 240
};
var WHITEBOARD$1 = {
	x: 350,
	y: 14,
	w: 60,
	h: 36
};
var CLOCK_POS$1 = {
	x: 170,
	y: 22
};
var WINDOW_POS$1 = {
	x: 60,
	y: 10,
	w: 50,
	h: 40
};
var PLANTS$1 = [
	{
		x: 15,
		y: 98
	},
	{
		x: 95,
		y: 98
	},
	{
		x: 175,
		y: 98
	},
	{
		x: 255,
		y: 98
	},
	{
		x: 335,
		y: 98
	},
	{
		x: 15,
		y: 260
	},
	{
		x: 200,
		y: 260
	},
	{
		x: 420,
		y: 260
	}
];
function buildDesks$1() {
	return DESK_POSITIONS$1.map((pos, i) => ({
		x: pos.x,
		y: pos.y,
		occupied: false,
		accent: DESK_ACCENTS$1[i % DESK_ACCENTS$1.length],
		items: DESK_ITEM_SETS$1[i % DESK_ITEM_SETS$1.length]
	}));
}
function OfficeScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const agentsRef = useRef([]);
	const desksRef = useRef(buildDesks$1());
	const collabRef = useRef(null);
	const speechRef = useRef({
		a: "",
		b: ""
	});
	const particlesRef = useRef([]);
	const kanbanRef = useRef([]);
	const [_agentCount, setAgentCount] = useState(0);
	const visibleRef = useRef(visible);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, agentsRef, W$6, H$6, OFFICE_THEME$1, 10, void 0, agents);
	useVisibleSync(visibleRef, visible);
	useEffect(() => {
		const capped = agents.slice(0, MAX_DESKS$1);
		const existing = agentsRef.current;
		const desks = desksRef.current;
		desks.forEach((dk) => dk.occupied = false);
		const newAgents = [];
		capped.forEach((src) => {
			const prev = existing.find((a) => a.id === src.id);
			if (prev) {
				prev.name = src.name;
				prev.detail = src.detail;
				prev.running = src.running;
				if ((src.lastMessage || "") !== prev.lastMessage) {
					prev.lastMessage = src.lastMessage || "";
					prev.msgAt = Date.now();
				}
				prev.status = src.running ? "working" : "idle";
				if (prev.deskIdx >= 0) desks[prev.deskIdx].occupied = true;
				newAgents.push(prev);
			} else {
				const deskIdx = desks.findIndex((dk) => !dk.occupied);
				if (deskIdx < 0) return;
				desks[deskIdx].occupied = true;
				const dk = desks[deskIdx];
				const known = isKnownAgent("office", src.id);
				newAgents.push({
					id: src.id,
					name: src.name,
					label: src.label,
					kind: src.kind,
					x: known ? dk.x + 10 : DOOR$2.x + 6,
					y: known ? dk.y + 20 : DOOR$2.y + 25,
					tx: dk.x + 10,
					ty: dk.y + 20,
					deskIdx,
					color: AGENT_COLORS$2[deskIdx % AGENT_COLORS$2.length],
					status: src.running ? "working" : "idle",
					detail: src.detail,
					dir: 1,
					activity: known ? "desk" : "entering",
					enterProgress: known ? 1 : 0,
					running: src.running,
					actTimer: 0,
					lastMessage: src.lastMessage || "",
					msgAt: 0
				});
				markAgentsKnown("office", [src.id]);
			}
		});
		kanbanRef.current = capped.filter((s) => s.running).map((s) => s.name).slice(0, 4);
		if (kanbanRef.current.length === 0) kanbanRef.current = [i18nT("pages.scenes.officeScene.no_tasks")];
		agentsRef.current = newAgents;
		setAgentCount(newAgents.length);
		pruneAgents("office", newAgents.map((a) => a.id));
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W$6, H$6, S$7);
		const spawnParticle = () => {
			if (particlesRef.current.length < 15) particlesRef.current.push({
				x: Math.random() * W$6,
				y: 85 + Math.random() * 210,
				vx: (Math.random() - .5) * .08,
				vy: -.04 - Math.random() * .04,
				life: 0,
				maxLife: 250 + Math.random() * 300
			});
		};
		const drawWindow = (t) => {
			const { x, y, w, h } = WINDOW_POS$1;
			d(x - 1, y - 1, w + 2, h + 2, COL$4.windowFrame);
			d(x, y, w, h, COL$4.sky);
			for (let i = 0; i < 6; i++) {
				const sx = x + 3 + (i * 11 + t * .008) % (w - 6);
				const sy = y + 2 + i * 7 % (h - 8);
				if (Math.sin(t * .04 + i * 2.5) > .3) d(sx, sy, 1, 1, COL$4.star);
			}
			d(x + w - 12, y + 5, 6, 6, "#dde");
			d(x + w - 11, y + 4, 4, 4, COL$4.sky);
			d(x + w / 2, y, 1, h, COL$4.windowFrame);
			d(x, y + h / 2, w, 1, COL$4.windowFrame);
			X.fillStyle = "rgba(100,150,200,0.025)";
			X.fillRect((x + 5) * S$7, 82 * S$7, (w - 10) * S$7, 25 * S$7);
		};
		const drawDoor = (t) => {
			const { x, y, w, h } = DOOR$2;
			d(x, y, w, h, COL$4.doorFrame);
			d(x + 1, y + 1, w - 2, h - 2, COL$4.door);
			d(x + w - 3, y + h / 2, 1.5, 1.5, COL$4.doorKnob);
			T.fillStyle = "#999";
			T.font = sceneFont("label");
			T.fillText("IN", (x + 2) * S$7, (y - 2) * S$7);
			if (agentsRef.current.some((a) => a.activity === "entering") && t >> 3 & 1) {
				X.fillStyle = "rgba(255,200,50,0.08)";
				X.fillRect(x * S$7, y * S$7, w * S$7, h * S$7);
			}
		};
		const drawCeilingLights = (t) => {
			[
				70,
				170,
				270,
				370
			].forEach((lx, i) => {
				d(lx - 4, 80, 8, 2, COL$4.lightFixture);
				d(lx - 2, 78, 4, 2, COL$4.lightFixture);
				const flicker = 1 + Math.sin(t * .025 + i * 1.3) * .12;
				const grad = X.createRadialGradient(lx * S$7, 82 * S$7, 0, lx * S$7, 82 * S$7, 45 * S$7 * flicker);
				grad.addColorStop(0, "rgba(255,220,150,0.07)");
				grad.addColorStop(1, "rgba(255,220,150,0)");
				X.fillStyle = grad;
				X.fillRect((lx - 45) * S$7, 80 * S$7, 90 * S$7, 50 * S$7);
			});
		};
		const drawClock = (t) => {
			const { x, y } = CLOCK_POS$1;
			const now = /* @__PURE__ */ new Date();
			const hr = now.getHours(), mn = now.getMinutes();
			d(x - 8, y - 8, 16, 16, "#444");
			d(x - 7, y - 7, 14, 14, "#222");
			for (let i = 0; i < 12; i++) {
				const a = i / 12 * Math.PI * 2 - Math.PI / 2;
				d(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 1, 1, "#666");
			}
			const ha = (hr % 12 / 12 + mn / 720) * Math.PI * 2 - Math.PI / 2;
			const ma = mn / 60 * Math.PI * 2 - Math.PI / 2;
			X.strokeStyle = "#f90";
			X.lineWidth = S$7;
			X.beginPath();
			X.moveTo(x * S$7, y * S$7);
			X.lineTo((x + Math.cos(ha) * 3.5) * S$7, (y + Math.sin(ha) * 3.5) * S$7);
			X.stroke();
			X.strokeStyle = "#ccc";
			X.lineWidth = S$7;
			X.beginPath();
			X.moveTo(x * S$7, y * S$7);
			X.lineTo((x + Math.cos(ma) * 5) * S$7, (y + Math.sin(ma) * 5) * S$7);
			X.stroke();
			if (t >> 4 & 1) d(x - .5, y - .5, 1, 1, "#f00");
		};
		const drawWhiteboard = () => {
			const { x, y, w, h } = WHITEBOARD$1;
			d(x - 1, y - 1, w + 2, h + 2, COL$4.whiteboardFrame);
			d(x, y, w, h, COL$4.whiteboard);
			const cols = [
				i18nT("pages.scenes.officeScene.to_do"),
				i18nT("pages.scenes.officeScene.active"),
				i18nT("pages.scenes.officeScene.done")
			];
			const cw = w / 3;
			cols.forEach((label, i) => {
				if (i > 0) d(x + cw * i, y, .5, h, "#bbb");
				T.fillStyle = "#888";
				T.font = sceneFont("label");
				T.fillText(label, (x + cw * i + 1) * S$7, (y + 4) * S$7);
			});
			const colors = [
				"#ffe066",
				"#ff9999",
				"#99ccff",
				"#99ff99"
			];
			kanbanRef.current.forEach((task, i) => {
				const col = Math.min(i, 2);
				const row = i < 1 ? 0 : i < 3 ? i - 1 : 0;
				const nx = x + cw * col + 1, ny = y + 7 + row * 9;
				d(nx, ny, cw - 2, 7, colors[i % colors.length]);
				T.fillStyle = "#333";
				T.font = sceneFont("detail");
				T.fillText(sliceCodePoints(task, 0, 8), (nx + 1) * S$7, (ny + 4.5) * S$7);
			});
		};
		const drawCoffeeMachine = (t) => {
			const { x, y } = COFFEE_MACHINE$1;
			d(x, y, 12, 16, "#555");
			d(x + 1, y + 1, 10, 6, "#333");
			d(x + 3, y + 2, 6, 4, COL$4.coffee);
			if (t >> 5 & 1) d(x + 5, y + 8, 2, 1, COL$4.coffee);
			d(x + 3, y + 10, 6, 5, COL$4.coffeeMug);
			d(x + 2, y + 11, 1, 3, COL$4.coffeeMug);
			d(x + 4, y + 11, 4, 3, COL$4.coffee);
			for (let i = 0; i < 3; i++) {
				const sy = y + 8 - i * 3 - t * .04 % 3;
				const sx = x + 4 + Math.sin(t * .025 + i * 2) * 1.5;
				if (sy > y - 2) {
					X.fillStyle = `rgba(255,255,255,${.12 - i * .03})`;
					X.fillRect(sx * S$7, sy * S$7, 2 * S$7, 1 * S$7);
				}
			}
		};
		const drawPlant = (px, py, t) => {
			d(px + 2, py + 8, 4, 6, COL$4.plantPot);
			d(px + 1, py + 8, 6, 1, COL$4.plantPot);
			for (let i = 0; i < 3; i++) {
				const sw = Math.sin(t * .012 + px + i) | 0;
				d(px + 3 + sw, py - i * 3 + 6, 2, 4, COL$4.plant);
				d(px + 1 + sw, py - i * 3 + 5, 2, 3, COL$4.plantLight);
				d(px + 5 + sw, py - i * 3 + 5, 2, 3, COL$4.plantLight);
			}
		};
		const drawRug = () => {
			X.fillStyle = COL$4.rug;
			X.beginPath();
			X.ellipse(220 * S$7, 175 * S$7, 40 * S$7, 14 * S$7, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL$4.rugPattern;
			X.beginPath();
			X.ellipse(220 * S$7, 175 * S$7, 34 * S$7, 10 * S$7, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL$4.rug;
			X.beginPath();
			X.ellipse(220 * S$7, 175 * S$7, 28 * S$7, 7 * S$7, 0, 0, Math.PI * 2);
			X.fill();
		};
		const drawBookshelves = () => {
			const bc = [
				"#e74c3c",
				"#f90",
				"#3498db",
				"#2ecc71",
				"#9b59b6",
				"#f39c12",
				"#1abc9c"
			];
			[{
				sx: 230,
				sy: 50
			}, {
				sx: 290,
				sy: 50
			}].forEach(({ sx, sy }, si) => {
				d(sx, sy, 28, 2, "#5c4033");
				d(sx, sy - 16, 28, 2, "#5c4033");
				let bxp = sx + 1;
				for (let b = 0; b < 4; b++) {
					const bh = 7 + b * 3 % 5;
					d(bxp, sy - bh, 5, bh, bc[(b + si * 3) % bc.length]);
					bxp += 6;
				}
				bxp = sx + 1;
				for (let b = 0; b < 3; b++) {
					const bh = 5 + b * 4 % 4;
					d(bxp, sy - 16 - bh, 6, bh, bc[(b + si * 2 + 2) % bc.length]);
					bxp += 8;
				}
			});
		};
		const drawLogo = () => {
			T.fillStyle = "#f90";
			T.font = sceneFont("title", "bold");
			T.fillText(i18nT("pages.scenes.officeScene.agent_office"), (W$6 / 2 - 26) * S$7, 32 * S$7);
			d(W$6 / 2 - 28, 34, 56, 1, "#f90");
			T.fillStyle = "#c70";
			T.font = sceneFont("detail");
			T.fillText(i18nT("pages.scenes.officeScene.headquarters"), (W$6 / 2 - 16) * S$7, 40 * S$7);
		};
		const drawDesk = (desk, t) => {
			const { x: dx, y: dy, accent, items, occupied } = desk;
			d(dx - 2, dy - 2, 1, 32, COL$4.cubicleWall);
			d(dx - 2, dy - 2, 34, 1, COL$4.cubicleWall);
			d(dx + 31, dy - 2, 1, 32, COL$4.cubicleWall);
			d(dx - 2, dy - 3, 35, 1, COL$4.cubicleTop);
			d(dx, dy + 16, 28, 3, COL$4.deskTop);
			d(dx, dy + 15, 28, 1, accent);
			d(dx + 1, dy + 14, 26, 1, COL$4.desk);
			d(dx + 2, dy + 19, 2, 10, COL$4.desk);
			d(dx + 24, dy + 19, 2, 10, COL$4.desk);
			d(dx + 9, dy + 4, 10, 10, COL$4.monitor);
			d(dx + 10, dy + 5, 8, 8, occupied ? COL$4.screen : COL$4.screenOff);
			d(dx + 13, dy + 14, 2, 1, COL$4.monitor);
			if (occupied) {
				for (let i = 0; i < 4; i++) {
					const lw = 2 + (t + i * 7) % 5;
					d(dx + 11, dy + 6 + i * 1.8, lw, .8, COL$4.screenText);
				}
				if (t >> 3 & 1) d(dx + 11 + (t >> 2) % 5, dy + 6 + (t >> 4) % 4 * 1.8, 1, 1, COL$4.screenCursor);
				X.fillStyle = "rgba(50,255,50,0.025)";
				X.fillRect((dx + 8) * S$7, (dy + 13) * S$7, 12 * S$7, 4 * S$7);
			} else if (t >> 5 & 1) d(dx + 14, dy + 9, 1, 1, "#333");
			d(dx + 10, dy + 22, 8, 3, COL$4.chair);
			d(dx + 10, dy + 25, 2, 4, COL$4.chair);
			d(dx + 16, dy + 25, 2, 4, COL$4.chair);
			d(dx + 9, dy + 19, 1, 6, COL$4.chair);
			items.forEach((item) => {
				const ix = dx + item.ox, iy = dy + item.oy;
				switch (item.kind) {
					case "mug":
						d(ix, iy, 3, 3, COL$4.mug);
						d(ix + 3, iy + .5, 1, 2, COL$4.mug);
						if (occupied && t >> 4 & 1) {
							X.fillStyle = "rgba(255,255,255,0.1)";
							X.fillRect((ix + 1) * S$7, (iy - 1.5) * S$7, S$7, S$7);
						}
						break;
					case "photo":
						d(ix, iy, 4, 5, "#ddd");
						d(ix + .5, iy + .5, 3, 3.5, accent);
						break;
					case "plant":
						d(ix + 1, iy + 3, 2, 3, COL$4.plantPot);
						d(ix, iy + 1, 4, 2, COL$4.plant);
						d(ix + 1, iy, 2, 2, COL$4.plantLight);
						break;
					case "notebook":
						d(ix, iy, 5, 3, COL$4.notebook);
						d(ix + .5, iy + .5, 4, .5, "#fff");
						break;
					case "headphones":
						d(ix, iy, 4, 1, COL$4.headphones);
						d(ix, iy + 1, 1, 2, COL$4.headphones);
						d(ix + 3, iy + 1, 1, 2, COL$4.headphones);
				}
			});
			if (!occupied) drawLabel(T, "empty", (dx + 15) * S$7, (dy + 1) * S$7, {
				role: "label",
				color: "#555",
				bgColor: "#333",
				align: "center",
				scale: S$7
			});
		};
		const drawAgent = (a, t) => {
			const bx = a.x | 0, by = a.y | 0;
			const mv = Math.abs(a.x - a.tx) > 1.5 || Math.abs(a.y - a.ty) > 1.5;
			const bob = mv ? Math.sin(t * .12 + a.x) | 0 : 0;
			X.fillStyle = "rgba(0,0,0,0.12)";
			X.fillRect((bx + 1) * S$7, (by + 10) * S$7, 6 * S$7, 2 * S$7);
			d(bx, by + bob, 8, 8, a.color);
			d(bx + 1, by - 6 + bob, 6, 6, "#fdd");
			const hairColor = [
				"#333",
				"#8b4513",
				"#f90",
				"#222",
				"#654321"
			][AGENT_COLORS$2.indexOf(a.color) % 5] || "#333";
			d(bx, by - 6 + bob, 1, 4, hairColor);
			d(bx + 7, by - 6 + bob, 1, 4, hairColor);
			d(bx + 1, by - 7 + bob, 6, 1, hairColor);
			const blink = t % 120 < 3;
			const ex = a.dir > 0 ? 2 : 1;
			if (!blink) {
				d(bx + ex + 1, by - 4 + bob, 1, 1, "#333");
				d(bx + ex + 3, by - 4 + bob, 1, 1, "#333");
			} else {
				d(bx + ex + 1, by - 3 + bob, 1, .5, "#333");
				d(bx + ex + 3, by - 3 + bob, 1, .5, "#333");
			}
			if (a.running) d(bx + ex + 1.5, by - 2 + bob, 2, .5, "#c88");
			const st = t >> 3 & 1;
			if (mv) {
				d(bx + 1 + (st ? 2 : 0), by + 8 + bob, 2, 3, a.color);
				d(bx + 5 - (st ? 2 : 0), by + 8 + bob, 2, 3, a.color);
			} else {
				d(bx + 1, by + 8, 2, 3, a.color);
				d(bx + 5, by + 8, 2, 3, a.color);
			}
			if (!mv && a.activity === "desk" && a.running) {
				const armBob = t >> 2 & 1;
				d(bx - 1, by + 2 + bob + armBob, 1, 3, a.color);
				d(bx + 8, by + 2 + bob + (1 - armBob), 1, 3, a.color);
			}
			if (a.activity === "coffee") d(bx + (a.dir > 0 ? 9 : -3), by + 3 + bob, 2, 3, COL$4.coffeeMug);
			const kindEmoji = a.kind === "cron" ? "⏰" : a.kind === "spawn" ? "🔀" : "💬";
			X.font = 2 * S$7 + "px monospace";
			X.fillText(kindEmoji, (bx + 8) * S$7, (by - 5 + bob) * S$7);
			drawLabel(T, a.running ? "active" : "idle", (bx + 4) * S$7, (by - 10 + bob) * S$7, {
				role: "status",
				color: a.running ? "#4f4" : "#888",
				bgColor: "rgba(0,0,0,0.5)",
				align: "center",
				scale: S$7
			});
			if (a.lastMessage && Date.now() - a.msgAt < 7e3) {
				const msgAge = Date.now() - a.msgAt;
				const msgAlpha = msgAge > 6e3 ? (SPEECH_BUBBLE_MS - msgAge) / 1e3 : 1;
				drawSpeechBubble(T, a.lastMessage, (bx + 4) * S$7, (by - 14 + bob) * S$7, {
					scale: S$7,
					alpha: msgAlpha
				});
			}
			const nameLines = drawLabel(T, a.name, (bx + 4) * S$7, (by + 14) * S$7, {
				role: "name",
				weight: "bold",
				color: "#fff",
				align: "center",
				scale: S$7,
				maxWidth: 64 * S$7
			});
			if (a.detail) drawLabel(T, a.detail, (bx - 2) * S$7, (by + 18) * S$7 + (nameLines - 1) * sceneLineHeight("name"), {
				role: "detail",
				color: "#999",
				scale: S$7
			});
			if (a.deskIdx >= 0 && a.activity !== "entering") {
				const dk = desksRef.current[a.deskIdx];
				drawLabel(T, sliceCodePoints(a.name, 0, 8), (dk.x + 15) * S$7, (dk.y + 1) * S$7, {
					role: "label",
					color: "#fff",
					bgColor: a.color,
					align: "center",
					scale: S$7
				});
			}
			if (collabRef.current && (collabRef.current[0] === a || collabRef.current[1] === a)) d(bx + 2, by - 16 + bob, 3, 2, "#f90");
		};
		const drawSpeech = (a, text, side) => {
			if (!text) return;
			const bx = a.x | 0, by = a.y | 0;
			const bob = Math.abs(a.x - a.tx) > 1.5 ? Math.sin(tickRef.current * .12 + a.x) | 0 : 0;
			const tw = text.length * 3.5 + 4, bh = 8;
			const sx = side < 0 ? bx - tw - 2 : bx + 10, sy = by - 26 + bob;
			d(sx, sy, tw, bh, "#fff");
			d(sx - 1, sy + 1, tw + 2, 6, "#fff");
			d(side < 0 ? sx + tw : sx, sy + bh, 2, 2, "#fff");
			T.fillStyle = "#222";
			T.font = sceneFont("spell");
			T.fillText(text, (sx + 2) * S$7, (sy + 5.5) * S$7);
		};
		const drawParticles = () => {
			particlesRef.current.forEach((p) => {
				const alpha = Math.max(0, .25 * (1 - p.life / p.maxLife));
				X.fillStyle = `rgba(255,240,200,${alpha})`;
				X.fillRect(p.x * S$7, p.y * S$7, S$7, S$7);
			});
		};
		const drawAgentCounter = () => {
			const count = agentsRef.current.length;
			const total = MAX_DESKS$1;
			T.fillStyle = "#999";
			T.font = sceneFont("status");
			T.fillText(`${count}/${total} agents`, 4 * S$7, 296 * S$7);
		};
		const update = (t) => {
			const agents = agentsRef.current;
			particlesRef.current.forEach((p) => {
				p.x += p.vx;
				p.y += p.vy;
				p.vx += (Math.random() - .5) * .015;
				p.life++;
			});
			particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife && p.y > 70);
			agents.forEach((a) => {
				const ddx = a.tx - a.x, ddy = a.ty - a.y;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy);
				if (dist > 1.5) {
					a.x += ddx / dist * .65;
					a.y += ddy / dist * .65;
					a.dir = ddx > 0 ? 1 : -1;
				} else {
					a.x = a.tx;
					a.y = a.ty;
					if (a.activity === "entering") a.activity = "desk";
					if (a.activity === "collab" || a.activity === "coffee" || a.activity === "whiteboard") {
						a.actTimer++;
						const limit = a.activity === "collab" ? 600 : 400;
						if (a.actTimer > limit) {
							const dk = desksRef.current[a.deskIdx];
							a.tx = dk.x + 10;
							a.ty = dk.y + 20;
							a.activity = "desk";
							a.actTimer = 0;
							if (collabRef.current?.includes(a)) {
								collabRef.current.forEach((c) => {
									const ck = desksRef.current[c.deskIdx];
									c.tx = ck.x + 10;
									c.ty = ck.y + 20;
									c.activity = "desk";
									c.actTimer = 0;
								});
								collabRef.current = null;
								speechRef.current = {
									a: "",
									b: ""
								};
							}
						}
					}
				}
			});
			if (collabRef.current) {
				const [ca, cb] = collabRef.current;
				const bothArrived = Math.abs(ca.x - ca.tx) < 2 && Math.abs(ca.y - ca.ty) < 2 && Math.abs(cb.x - cb.tx) < 2 && Math.abs(cb.y - cb.ty) < 2;
				const minTimer = Math.min(ca.actTimer, cb.actTimer);
				if (bothArrived && minTimer === 60) {
					const lines = CHAT_LINES$1[Math.random() * CHAT_LINES$1.length | 0];
					speechRef.current = {
						a: lines[0],
						b: lines[1]
					};
				}
			}
			const deskAgents = agents.filter((a) => a.activity === "desk");
			if (t % 1800 === 0 && !collabRef.current && deskAgents.length >= 2 && Math.random() < .3) {
				const i = Math.random() * deskAgents.length | 0;
				const j = (i + 1 + (Math.random() * (deskAgents.length - 1) | 0)) % deskAgents.length;
				const a = deskAgents[i], b = deskAgents[j];
				a.tx = 210;
				a.ty = 170;
				b.tx = 230;
				b.ty = 170;
				a.activity = "collab";
				b.activity = "collab";
				a.actTimer = 0;
				b.actTimer = 0;
				collabRef.current = [a, b];
				speechRef.current = {
					a: "",
					b: ""
				};
			}
			if (t % 2400 === 600 && !collabRef.current && deskAgents.length > 0 && Math.random() < .25) {
				const a = deskAgents[Math.random() * deskAgents.length | 0];
				if (a.activity === "desk") {
					a.activity = "coffee";
					a.actTimer = 0;
					a.tx = COFFEE_MACHINE$1.x - 15;
					a.ty = COFFEE_MACHINE$1.y + 2;
				}
			}
			if (t % 3e3 === 900 && !collabRef.current && deskAgents.length > 0 && Math.random() < .2) {
				const a = deskAgents[Math.random() * deskAgents.length | 0];
				if (a.activity === "desk") {
					a.activity = "whiteboard";
					a.actTimer = 0;
					a.tx = WHITEBOARD$1.x + 20;
					a.ty = WHITEBOARD$1.y + 50;
				}
			}
			if (t % 6 === 0) spawnParticle();
		};
		const draw = (t) => {
			const agents = agentsRef.current;
			T.clearRect(0, 0, W$6 * S$7, H$6 * S$7);
			d(0, 0, W$6, H$6, COL$4.wall);
			for (let i = 0; i < W$6; i += 16) for (let j = 80; j < H$6; j += 16) {
				X.fillStyle = i / 16 + j / 16 & 1 ? COL$4.floorAlt : COL$4.floor;
				X.fillRect(i * S$7, j * S$7, 16 * S$7, 16 * S$7);
			}
			d(0, 78, W$6, 3, COL$4.wallTrim);
			drawWindow(t);
			drawLogo();
			drawBookshelves();
			drawWhiteboard();
			drawClock(t);
			drawDoor(t);
			drawCeilingLights(t);
			drawRug();
			desksRef.current.forEach((desk) => drawDesk(desk, t));
			drawCoffeeMachine(t);
			PLANTS$1.forEach((p) => drawPlant(p.x, p.y, t));
			drawParticles();
			[...agents].sort((a, b) => a.y - b.y).forEach((a) => drawAgent(a, t));
			if (collabRef.current) {
				const [a, b] = collabRef.current;
				X.strokeStyle = "#f90";
				X.lineWidth = S$7;
				X.setLineDash([4 * S$7, 4 * S$7]);
				X.beginPath();
				X.moveTo((a.x + 4) * S$7, (a.y + 4) * S$7);
				X.lineTo((b.x + 4) * S$7, (b.y + 4) * S$7);
				X.stroke();
				X.setLineDash([]);
				drawSpeech(a, speechRef.current.a, a.x < b.x ? -1 : 1);
				drawSpeech(b, speechRef.current.b, b.x < a.x ? -1 : 1);
			}
			drawAgentCounter();
		};
		canvasRef.current.onclick = (e) => {
			const mx = e.offsetX / S$7, my = e.offsetY / S$7;
			agentsRef.current.forEach((a) => {
				if (mx > a.x - 4 && mx < a.x + 12 && my > a.y - 14 && my < a.y + 14) {
					a.running = !a.running;
					a.status = a.running ? "working" : "idle";
				}
			});
		};
		const cancelLoop = runSceneLoop(visibleRef, tickRef, update, draw);
		return () => {
			cancelLoop();
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$6, H$6),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.officeScene.office_scene"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.officeScene.office_scene_labels"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/PandaOfficeScene.tsx
var OFFICE_THEME = {
	active: "Grinding PRs",
	idle: "Waiting for CR approval"
};
var PANDA_WHITE = "#f5f5f5";
var PANDA_BLACK = "#222";
var PANDA_PINK = "#f4a5b0";
var W$5 = 440;
var H$5 = 300;
var S$6 = 3;
var DOOR$1 = {
	x: 0,
	y: 100,
	w: 12,
	h: 50
};
var MAX_DESKS = 8;
var DESK_POSITIONS = [
	{
		x: 40,
		y: 120
	},
	{
		x: 120,
		y: 120
	},
	{
		x: 200,
		y: 120
	},
	{
		x: 280,
		y: 120
	},
	{
		x: 40,
		y: 200
	},
	{
		x: 120,
		y: 200
	},
	{
		x: 200,
		y: 200
	},
	{
		x: 280,
		y: 200
	}
];
var AGENT_COLORS$1 = [
	"#e74c3c",
	"#3498db",
	"#f39c12",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#2ecc71",
	"#e84393"
];
var DESK_ACCENTS = [
	"#c0392b",
	"#2980b9",
	"#d35400",
	"#8e44ad",
	"#16a085",
	"#f39c12",
	"#27ae60",
	"#e84393"
];
var DESK_ITEM_SETS = [
	[{
		kind: "mug",
		ox: 2,
		oy: 12
	}, {
		kind: "photo",
		ox: 22,
		oy: 6
	}],
	[{
		kind: "plant",
		ox: 1,
		oy: 8
	}, {
		kind: "notebook",
		ox: 20,
		oy: 13
	}],
	[{
		kind: "headphones",
		ox: 23,
		oy: 10
	}, {
		kind: "mug",
		ox: 1,
		oy: 13
	}],
	[{
		kind: "photo",
		ox: 1,
		oy: 6
	}, {
		kind: "plant",
		ox: 24,
		oy: 8
	}],
	[{
		kind: "notebook",
		ox: 2,
		oy: 13
	}, {
		kind: "headphones",
		ox: 22,
		oy: 10
	}],
	[{
		kind: "mug",
		ox: 23,
		oy: 12
	}, {
		kind: "photo",
		ox: 1,
		oy: 6
	}],
	[{
		kind: "plant",
		ox: 24,
		oy: 8
	}, {
		kind: "notebook",
		ox: 2,
		oy: 13
	}],
	[{
		kind: "headphones",
		ox: 1,
		oy: 10
	}, {
		kind: "mug",
		ox: 23,
		oy: 12
	}]
];
var COL$3 = {
	floor: "#2a3a1a",
	floorAlt: "#1e2e14",
	wall: "#0d1a08",
	wallTrim: "#3a5a2a",
	desk: "#5c4033",
	deskTop: "#7a5c47",
	monitor: "#333",
	screen: "#0a2a0a",
	screenText: "#33ff33",
	screenCursor: "#33ff33",
	screenOff: "#1a1a1a",
	cubicleWall: "#3a4a2a",
	cubicleTop: "#4a5a3a",
	plant: "#2d8a4e",
	plantPot: "#8b4513",
	plantLight: "#3cb371",
	chair: "#3a2a1a",
	coffee: "#6b4226",
	coffeeMug: "#ddd",
	whiteboard: "#e8e8e0",
	whiteboardFrame: "#888",
	lightFixture: "#555",
	rug: "#2a3a1a",
	rugPattern: "#354a25",
	window: "#1a3050",
	windowFrame: "#666",
	sky: "#2a4a6a",
	star: "#fff",
	door: "#6b4226",
	doorFrame: "#4a3520",
	doorKnob: "#d4a017",
	mug: "#e74c3c",
	photo: "#f1c40f",
	notebook: "#3498db",
	headphones: "#555",
	bamboo: "#6b8e23",
	bambooLight: "#8fbc5f",
	bambooDark: "#4a6a14",
	bambooLeaf: "#3a7a2a",
	bambooLeafLight: "#5a9a4a",
	bark: "#5a4a2a",
	barkDark: "#3a2a1a",
	chess: "#ddd",
	chessDark: "#333",
	chessBoard: "#8b6914",
	pullBar: "#666",
	pullBarDark: "#444"
};
var CHAT_LINES = [
	["Token expired?", "Refreshing!"],
	["CR approved!", "Ship it! 🐼"],
	["Deploy ready?", "Bamboo break?"],
	["Review the PR?", "LGTM!"],
	["Aztec timeout", "Scaling now!"],
	["Latency up...", "Checking AAO"],
	["Chess later?", "Always!"],
	["Pull-ups?", "After deploy!"]
];
var COFFEE_MACHINE = {
	x: 390,
	y: 240
};
var WHITEBOARD = {
	x: 350,
	y: 14,
	w: 60,
	h: 36
};
var CLOCK_POS = {
	x: 170,
	y: 22
};
var WINDOW_POS = {
	x: 60,
	y: 10,
	w: 50,
	h: 40
};
var PLANTS = [
	{
		x: 15,
		y: 98
	},
	{
		x: 95,
		y: 98
	},
	{
		x: 175,
		y: 98
	},
	{
		x: 255,
		y: 98
	},
	{
		x: 335,
		y: 98
	},
	{
		x: 15,
		y: 260
	},
	{
		x: 200,
		y: 260
	},
	{
		x: 420,
		y: 260
	}
];
var BAMBOO_STALKS = [
	{
		x: 5,
		y: 30,
		h: 55
	},
	{
		x: 20,
		y: 25,
		h: 60
	},
	{
		x: 415,
		y: 28,
		h: 57
	},
	{
		x: 430,
		y: 22,
		h: 63
	},
	{
		x: 100,
		y: 35,
		h: 48
	},
	{
		x: 340,
		y: 32,
		h: 52
	},
	{
		x: 155,
		y: 38,
		h: 45
	},
	{
		x: 380,
		y: 30,
		h: 55
	}
];
var PULLUP_BAR = {
	x: 370,
	y: 170
};
var CHESS_TABLE = {
	x: 340,
	y: 230
};
function buildDesks() {
	return DESK_POSITIONS.map((pos, i) => ({
		x: pos.x,
		y: pos.y,
		occupied: false,
		accent: DESK_ACCENTS[i % DESK_ACCENTS.length],
		items: DESK_ITEM_SETS[i % DESK_ITEM_SETS.length]
	}));
}
function PandaOfficeScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const agentsRef = useRef([]);
	const desksRef = useRef(buildDesks());
	const collabRef = useRef(null);
	const speechRef = useRef({
		a: "",
		b: ""
	});
	const particlesRef = useRef([]);
	const kanbanRef = useRef([]);
	const [_agentCount, setAgentCount] = useState(0);
	const visibleRef = useRef(visible);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, agentsRef, W$5, H$5, OFFICE_THEME, 10, void 0, agents);
	useVisibleSync(visibleRef, visible);
	useEffect(() => {
		const capped = agents.slice(0, MAX_DESKS);
		const existing = agentsRef.current;
		const desks = desksRef.current;
		desks.forEach((dk) => dk.occupied = false);
		const newAgents = [];
		const newSrcs = [];
		capped.forEach((src) => {
			const prev = existing.find((a) => a.id === src.id);
			if (prev) {
				prev.name = src.name;
				prev.label = src.label;
				prev.detail = src.detail;
				prev.running = src.running;
				prev.kind = src.kind;
				if ((src.lastMessage || "") !== prev.lastMessage) {
					prev.lastMessage = src.lastMessage || "";
					prev.msgAt = Date.now();
				}
				if (prev.deskIdx >= 0) desks[prev.deskIdx].occupied = true;
				newAgents.push(prev);
			} else newSrcs.push(src);
		});
		newSrcs.forEach((src) => {
			const deskIdx = desks.findIndex((dk) => !dk.occupied);
			if (deskIdx < 0) return;
			desks[deskIdx].occupied = true;
			const dk = desks[deskIdx];
			const known = isKnownAgent("panda-office", src.id);
			newAgents.push({
				id: src.id,
				name: src.name,
				label: src.label,
				kind: src.kind,
				x: known ? dk.x + 10 : DOOR$1.x + 6,
				y: known ? dk.y + 20 : DOOR$1.y + 25,
				tx: dk.x + 10,
				ty: dk.y + 20,
				deskIdx,
				color: AGENT_COLORS$1[deskIdx % AGENT_COLORS$1.length],
				detail: src.detail,
				dir: 1,
				activity: known ? "desk" : "entering",
				running: src.running,
				lastMessage: src.lastMessage || "",
				msgAt: 0
			});
			markAgentsKnown("panda-office", [src.id]);
		});
		kanbanRef.current = capped.filter((s) => s.running).map((s) => s.name).slice(0, 4);
		if (kanbanRef.current.length === 0) kanbanRef.current = ["No tasks"];
		agentsRef.current = newAgents;
		setAgentCount(newAgents.length);
		pruneAgents("panda-office", newAgents.map((a) => a.id));
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W$5, H$5, S$6);
		const spawnParticle = () => {
			if (particlesRef.current.length < 15) particlesRef.current.push({
				x: Math.random() * W$5,
				y: 85 + Math.random() * 210,
				vx: (Math.random() - .5) * .08,
				vy: -.04 - Math.random() * .04,
				life: 0,
				maxLife: 250 + Math.random() * 300
			});
		};
		const drawWindow = (t) => {
			const { x, y, w, h } = WINDOW_POS;
			d(x - 1, y - 1, w + 2, h + 2, COL$3.bambooDark);
			d(x, y, w, h, "#1a3a2a");
			for (let i = 0; i < 6; i++) {
				const bx = x + 3 + i * 8, bh = 15 + i * 7 % 12;
				d(bx, y + h - bh, 2, bh, "#2a5a3a");
				d(bx - 2, y + h - bh + 3, 6, 2, "#3a6a4a");
				d(bx - 1, y + h - bh - 2, 4, 2, "#3a6a4a");
			}
			for (let i = 0; i < 4; i++) {
				const fx = x + 5 + (i * 13 + t * .015) % (w - 10);
				const fy = y + 4 + i * 9 % (h - 8);
				if (Math.sin(t * .05 + i * 2.1) > .4) {
					d(fx, fy, 1, 1, "#afa");
					X.fillStyle = "rgba(150,255,150,0.08)";
					X.fillRect((fx - 2) * S$6, (fy - 2) * S$6, 15, 15);
				}
			}
			d(x + w / 2, y, 1, h, COL$3.bambooDark);
			d(x, y + h / 2, w, 1, COL$3.bambooDark);
		};
		const drawDoor = (t) => {
			const { x, y, w, h } = DOOR$1;
			d(x, y, w, h, COL$3.doorFrame);
			d(x + 1, y + 1, w - 2, h - 2, COL$3.door);
			d(x + w - 3, y + h / 2, 1.5, 1.5, COL$3.doorKnob);
			T.fillStyle = "#999";
			T.font = sceneFont("label");
			T.fillText("IN", (x + 2) * S$6, (y - 2) * S$6);
			if (agentsRef.current.some((a) => a.activity === "entering") && t >> 3 & 1) {
				X.fillStyle = "rgba(255,200,50,0.08)";
				X.fillRect(x * S$6, y * S$6, w * S$6, h * S$6);
			}
		};
		const drawCeilingLights = (t) => {
			[
				70,
				170,
				270,
				370
			].forEach((lx, i) => {
				d(lx - 4, 80, 8, 2, COL$3.lightFixture);
				d(lx - 2, 78, 4, 2, COL$3.lightFixture);
				const flicker = 1 + Math.sin(t * .025 + i * 1.3) * .12;
				const grad = X.createRadialGradient(lx * S$6, 246, 0, lx * S$6, 246, 135 * flicker);
				grad.addColorStop(0, "rgba(255,220,150,0.07)");
				grad.addColorStop(1, "rgba(255,220,150,0)");
				X.fillStyle = grad;
				X.fillRect((lx - 45) * S$6, 240, 270, 150);
			});
		};
		const drawClock = (t) => {
			const { x, y } = CLOCK_POS;
			const now = /* @__PURE__ */ new Date();
			const hr = now.getHours(), mn = now.getMinutes();
			d(x - 8, y - 8, 16, 16, "#444");
			d(x - 7, y - 7, 14, 14, "#222");
			for (let i = 0; i < 12; i++) {
				const a = i / 12 * Math.PI * 2 - Math.PI / 2;
				d(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 1, 1, "#666");
			}
			const ha = (hr % 12 / 12 + mn / 720) * Math.PI * 2 - Math.PI / 2;
			const ma = mn / 60 * Math.PI * 2 - Math.PI / 2;
			X.strokeStyle = "#f90";
			X.lineWidth = S$6;
			X.beginPath();
			X.moveTo(x * S$6, y * S$6);
			X.lineTo((x + Math.cos(ha) * 3.5) * S$6, (y + Math.sin(ha) * 3.5) * S$6);
			X.stroke();
			X.strokeStyle = "#ccc";
			X.lineWidth = S$6;
			X.beginPath();
			X.moveTo(x * S$6, y * S$6);
			X.lineTo((x + Math.cos(ma) * 5) * S$6, (y + Math.sin(ma) * 5) * S$6);
			X.stroke();
			if (t >> 4 & 1) d(x - .5, y - .5, 1, 1, "#f00");
		};
		const drawWhiteboard = () => {
			const { x, y, w, h } = WHITEBOARD;
			d(x - 1, y - 1, w + 2, h + 2, COL$3.whiteboardFrame);
			d(x, y, w, h, COL$3.whiteboard);
			const cols = [
				"To Do",
				"Active",
				"Done"
			];
			const cw = w / 3;
			cols.forEach((label, i) => {
				if (i > 0) d(x + cw * i, y, .5, h, "#bbb");
				T.fillStyle = "#888";
				T.font = sceneFont("label");
				T.fillText(label, (x + cw * i + 1) * S$6, (y + 4) * S$6);
			});
			const colors = [
				"#ffe066",
				"#ff9999",
				"#99ccff",
				"#99ff99"
			];
			kanbanRef.current.forEach((task, i) => {
				const col = Math.min(i, 2);
				const row = i < 1 ? 0 : i < 3 ? i - 1 : 0;
				const nx = x + cw * col + 1, ny = y + 7 + row * 9;
				d(nx, ny, cw - 2, 7, colors[i % colors.length]);
				T.fillStyle = "#333";
				T.font = sceneFont("detail");
				T.fillText(sliceCodePoints(task, 0, 8), (nx + 1) * S$6, (ny + 4.5) * S$6);
			});
		};
		const drawCoffeeMachine = (t) => {
			const { x, y } = COFFEE_MACHINE;
			d(x, y, 12, 16, "#555");
			d(x + 1, y + 1, 10, 6, "#333");
			d(x + 3, y + 2, 6, 4, COL$3.coffee);
			if (t >> 5 & 1) d(x + 5, y + 8, 2, 1, COL$3.coffee);
			d(x + 3, y + 10, 6, 5, COL$3.coffeeMug);
			d(x + 2, y + 11, 1, 3, COL$3.coffeeMug);
			d(x + 4, y + 11, 4, 3, COL$3.coffee);
			for (let i = 0; i < 3; i++) {
				const sy = y + 8 - i * 3 - t * .04 % 3;
				const sx = x + 4 + Math.sin(t * .025 + i * 2) * 1.5;
				if (sy > y - 2) {
					X.fillStyle = `rgba(255,255,255,${.12 - i * .03})`;
					X.fillRect(sx * S$6, sy * S$6, 6, 3);
				}
			}
		};
		const drawPlant = (px, py, t) => {
			d(px + 3, py + 2, 2, 12, COL$3.bamboo);
			d(px + 3.5, py + 2, 1, 12, COL$3.bambooLight);
			d(px + 2.5, py + 6, 3, 1, COL$3.bambooDark);
			d(px + 2.5, py + 10, 3, 1, COL$3.bambooDark);
			const sw = Math.sin(t * .015 + px) * 2 | 0;
			d(px + sw, py, 3, 2, COL$3.bambooLeaf);
			d(px + 5 + sw, py + 3, 3, 1, COL$3.bambooLeafLight);
			d(px - 1 + sw, py + 4, 3, 1, COL$3.bambooLeaf);
		};
		const drawPullUpBar = (_t) => {
			const { x: px, y: py } = PULLUP_BAR;
			d(px, py, 2, 28, COL$3.pullBar);
			d(px + 24, py, 2, 28, COL$3.pullBar);
			d(px, py, 26, 2, COL$3.pullBarDark);
			d(px + 1, py + 1, 24, 1, "#888");
			d(px - 1, py + 26, 4, 2, COL$3.pullBarDark);
			d(px + 23, py + 26, 4, 2, COL$3.pullBarDark);
			drawLabel(T, "pull-ups", (px + 13) * S$6, (py - 3) * S$6, {
				role: "label",
				color: "#888",
				bgColor: "rgba(0,0,0,0.4)",
				align: "center",
				scale: S$6
			});
		};
		const drawChessTable = (_t) => {
			const { x: cx, y: cy } = CHESS_TABLE;
			d(cx + 2, cy + 10, 2, 8, COL$3.bark);
			d(cx + 18, cy + 10, 2, 8, COL$3.bark);
			d(cx, cy + 8, 22, 3, COL$3.barkDark);
			d(cx + 1, cy + 8, 20, 2, COL$3.bark);
			for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) d(cx + 3 + c * 4, cy + 1 + r * 2, 4, 2, r + c & 1 ? COL$3.chessDark : COL$3.chess);
			d(cx + 5, cy, 1, 1, "#fff");
			d(cx + 13, cy, 1, 1, "#222");
			d(cx + 9, cy - 1, 1, 2, "#fff");
			d(cx + 17, cy + 1, 1, 1, "#222");
			d(cx - 3, cy + 10, 4, 3, COL$3.chair);
			d(cx + 21, cy + 10, 4, 3, COL$3.chair);
		};
		const drawRug = () => {
			X.fillStyle = "#2a4a1a";
			X.beginPath();
			X.ellipse(660, 525, 120, 42, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = "#354a25";
			X.beginPath();
			X.ellipse(660, 525, 102, 30, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = "#2a4a1a";
			X.beginPath();
			X.ellipse(660, 525, 84, 21, 0, 0, Math.PI * 2);
			X.fill();
		};
		const drawBookshelves = () => {
			BAMBOO_STALKS.forEach(({ x: bx, y: by, h: bh }) => {
				d(bx, by, 3, bh, COL$3.bamboo);
				d(bx + 1, by, 1, bh, COL$3.bambooLight);
				for (let n = 0; n < bh; n += 10) d(bx - .5, by + n, 4, 1, COL$3.bambooDark);
				d(bx - 3, by - 2, 4, 2, COL$3.bambooLeaf);
				d(bx + 2, by - 3, 4, 2, COL$3.bambooLeafLight);
				d(bx - 2, by + 5, 3, 1, COL$3.bambooLeaf);
			});
		};
		const drawLogo = () => {
			T.fillStyle = "#8fbc5f";
			T.font = sceneFont("title", "bold");
			T.fillText(i18nT("pages.scenes.pandaOfficeScene.panda_den"), (W$5 / 2 - 28) * S$6, 96);
			d(W$5 / 2 - 30, 34, 60, 1, "#6b8e23");
		};
		const drawDesk = (desk, t) => {
			const { x: dx, y: dy, accent, items, occupied } = desk;
			d(dx - 2, dy - 2, 1, 32, COL$3.cubicleWall);
			d(dx - 2, dy - 2, 34, 1, COL$3.cubicleWall);
			d(dx + 31, dy - 2, 1, 32, COL$3.cubicleWall);
			d(dx - 2, dy - 3, 35, 1, COL$3.cubicleTop);
			d(dx, dy + 16, 28, 3, COL$3.deskTop);
			d(dx, dy + 15, 28, 1, accent);
			d(dx + 1, dy + 14, 26, 1, COL$3.desk);
			d(dx + 2, dy + 19, 2, 10, COL$3.desk);
			d(dx + 24, dy + 19, 2, 10, COL$3.desk);
			d(dx + 9, dy + 4, 10, 10, COL$3.monitor);
			d(dx + 10, dy + 5, 8, 8, occupied ? COL$3.screen : COL$3.screenOff);
			d(dx + 13, dy + 14, 2, 1, COL$3.monitor);
			if (occupied) {
				for (let i = 0; i < 4; i++) {
					const lw = 2 + (t + i * 7) % 5;
					d(dx + 11, dy + 6 + i * 1.8, lw, .8, COL$3.screenText);
				}
				if (t >> 3 & 1) d(dx + 11 + (t >> 2) % 5, dy + 6 + (t >> 4) % 4 * 1.8, 1, 1, COL$3.screenCursor);
				X.fillStyle = "rgba(50,255,50,0.025)";
				X.fillRect((dx + 8) * S$6, (dy + 13) * S$6, 36, 12);
			} else if (t >> 5 & 1) d(dx + 14, dy + 9, 1, 1, "#333");
			d(dx + 10, dy + 22, 8, 3, COL$3.chair);
			d(dx + 10, dy + 25, 2, 4, COL$3.chair);
			d(dx + 16, dy + 25, 2, 4, COL$3.chair);
			d(dx + 9, dy + 19, 1, 6, COL$3.chair);
			items.forEach((item) => {
				const ix = dx + item.ox, iy = dy + item.oy;
				switch (item.kind) {
					case "mug":
						d(ix, iy, 3, 3, COL$3.mug);
						d(ix + 3, iy + .5, 1, 2, COL$3.mug);
						if (occupied && t >> 4 & 1) {
							X.fillStyle = "rgba(255,255,255,0.1)";
							X.fillRect((ix + 1) * S$6, (iy - 1.5) * S$6, S$6, S$6);
						}
						break;
					case "photo":
						d(ix, iy, 4, 5, "#ddd");
						d(ix + .5, iy + .5, 3, 3.5, accent);
						break;
					case "plant":
						d(ix + 1, iy + 3, 2, 3, COL$3.plantPot);
						d(ix, iy + 1, 4, 2, COL$3.plant);
						d(ix + 1, iy, 2, 2, COL$3.plantLight);
						break;
					case "notebook":
						d(ix, iy, 5, 3, COL$3.notebook);
						d(ix + .5, iy + .5, 4, .5, "#fff");
						break;
					case "headphones":
						d(ix, iy, 4, 1, COL$3.headphones);
						d(ix, iy + 1, 1, 2, COL$3.headphones);
						d(ix + 3, iy + 1, 1, 2, COL$3.headphones);
				}
			});
			if (!occupied) drawLabel(T, "empty", (dx + 15) * S$6, (dy + 1) * S$6, {
				role: "label",
				color: "#555",
				bgColor: "#333",
				align: "center",
				scale: S$6
			});
		};
		const agentBob = (a, t) => {
			return Math.abs(a.x - a.tx) > 1.5 || Math.abs(a.y - a.ty) > 1.5 ? Math.sin(t * .12 + a.x) * 2 | 0 : 0;
		};
		const drawAgent = (a, t) => {
			const bx = a.x | 0, by = a.y | 0;
			const mv = Math.abs(a.x - a.tx) > 1.5 || Math.abs(a.y - a.ty) > 1.5;
			const bob = agentBob(a, t);
			X.fillStyle = "rgba(0,0,0,0.12)";
			X.fillRect((bx + 1) * S$6, (by + 10) * S$6, 18, 6);
			d(bx, by + bob, 8, 8, PANDA_WHITE);
			d(bx, by + bob, 8, 2, PANDA_BLACK);
			d(bx + 3, by + 2 + bob, 2, 1, a.color);
			d(bx, by - 7 + bob, 8, 7, PANDA_WHITE);
			d(bx - 1, by - 8 + bob, 2, 2, PANDA_BLACK);
			d(bx + 7, by - 8 + bob, 2, 2, PANDA_BLACK);
			d(bx, by - 7 + bob, 1, 1, PANDA_BLACK);
			d(bx + 7, by - 7 + bob, 1, 1, PANDA_BLACK);
			const ex = a.dir > 0 ? 1 : 0;
			d(bx + 1 + ex, by - 5 + bob, 2, 3, PANDA_BLACK);
			d(bx + 4 + ex, by - 5 + bob, 2, 3, PANDA_BLACK);
			if (!(t % 120 < 3)) {
				d(bx + 1.5 + ex, by - 4 + bob, 1, 1, "#fff");
				d(bx + 4.5 + ex, by - 4 + bob, 1, 1, "#fff");
			}
			d(bx + 3.5, by - 2 + bob, 1, 1, PANDA_BLACK);
			if (a.running) d(bx + 3, by - 1 + bob, 2, .5, PANDA_PINK);
			const st = t >> 3 & 1;
			if (!mv && a.activity === "desk" && a.running) {
				const armBob = t >> 2 & 1;
				d(bx - 1, by + 2 + bob + armBob, 2, 3, PANDA_BLACK);
				d(bx + 7, by + 2 + bob + (1 - armBob), 2, 3, PANDA_BLACK);
			} else {
				d(bx - 1, by + 3 + bob, 2, 3, PANDA_BLACK);
				d(bx + 7, by + 3 + bob, 2, 3, PANDA_BLACK);
			}
			if (mv) {
				d(bx + 1 + (st ? 2 : 0), by + 8 + bob, 2, 3, PANDA_BLACK);
				d(bx + 5 - (st ? 2 : 0), by + 8 + bob, 2, 3, PANDA_BLACK);
			} else {
				d(bx + 1, by + 8, 2, 3, PANDA_BLACK);
				d(bx + 5, by + 8, 2, 3, PANDA_BLACK);
			}
			if (a.activity === "coffee") {
				const cx = bx + (a.dir > 0 ? 9 : -3);
				d(cx, by + 1 + bob, 1, 5, "#6b8e23");
				d(cx - 1, by + 2 + bob, 3, 1, "#8fbc5f");
			}
			const kindEmoji = a.kind === "cron" ? "⏰" : a.kind === "spawn" ? "🔀" : "💬";
			X.font = "6px monospace";
			X.fillText(kindEmoji, (bx + 8) * S$6, (by - 6 + bob) * S$6);
			drawLabel(T, a.running ? "active" : "idle", (bx + 4) * S$6, (by - 11 + bob) * S$6, {
				role: "status",
				color: a.running ? "#4f4" : "#888",
				bgColor: "rgba(0,0,0,0.5)",
				align: "center",
				scale: S$6
			});
			if (a.lastMessage && Date.now() - a.msgAt < 7e3) {
				const msgAge = Date.now() - a.msgAt;
				const msgAlpha = msgAge > 6e3 ? (SPEECH_BUBBLE_MS - msgAge) / 1e3 : 1;
				drawSpeechBubble(T, a.lastMessage, (bx + 4) * S$6, (by - 15 + bob) * S$6, {
					scale: S$6,
					alpha: msgAlpha
				});
			}
			const nameLines = drawLabel(T, a.name, (bx + 4) * S$6, (by + 14) * S$6, {
				role: "name",
				weight: "bold",
				color: "#fff",
				align: "center",
				scale: S$6,
				maxWidth: 192
			});
			if (a.detail) drawLabel(T, a.detail, (bx - 2) * S$6, (by + 18) * S$6 + (nameLines - 1) * sceneLineHeight("name"), {
				role: "detail",
				color: "#999",
				scale: S$6
			});
			if (a.deskIdx >= 0 && a.activity !== "entering") {
				const dk = desksRef.current[a.deskIdx];
				drawLabel(T, sliceCodePoints(a.name, 0, 8), (dk.x + 15) * S$6, (dk.y + 1) * S$6, {
					role: "label",
					color: "#fff",
					bgColor: a.color,
					align: "center",
					scale: S$6
				});
			}
			if (collabRef.current && (collabRef.current[0] === a || collabRef.current[1] === a)) d(bx + 2, by - 16 + bob, 3, 2, "#f90");
		};
		const drawSpeech = (a, text, side) => {
			if (!text) return;
			const bx = a.x | 0, by = a.y | 0;
			const bob = agentBob(a, tickRef.current);
			const tw = text.length * 3.5 + 4, bh = 8;
			const sx = side < 0 ? bx - tw - 2 : bx + 10, sy = by - 26 + bob;
			d(sx, sy, tw, bh, "#fff");
			d(sx - 1, sy + 1, tw + 2, 6, "#fff");
			d(side < 0 ? sx + tw : sx, sy + bh, 2, 2, "#fff");
			T.fillStyle = "#222";
			T.font = sceneFont("spell");
			T.fillText(text, (sx + 2) * S$6, (sy + 5.5) * S$6);
		};
		const drawParticles = () => {
			particlesRef.current.forEach((p) => {
				const alpha = Math.max(0, .25 * (1 - p.life / p.maxLife));
				X.fillStyle = `rgba(255,240,200,${alpha})`;
				X.fillRect(p.x * S$6, p.y * S$6, S$6, S$6);
			});
		};
		const drawAgentCounter = () => {
			const count = agentsRef.current.length;
			const total = MAX_DESKS;
			T.fillStyle = "#999";
			T.font = sceneFont("status");
			T.fillText(`${count}/${total} agents`, 12, 296 * S$6);
		};
		const timeouts = [];
		const update = (t) => {
			const agents = agentsRef.current;
			particlesRef.current.forEach((p) => {
				p.x += p.vx;
				p.y += p.vy;
				p.vx += (Math.random() - .5) * .015;
				p.life++;
			});
			particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife && p.y > 70);
			agents.forEach((a) => {
				const ddx = a.tx - a.x, ddy = a.ty - a.y;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy);
				if (dist > 1.5) {
					a.x += ddx / dist * .65;
					a.y += ddy / dist * .65;
					a.dir = ddx > 0 ? 1 : -1;
				} else {
					a.x = a.tx;
					a.y = a.ty;
					if (a.activity === "entering") a.activity = "desk";
				}
			});
			const deskAgents = agents.filter((a) => a.activity === "desk");
			if (t % 1800 === 0 && !collabRef.current && deskAgents.length >= 2 && Math.random() < .3) {
				const i = Math.random() * deskAgents.length | 0;
				const j = (i + 1 + (Math.random() * (deskAgents.length - 1) | 0)) % deskAgents.length;
				const a = deskAgents[i], b = deskAgents[j];
				a.tx = 210;
				a.ty = 170;
				b.tx = 230;
				b.ty = 170;
				a.activity = "collab";
				b.activity = "collab";
				collabRef.current = [a, b];
				const lines = CHAT_LINES[Math.random() * CHAT_LINES.length | 0];
				speechRef.current = {
					a: lines[0],
					b: ""
				};
				timeouts.push(window.setTimeout(() => {
					speechRef.current.b = lines[1];
				}, 1200));
				timeouts.push(window.setTimeout(() => {
					const live = agentsRef.current;
					if (!live.includes(a) || !live.includes(b)) {
						for (const agent of [a, b]) if (live.includes(agent) && agent.deskIdx >= 0) {
							const dk = desksRef.current[agent.deskIdx];
							agent.tx = dk.x + 10;
							agent.ty = dk.y + 20;
							agent.activity = "desk";
						}
						collabRef.current = null;
						speechRef.current = {
							a: "",
							b: ""
						};
						return;
					}
					const dkA = desksRef.current[a.deskIdx], dkB = desksRef.current[b.deskIdx];
					a.tx = dkA.x + 10;
					a.ty = dkA.y + 20;
					b.tx = dkB.x + 10;
					b.ty = dkB.y + 20;
					a.activity = "desk";
					b.activity = "desk";
					collabRef.current = null;
					speechRef.current = {
						a: "",
						b: ""
					};
				}, 4500));
			}
			if (t % 2400 === 600 && !collabRef.current && deskAgents.length > 0 && Math.random() < .25) {
				const a = deskAgents[Math.random() * deskAgents.length | 0];
				if (a.activity === "desk") {
					a.activity = "coffee";
					a.tx = COFFEE_MACHINE.x - 15;
					a.ty = COFFEE_MACHINE.y + 2;
					timeouts.push(window.setTimeout(() => {
						if (!agentsRef.current.includes(a)) return;
						const dk = desksRef.current[a.deskIdx];
						a.tx = dk.x + 10;
						a.ty = dk.y + 20;
						a.activity = "desk";
					}, 3500));
				}
			}
			if (t % 3e3 === 900 && !collabRef.current && deskAgents.length > 0 && Math.random() < .2) {
				const a = deskAgents[Math.random() * deskAgents.length | 0];
				if (a.activity === "desk") {
					a.activity = "whiteboard";
					a.tx = WHITEBOARD.x + 20;
					a.ty = WHITEBOARD.y + 50;
					timeouts.push(window.setTimeout(() => {
						if (!agentsRef.current.includes(a)) return;
						const dk = desksRef.current[a.deskIdx];
						a.tx = dk.x + 10;
						a.ty = dk.y + 20;
						a.activity = "desk";
					}, 3e3));
				}
			}
			if (t % 6 === 0) spawnParticle();
		};
		const draw = (t) => {
			const agents = agentsRef.current;
			T.clearRect(0, 0, W$5 * S$6, H$5 * S$6);
			d(0, 0, W$5, 80, "#0d1a08");
			for (let i = 0; i < W$5; i += 6) {
				const shade = i / 6 & 1 ? "#4a7a1a" : "#3a6a14";
				const highlight = i / 6 & 1 ? "#5a8a2a" : "#4a7a1a";
				d(i, 0, 5, 80, shade);
				d(i + 2, 0, 1, 80, highlight);
				for (let j = 8 + i % 12; j < 80; j += 15) d(i - .5, j, 6, 1, "#2a5a0a");
			}
			for (let i = 0; i < W$5; i += 16) for (let j = 80; j < H$5; j += 16) {
				X.fillStyle = i / 16 + j / 16 & 1 ? COL$3.floorAlt : COL$3.floor;
				X.fillRect(i * S$6, j * S$6, 48, 48);
			}
			d(0, 78, W$5, 3, COL$3.wallTrim);
			drawWindow(t);
			drawLogo();
			drawBookshelves();
			drawWhiteboard();
			drawClock(t);
			drawDoor(t);
			drawCeilingLights(t);
			drawRug();
			desksRef.current.forEach((desk) => drawDesk(desk, t));
			drawCoffeeMachine(t);
			drawPullUpBar(t);
			drawChessTable(t);
			PLANTS.forEach((p) => drawPlant(p.x, p.y, t));
			drawParticles();
			[...agents].sort((a, b) => a.y - b.y).forEach((a) => drawAgent(a, t));
			if (collabRef.current) {
				const [a, b] = collabRef.current;
				X.strokeStyle = "#f90";
				X.lineWidth = S$6;
				X.setLineDash([12, 12]);
				X.beginPath();
				X.moveTo((a.x + 4) * S$6, (a.y + 4) * S$6);
				X.lineTo((b.x + 4) * S$6, (b.y + 4) * S$6);
				X.stroke();
				X.setLineDash([]);
				drawSpeech(a, speechRef.current.a, a.x < b.x ? -1 : 1);
				drawSpeech(b, speechRef.current.b, b.x < a.x ? -1 : 1);
			}
			drawAgentCounter();
		};
		const cancelLoop = runSceneLoop(visibleRef, tickRef, update, draw);
		return () => {
			cancelLoop();
			timeouts.forEach(clearTimeout);
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$5, H$5),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.pandaOfficeScene.panda_office_scene"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.pandaOfficeScene.panda_office_scene_labels"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/NeuralConstellationScene.tsx
var NEURAL_THEME = {
	active: "Processing neural pathways",
	idle: "Awaiting signal"
};
var W$4 = 480;
var H$4 = 320;
var S$5 = SCENE_SCALE;
var NODE_COLORS = [
	"#ff6b6b",
	"#4ecdc4",
	"#ffe66d",
	"#a29bfe",
	"#55efc4",
	"#fd79a8",
	"#74b9ff",
	"#e17055"
];
var CENTER = {
	x: W$4 / 2,
	y: H$4 / 2
};
function NeuralConstellationScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const nodesRef = useRef([]);
	const synapsesRef = useRef([]);
	const packetsRef = useRef([]);
	const visibleRef = useRef(visible);
	const starsRef = useRef([]);
	const nebulaeRef = useRef([]);
	const wavesRef = useRef([]);
	const shootingRef = useRef([]);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, nodesRef, W$4, H$4, NEURAL_THEME, 10, void 0, agents);
	useEffect(() => {
		const stars = [];
		const starColors = [
			"#c8dcff",
			"#ffe8c8",
			"#ffc8c8",
			"#c8ffd4",
			"#d4c8ff"
		];
		for (let i = 0; i < 120; i++) stars.push({
			x: Math.random() * W$4,
			y: Math.random() * H$4,
			size: Math.random() < .15 ? 2 : Math.random() < .4 ? 1.2 : .6,
			twinkle: Math.random() * Math.PI * 2,
			speed: .008 + Math.random() * .025,
			color: starColors[i % starColors.length]
		});
		starsRef.current = stars;
		const nebulae = [];
		const nebColors = [
			"rgba(100,50,180,",
			"rgba(50,100,180,",
			"rgba(180,50,80,",
			"rgba(50,150,120,"
		];
		for (let i = 0; i < 6; i++) nebulae.push({
			x: 40 + Math.random() * 400,
			y: 40 + Math.random() * 240,
			r: 30 + Math.random() * 50,
			color: nebColors[i % nebColors.length],
			drift: Math.random() * Math.PI * 2,
			phase: .002 + Math.random() * .003
		});
		nebulaeRef.current = nebulae;
	}, []);
	useEffect(() => {
		const existing = nodesRef.current;
		const newNodes = [];
		const count = agents.length;
		agents.forEach((src, i) => {
			const prev = existing.find((n) => n.id === src.id);
			const angle = i / Math.max(count, 1) * Math.PI * 2 - Math.PI / 2;
			const orbitR = 75 + i % 2 * 25;
			const tx = CENTER.x + Math.cos(angle) * orbitR;
			const ty = CENTER.y + Math.sin(angle) * orbitR;
			if (prev) {
				prev.name = src.name;
				prev.running = src.running;
				prev.detail = src.detail;
				prev.tx = tx;
				prev.ty = ty;
				prev.kind = src.kind;
				newNodes.push(prev);
			} else {
				const known = isKnownAgent("neural", src.id);
				newNodes.push({
					id: src.id,
					name: src.name,
					kind: src.kind,
					x: known ? tx : CENTER.x + (Math.random() - .5) * 20,
					y: known ? ty : CENTER.y + (Math.random() - .5) * 20,
					tx,
					ty,
					radius: 9,
					pulse: Math.random() * Math.PI * 2,
					running: src.running,
					color: NODE_COLORS[i % NODE_COLORS.length],
					detail: src.detail,
					angle,
					orbitSpeed: 5e-4 + Math.random() * 3e-4,
					energy: 0,
					burstCooldown: 0,
					ringAngle: Math.random() * Math.PI * 2,
					ringSpeed: .02 + Math.random() * .02
				});
				markAgentsKnown("neural", [src.id]);
			}
		});
		nodesRef.current = newNodes;
		pruneAgents("neural", newNodes.map((n) => n.id));
		const synapses = [];
		for (let i = 0; i < newNodes.length; i++) for (let j = i + 1; j < newNodes.length; j++) synapses.push({
			from: i,
			to: j,
			strength: .3 + Math.random() * .4,
			flow: Math.random() * Math.PI * 2,
			arcPhase: Math.random() * Math.PI * 2
		});
		synapsesRef.current = synapses;
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W$4, H$4, S$5);
		const glowCache = /* @__PURE__ */ new Map();
		const getGlowSprite = (color, maxR) => {
			const key = color + "|" + maxR;
			if (glowCache.has(key)) return glowCache.get(key);
			const size = Math.ceil(maxR * 2 * 1.9 * S$5);
			const c = document.createElement("canvas");
			c.width = size;
			c.height = size;
			const ctx = c.getContext("2d");
			const cx = size / 2;
			for (let layer = 3; layer >= 0; layer--) {
				const lr = maxR * (1 + layer * .3) * S$5;
				const alpha = .06 - layer * .012;
				const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, lr);
				grad.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
				grad.addColorStop(1, "transparent");
				ctx.fillStyle = grad;
				ctx.fillRect(0, 0, size, size);
			}
			glowCache.set(key, c);
			return c;
		};
		const hubGlowSize = Math.ceil(180.48 * S$5);
		const hubGlowCanvas = document.createElement("canvas");
		hubGlowCanvas.width = hubGlowSize;
		hubGlowCanvas.height = hubGlowSize;
		const hubCtx = hubGlowCanvas.getContext("2d");
		const hc = hubGlowSize / 2;
		for (let layer = 4; layer >= 0; layer--) {
			const lr = 16 * (1.5 + layer * .8) * S$5;
			const alpha = .04 - layer * .007;
			const grad = hubCtx.createRadialGradient(hc, hc, 0, hc, hc, lr);
			grad.addColorStop(0, `rgba(255,153,0,${alpha})`);
			grad.addColorStop(1, "transparent");
			hubCtx.fillStyle = grad;
			hubCtx.fillRect(0, 0, hubGlowSize, hubGlowSize);
		}
		const nebulaCanvas = document.createElement("canvas");
		nebulaCanvas.width = W$4 * S$5;
		nebulaCanvas.height = H$4 * S$5;
		const nebulaCtx = nebulaCanvas.getContext("2d");
		let nebulaFrame = -1;
		const renderNebulae = (t) => {
			if (Math.floor(t / 60) === nebulaFrame) return;
			nebulaFrame = Math.floor(t / 60);
			nebulaCtx.clearRect(0, 0, W$4 * S$5, H$4 * S$5);
			nebulaeRef.current.forEach((n) => {
				const nx = n.x + Math.sin(t * n.phase + n.drift) * 8;
				const ny = n.y + Math.cos(t * n.phase * .7 + n.drift) * 5;
				const breathe = n.r + Math.sin(t * .008 + n.drift) * 6;
				for (let layer = 3; layer >= 0; layer--) {
					const lr = breathe * (1 + layer * .4);
					const alpha = .02 - layer * .004;
					const grad = nebulaCtx.createRadialGradient(nx * S$5, ny * S$5, 0, nx * S$5, ny * S$5, lr * S$5);
					grad.addColorStop(0, n.color + alpha + ")");
					grad.addColorStop(.6, n.color + alpha * .5 + ")");
					grad.addColorStop(1, "transparent");
					nebulaCtx.fillStyle = grad;
					nebulaCtx.fillRect((nx - lr) * S$5, (ny - lr) * S$5, lr * 2 * S$5, lr * 2 * S$5);
				}
			});
		};
		const drawNebulae = (t) => {
			renderNebulae(t);
			X.drawImage(nebulaCanvas, 0, 0);
		};
		const drawStars = (t) => {
			starsRef.current.forEach((star) => {
				const alpha = .25 + Math.sin(t * star.speed + star.twinkle) * .35;
				X.globalAlpha = Math.max(.05, alpha);
				X.fillStyle = star.color;
				X.fillRect(star.x * S$5, star.y * S$5, star.size * S$5, star.size * S$5);
				if (star.size > 1.5 && alpha > .4) {
					X.globalAlpha = alpha * .3;
					X.fillRect((star.x - 1) * S$5, star.y * S$5, (star.size + 2) * S$5, star.size * .5 * S$5);
					X.fillRect(star.x * S$5, (star.y - 1) * S$5, star.size * .5 * S$5, (star.size + 2) * S$5);
				}
			});
			X.globalAlpha = 1;
		};
		const drawShootingStars = (t) => {
			if (t % 180 === 0 && Math.random() < .4 && shootingRef.current.length < 2) {
				const fromLeft = Math.random() < .5;
				shootingRef.current.push({
					x: fromLeft ? -5 : 485,
					y: Math.random() * H$4 * .4,
					vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 2),
					vy: .5 + Math.random() * 1,
					life: 0,
					maxLife: 40 + Math.random() * 30
				});
			}
			shootingRef.current.forEach((ss) => {
				ss.x += ss.vx;
				ss.y += ss.vy;
				ss.life++;
				const alpha = 1 - ss.life / ss.maxLife;
				for (let i = 0; i < 6; i++) {
					const ta = alpha * (1 - i * .15);
					X.fillStyle = `rgba(255,255,200,${Math.max(0, ta)})`;
					X.fillRect((ss.x - ss.vx * i * .5) * S$5, (ss.y - ss.vy * i * .5) * S$5, 2 * S$5, 1 * S$5);
				}
				X.fillStyle = `rgba(255,255,255,${alpha})`;
				X.fillRect(ss.x * S$5, ss.y * S$5, 2 * S$5, 2 * S$5);
			});
			shootingRef.current = shootingRef.current.filter((ss) => ss.life < ss.maxLife);
		};
		const drawSynapses = (t) => {
			const nodes = nodesRef.current;
			synapsesRef.current.forEach((syn) => {
				if (syn.from >= nodes.length || syn.to >= nodes.length) return;
				const a = nodes[syn.from], b = nodes[syn.to];
				const bothActive = a.running && b.running;
				const anyActive = a.running || b.running;
				const dx = b.x - a.x, dy = b.y - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				X.setLineDash(anyActive ? [4 * S$5, 3 * S$5] : [2 * S$5, 6 * S$5]);
				X.lineDashOffset = -t * (bothActive ? .8 : .3);
				X.strokeStyle = bothActive ? a.color + "88" : `rgba(100,180,255,${bothActive ? .4 : anyActive ? .15 : .04})`;
				X.lineWidth = (bothActive ? 2 : .8) * S$5;
				X.beginPath();
				X.moveTo(a.x * S$5, a.y * S$5);
				X.lineTo(b.x * S$5, b.y * S$5);
				X.stroke();
				X.setLineDash([]);
				if (bothActive && dist > 20) {
					const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
					const perpX = -dy / dist, perpY = dx / dist;
					const arcOff = Math.sin(t * .08 + syn.arcPhase) * 8;
					X.strokeStyle = a.color + "44";
					X.lineWidth = S$5;
					X.beginPath();
					X.moveTo(a.x * S$5, a.y * S$5);
					X.quadraticCurveTo((midX + perpX * arcOff) * S$5, (midY + perpY * arcOff) * S$5, b.x * S$5, b.y * S$5);
					X.stroke();
				}
				if (anyActive && t % 120 === 0 && Math.random() < .15) packetsRef.current.push({
					x: a.x,
					y: a.y,
					tx: b.x,
					ty: b.y,
					progress: 0,
					color: bothActive ? "#fff" : "#6cf",
					speed: .012 + Math.random() * .008,
					trail: []
				});
			});
		};
		const drawPackets = () => {
			packetsRef.current.forEach((p) => {
				p.progress += p.speed;
				const px = p.x + (p.tx - p.x) * p.progress;
				const py = p.y + (p.ty - p.y) * p.progress;
				p.trail.push({
					x: px,
					y: py
				});
				if (p.trail.length > 8) p.trail.shift();
				p.trail.forEach((pt, i) => {
					const ta = i / p.trail.length * .4;
					X.fillStyle = p.color;
					X.globalAlpha = ta;
					const sz = 1 + i / p.trail.length;
					X.fillRect((pt.x - sz / 2) * S$5, (pt.y - sz / 2) * S$5, sz * S$5, sz * S$5);
				});
				const alpha = 1 - Math.abs(p.progress - .5) * 1.2;
				X.globalAlpha = Math.max(0, alpha);
				X.fillStyle = "#fff";
				X.fillRect((px - 1) * S$5, (py - 1) * S$5, 2 * S$5, 2 * S$5);
				const grad = X.createRadialGradient(px * S$5, py * S$5, 0, px * S$5, py * S$5, 5 * S$5);
				grad.addColorStop(0, p.color);
				grad.addColorStop(1, "transparent");
				X.fillStyle = grad;
				X.globalAlpha = Math.max(0, alpha * .4);
				X.fillRect((px - 5) * S$5, (py - 5) * S$5, 10 * S$5, 10 * S$5);
				X.globalAlpha = 1;
			});
			packetsRef.current = packetsRef.current.filter((p) => p.progress < 1);
		};
		const drawEnergyWaves = () => {
			wavesRef.current.forEach((w) => {
				const alpha = Math.max(0, .5 * (1 - w.radius / w.maxRadius));
				X.beginPath();
				X.arc(w.x * S$5, w.y * S$5, w.radius * S$5, 0, Math.PI * 2);
				X.strokeStyle = w.color;
				X.lineWidth = 1.5 * S$5;
				X.globalAlpha = alpha;
				X.stroke();
				X.globalAlpha = 1;
			});
		};
		const drawNode = (node, t) => {
			const { x, y, radius, running, color, name, kind, detail } = node;
			const r = radius * (running ? 1 + Math.sin(t * .07 + node.pulse) * .18 : .8);
			if (running) {
				const maxR = radius * 1.18 * 5.6;
				const sprite = getGlowSprite(color, maxR);
				const spriteExtent = maxR * 1.9;
				X.drawImage(sprite, (x - spriteExtent) * S$5, (y - spriteExtent) * S$5, spriteExtent * 2 * S$5, spriteExtent * 2 * S$5);
			}
			if (running) {
				node.ringAngle += node.ringSpeed;
				const ringR = r + 5;
				X.setLineDash([3 * S$5, 4 * S$5]);
				X.lineDashOffset = -node.ringAngle * 20;
				X.beginPath();
				X.arc(x * S$5, y * S$5, ringR * S$5, 0, Math.PI * 2);
				X.strokeStyle = color + "50";
				X.lineWidth = S$5;
				X.stroke();
				X.setLineDash([]);
				const dotX = x + Math.cos(node.ringAngle) * ringR;
				const dotY = y + Math.sin(node.ringAngle) * ringR;
				X.fillStyle = "#fff";
				X.beginPath();
				X.arc(dotX * S$5, dotY * S$5, 1.5 * S$5, 0, Math.PI * 2);
				X.fill();
				const dot2X = x + Math.cos(node.ringAngle + Math.PI) * ringR;
				const dot2Y = y + Math.sin(node.ringAngle + Math.PI) * ringR;
				X.fillStyle = color;
				X.beginPath();
				X.arc(dot2X * S$5, dot2Y * S$5, 1 * S$5, 0, Math.PI * 2);
				X.fill();
			}
			const coreGrad = X.createRadialGradient((x - r * .3) * S$5, (y - r * .3) * S$5, 0, x * S$5, y * S$5, r * S$5);
			coreGrad.addColorStop(0, running ? "#fff" : color + "80");
			coreGrad.addColorStop(.4, running ? color : color + "40");
			coreGrad.addColorStop(1, running ? color + "cc" : color + "20");
			X.beginPath();
			X.arc(x * S$5, y * S$5, r * S$5, 0, Math.PI * 2);
			X.fillStyle = coreGrad;
			X.fill();
			if (running) {
				const a1 = t * .05 + node.pulse;
				const a2 = t * .05 + node.pulse + Math.PI;
				X.beginPath();
				X.arc(x * S$5, y * S$5, (r + 3) * S$5, a1, a1 + Math.PI * .6);
				X.strokeStyle = "#fff8";
				X.lineWidth = 2 * S$5;
				X.stroke();
				X.beginPath();
				X.arc(x * S$5, y * S$5, (r + 3) * S$5, a2, a2 + Math.PI * .4);
				X.strokeStyle = color + "aa";
				X.lineWidth = 1.5 * S$5;
				X.stroke();
			}
			const kindChar = kind === "cron" ? "⏰" : kind === "spawn" ? "🔀" : "💬";
			X.font = 2.5 * S$5 + "px monospace";
			X.textAlign = "center";
			X.fillText(kindChar, x * S$5, (y + 1.5) * S$5);
			if (running) {
				T.shadowColor = color;
				T.shadowBlur = 6 * S$5;
			}
			T.fillStyle = running ? "#fff" : "#778";
			T.font = sceneFont("name", "bold");
			T.textAlign = "center";
			T.fillText(name, x * S$5, (y + r + 7) * S$5);
			T.shadowBlur = 0;
			X.fillStyle = running ? "#4f4" : "#556";
			X.beginPath();
			X.arc((x - 8) * S$5, (y + r + 11) * S$5, 1.5 * S$5, 0, Math.PI * 2);
			X.fill();
			T.fillStyle = running ? "#4f4" : "#556";
			T.font = sceneFont("status");
			T.textAlign = "center";
			T.fillText(running ? i18nT("pages.scenes.neuralConstellationScene.active") : i18nT("pages.scenes.neuralConstellationScene.idle"), (x - 5) * S$5, (y + r + 12) * S$5);
			if (detail) {
				T.fillStyle = "#667";
				T.font = sceneFont("detail");
				T.fillText(detail, x * S$5, (y + r + 16) * S$5);
			}
			T.textAlign = "start";
		};
		const drawCenterHub = (t) => {
			const pulse = 1 + Math.sin(t * .025) * .1;
			const r = 16 * pulse;
			const activeCount = nodesRef.current.filter((n) => n.running).length;
			const scaledGlowSize = hubGlowSize * pulse;
			X.drawImage(hubGlowCanvas, CENTER.x * S$5 - scaledGlowSize / 2, CENTER.y * S$5 - scaledGlowSize / 2, scaledGlowSize, scaledGlowSize);
			const coreGrad = X.createRadialGradient((CENTER.x - 3) * S$5, (CENTER.y - 3) * S$5, 0, CENTER.x * S$5, CENTER.y * S$5, r * S$5);
			coreGrad.addColorStop(0, "#fff4");
			coreGrad.addColorStop(.3, "#f90");
			coreGrad.addColorStop(1, "#c60");
			X.beginPath();
			X.arc(CENTER.x * S$5, CENTER.y * S$5, r * S$5, 0, Math.PI * 2);
			X.fillStyle = "#0a0a1a";
			X.fill();
			X.strokeStyle = "#f90";
			X.lineWidth = 2 * S$5;
			X.stroke();
			X.beginPath();
			X.arc(CENTER.x * S$5, CENTER.y * S$5, (r - 3) * S$5, 0, Math.PI * 2);
			X.strokeStyle = "#f904";
			X.lineWidth = S$5;
			X.stroke();
			for (let i = 0; i < 3; i++) {
				const a = t * (.015 + i * .005) + i * Math.PI * .67;
				const arcR = r + 4 + i * 3;
				X.beginPath();
				X.arc(CENTER.x * S$5, CENTER.y * S$5, arcR * S$5, a, a + .8 + i * .2);
				X.strokeStyle = i === 0 ? "#f908" : i === 1 ? "#fa06" : "#f904";
				X.lineWidth = (2 - i * .5) * S$5;
				X.stroke();
			}
			const dataRingR = r + 12;
			for (let i = 0; i < 8; i++) {
				const da = i / 8 * Math.PI * 2 + t * .01;
				const dx = CENTER.x + Math.cos(da) * dataRingR;
				const dy = CENTER.y + Math.sin(da) * dataRingR;
				const dotAlpha = .2 + Math.sin(t * .04 + i) * .15;
				X.fillStyle = `rgba(255,200,100,${dotAlpha})`;
				X.beginPath();
				X.arc(dx * S$5, dy * S$5, 1 * S$5, 0, Math.PI * 2);
				X.fill();
			}
			T.shadowColor = "#f90";
			T.shadowBlur = 4 * S$5;
			T.fillStyle = "#f90";
			T.font = sceneFont("title", "bold");
			T.textAlign = "center";
			T.fillText(i18nT("pages.scenes.neuralConstellationScene.neural_network"), CENTER.x * S$5, (CENTER.y + 1.5) * S$5);
			T.shadowBlur = 0;
			T.fillStyle = "#998";
			T.font = sceneFont("title");
			T.fillText(`${activeCount} active · ${nodesRef.current.length} nodes`, CENTER.x * S$5, (CENTER.y + 6) * S$5);
			T.textAlign = "start";
		};
		const drawCounter = () => {
			T.fillStyle = "#445";
			T.font = sceneFont("label");
			T.fillText(`neural network · ${nodesRef.current.length} nodes`, 4 * S$5, 316 * S$5);
		};
		const update = (t) => {
			nodesRef.current.forEach((node) => {
				const ddx = node.tx - node.x, ddy = node.ty - node.y;
				if (Math.sqrt(ddx * ddx + ddy * ddy) > .5) {
					node.x += ddx * .03;
					node.y += ddy * .03;
				}
				node.x += Math.sin(t * .003 + node.pulse) * .015;
				node.y += Math.cos(t * .002 + node.pulse) * .01;
				if (node.running) {
					node.energy += .008;
					node.burstCooldown = Math.max(0, node.burstCooldown - 1);
					if (node.energy > 1 && node.burstCooldown <= 0) {
						wavesRef.current.push({
							x: node.x,
							y: node.y,
							radius: node.radius,
							maxRadius: 35 + Math.random() * 20,
							color: node.color + "88",
							life: 0
						});
						node.energy = 0;
						node.burstCooldown = 300 + Math.random() * 200;
					}
				}
			});
			wavesRef.current.forEach((w) => {
				w.radius += 1.2;
				w.life++;
			});
			wavesRef.current = wavesRef.current.filter((w) => w.radius < w.maxRadius);
		};
		const draw = (t) => {
			T.clearRect(0, 0, W$4 * S$5, H$4 * S$5);
			d(0, 0, W$4, H$4, "#06060f");
			const bgGrad = X.createRadialGradient(CENTER.x * S$5, CENTER.y * S$5, 0, CENTER.x * S$5, CENTER.y * S$5, 220 * S$5);
			bgGrad.addColorStop(0, "rgba(15,20,45,0.5)");
			bgGrad.addColorStop(.5, "rgba(10,10,25,0.3)");
			bgGrad.addColorStop(1, "transparent");
			X.fillStyle = bgGrad;
			X.fillRect(0, 0, W$4 * S$5, H$4 * S$5);
			drawNebulae(t);
			drawStars(t);
			drawShootingStars(t);
			drawSynapses(t);
			drawPackets();
			drawEnergyWaves();
			drawCenterHub(t);
			[...nodesRef.current].sort((a, b) => a.y - b.y).forEach((n) => drawNode(n, t));
			drawCounter();
		};
		return runSceneLoop(visibleRef, tickRef, update, draw);
	}, []);
	useVisibleSync(visibleRef, visible);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$4, H$4),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.neuralConstellationScene.neural_constellation_animation"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.neuralConstellationScene.neural_constellation_text_overlay"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/WizardTowerScene.tsx
var WIZARD_THEME = {
	active: "Casting spells",
	idle: "Studying grimoire"
};
var W$3 = 480;
var H$3 = 340;
var S$4 = SCENE_SCALE;
var MAX_BENCHES = 8;
var ROBE_COLORS = [
	"#8e44ad",
	"#2980b9",
	"#c0392b",
	"#27ae60",
	"#d35400",
	"#16a085",
	"#e84393",
	"#f39c12"
];
var HAT_COLORS = [
	"#6c3483",
	"#1f618d",
	"#922b21",
	"#1e8449",
	"#a04000",
	"#117a65",
	"#c2185b",
	"#d4ac0d"
];
var BENCH_POSITIONS = [
	{
		x: 30,
		y: 140
	},
	{
		x: 120,
		y: 140
	},
	{
		x: 210,
		y: 140
	},
	{
		x: 300,
		y: 140
	},
	{
		x: 30,
		y: 230
	},
	{
		x: 120,
		y: 230
	},
	{
		x: 210,
		y: 230
	},
	{
		x: 300,
		y: 230
	}
];
var CIRCLE_POS = {
	x: 390,
	y: 190
};
var DOOR_POS = {
	x: 0,
	y: 130,
	w: 14,
	h: 55
};
var COL$2 = {
	stone: "#3a3040",
	stoneDark: "#2a2030",
	stoneLight: "#4a4050",
	floor: "#2e2438",
	floorAlt: "#362c40",
	wood: "#5c3a1e",
	woodDark: "#4a2e16",
	woodLight: "#7a5030",
	cauldron: "#333",
	cauldronRim: "#555",
	potion: "#4cff88",
	potionBubble: "#7fff9f",
	potionGlow: "rgba(76,255,136,0.15)",
	fire: "#f90",
	fireRed: "#e74c3c",
	ember: "#ff6",
	book: "#8e44ad",
	bookAlt: "#c0392b",
	bookBlue: "#2980b9",
	scroll: "#f5e6c8",
	scrollDark: "#d4c4a0",
	crystal: "#9b59b6",
	crystalGlow: "rgba(155,89,182,0.2)",
	candle: "#f1c40f",
	candleWax: "#eee",
	candleFlame: "#ff9",
	shelf: "#5c4033",
	window: "#1a2a4a",
	moonlight: "rgba(200,220,255,0.06)",
	rune: "#f90",
	runeGlow: "rgba(255,153,0,0.12)"
};
var SPELL_WORDS = [
	"Compilo!",
	"Deployo!",
	"Refactorus!",
	"Debuggify!",
	"Mergicus!",
	"Testifex!",
	"Optimax!",
	"Commitum!"
];
function WizardTowerScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const wizardsRef = useRef([]);
	const particlesRef = useRef([]);
	const spellRef = useRef(null);
	const visibleRef = useRef(visible);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, wizardsRef, W$3, H$3, WIZARD_THEME, 10, void 0, agents);
	useEffect(() => {
		const existing = wizardsRef.current;
		const newWizards = [];
		agents.forEach((src, i) => {
			const prev = existing.find((w) => w.id === src.id);
			if (prev) {
				prev.name = src.name;
				prev.running = src.running;
				prev.detail = src.detail;
				prev.kind = src.kind;
				if ((src.lastMessage || "") !== prev.lastMessage) {
					prev.lastMessage = src.lastMessage || "";
					prev.msgAt = Date.now();
				}
				newWizards.push(prev);
			} else {
				const benchIdx = BENCH_POSITIONS.findIndex((_, bi) => !existing.some((w) => w.benchIdx === bi) && !newWizards.some((w) => w.benchIdx === bi));
				if (benchIdx < 0) return;
				const bp = BENCH_POSITIONS[benchIdx];
				const known = isKnownAgent("wizard", src.id);
				newWizards.push({
					id: src.id,
					name: src.name,
					kind: src.kind,
					x: known ? bp.x + 15 : DOOR_POS.x + 7,
					y: known ? bp.y + 20 : DOOR_POS.y + 28,
					tx: bp.x + 15,
					ty: bp.y + 20,
					benchIdx,
					color: ROBE_COLORS[i % ROBE_COLORS.length],
					robeColor: HAT_COLORS[i % HAT_COLORS.length],
					running: src.running,
					detail: src.detail,
					lastMessage: src.lastMessage || "",
					msgAt: 0,
					hatBob: Math.random() * Math.PI * 2,
					castTimer: 0,
					activity: known ? "bench" : "entering"
				});
				markAgentsKnown("wizard", [src.id]);
			}
		});
		wizardsRef.current = newWizards;
		pruneAgents("wizard", newWizards.map((w) => w.id));
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W$3, H$3, S$4);
		const spawnMagic = (mx, my, color, count = 3) => {
			for (let i = 0; i < count; i++) particlesRef.current.push({
				x: mx,
				y: my,
				vx: (Math.random() - .5) * .4,
				vy: -.2 - Math.random() * .3,
				life: 0,
				maxLife: 80 + Math.random() * 120,
				color,
				size: .8 + Math.random() * 1.2
			});
		};
		const drawWalls = () => {
			d(0, 0, W$3, 90, COL$2.stone);
			for (let i = 0; i < W$3; i += 20) for (let j = 0; j < 90; j += 12) {
				const off = j / 12 & 1 ? 10 : 0;
				d(i + off, j, 19, 11, (i + j) % 40 < 20 ? COL$2.stoneDark : COL$2.stoneLight);
				d(i + off, j + 11, 19, 1, COL$2.stoneDark);
				d(i + off + 19, j, 1, 12, COL$2.stoneDark);
			}
			for (let i = 0; i < W$3; i += 16) for (let j = 90; j < H$3; j += 16) d(i, j, 16, 16, i / 16 + j / 16 & 1 ? COL$2.floorAlt : COL$2.floor);
			d(0, 88, W$3, 3, COL$2.woodDark);
		};
		const drawArchwayDoor = (t) => {
			const { x, y, w, h } = DOOR_POS;
			d(x, y, w, h, COL$2.stoneDark);
			d(x + 2, y + 4, w - 4, h - 4, COL$2.woodDark);
			for (let i = 0; i < 5; i++) d(x + 2 + i, y + 1 - Math.abs(i - 2), w - 4 - i * 2, 1, COL$2.stoneLight);
			if (wizardsRef.current.some((w) => w.activity === "entering") && t >> 3 & 1) {
				X.fillStyle = "rgba(155,89,182,0.1)";
				X.fillRect(x * S$4, y * S$4, w * S$4, h * S$4);
			}
			X.fillStyle = COL$2.rune;
			X.font = 2 * S$4 + "px monospace";
			X.fillText("⚡", (x + 3) * S$4, (y - 2) * S$4);
		};
		const drawWorkbench = (bx, by, occupied, idx, t) => {
			d(bx, by + 16, 40, 3, COL$2.woodLight);
			d(bx, by + 15, 40, 1, COL$2.wood);
			d(bx + 2, by + 19, 2, 10, COL$2.wood);
			d(bx + 36, by + 19, 2, 10, COL$2.wood);
			d(bx + 2, by + 8, 10, 8, COL$2.cauldron);
			d(bx + 1, by + 7, 12, 1, COL$2.cauldronRim);
			if (occupied) {
				d(bx + 3, by + 9, 8, 5, COL$2.potion);
				if (t % 12 < 6) d(bx + 4 + t % 5, by + 8, 2, 2, COL$2.potionBubble);
				if (t % 18 < 9) d(bx + 7 + t % 3, by + 7, 1, 1, COL$2.potionBubble);
				X.fillStyle = COL$2.potionGlow;
				X.fillRect((bx + 1) * S$4, (by + 14) * S$4, 12 * S$4, 6 * S$4);
				const flicker = t >> 2 & 1;
				d(bx + 3, by + 16, 3, 1, COL$2.fire);
				d(bx + 7, by + 16, 2, 1, COL$2.fireRed);
				if (flicker) d(bx + 5, by + 15, 2, 1, COL$2.ember);
			} else d(bx + 3, by + 12, 8, 2, "#222");
			d(bx + 22, by + 10, 12, 6, occupied ? COL$2.book : "#444");
			d(bx + 22, by + 10, 1, 6, COL$2.woodDark);
			if (occupied) {
				for (let i = 0; i < 3; i++) d(bx + 24, by + 11 + i * 1.5, 4 + i % 2 * 2, .5, COL$2.scroll);
				if ((t + idx * 40) % 80 < 40) {
					X.fillStyle = COL$2.rune;
					X.font = 2.5 * S$4 + "px monospace";
					X.fillText("✦", (bx + 26) * S$4, (by + 7) * S$4);
				}
			}
			const cx = bx + 16, cy = by + 8;
			d(cx, cy + 2, 2, 5, COL$2.candleWax);
			if (occupied) {
				const fh = 2 + (t >> 3 & 1);
				d(cx, cy - fh + 2, 2, fh, COL$2.candleFlame);
				d(cx + .5, cy - fh + 1, 1, 1, "#fff");
				const grad = X.createRadialGradient((cx + 1) * S$4, cy * S$4, 0, (cx + 1) * S$4, cy * S$4, 12 * S$4);
				grad.addColorStop(0, "rgba(255,200,50,0.08)");
				grad.addColorStop(1, "transparent");
				X.fillStyle = grad;
				X.fillRect((cx - 12) * S$4, (cy - 12) * S$4, 26 * S$4, 26 * S$4);
			}
			if (!occupied) drawLabel(T, i18nT("pages.scenes.wizardTowerScene.empty"), (bx + 20) * S$4, (by + 4) * S$4, {
				role: "label",
				color: "#555",
				bgColor: "#2a2030",
				align: "center",
				scale: S$4
			});
		};
		const drawSummoningCircle = (t) => {
			const { x, y } = CIRCLE_POS;
			X.strokeStyle = COL$2.rune;
			X.lineWidth = 1.5 * S$4;
			X.beginPath();
			X.arc(x * S$4, y * S$4, 28 * S$4, 0, Math.PI * 2);
			X.stroke();
			X.beginPath();
			X.arc(x * S$4, y * S$4, 20 * S$4, 0, Math.PI * 2);
			X.stroke();
			for (let i = 0; i < 6; i++) {
				const a = i / 6 * Math.PI * 2 + t * .01;
				const rx = x + Math.cos(a) * 24, ry = y + Math.sin(a) * 24;
				X.fillStyle = COL$2.rune;
				X.font = 2 * S$4 + "px monospace";
				X.fillText("✧", rx * S$4, ry * S$4);
			}
			const grad = X.createRadialGradient(x * S$4, y * S$4, 0, x * S$4, y * S$4, 30 * S$4);
			grad.addColorStop(0, COL$2.runeGlow);
			grad.addColorStop(1, "transparent");
			X.fillStyle = grad;
			X.fillRect((x - 30) * S$4, (y - 30) * S$4, 60 * S$4, 60 * S$4);
			X.strokeStyle = "rgba(255,153,0,0.15)";
			X.lineWidth = S$4;
			for (let i = 0; i < 5; i++) {
				const a1 = i / 5 * Math.PI * 2 - Math.PI / 2 + t * .005;
				const a2 = (i + 2) / 5 * Math.PI * 2 - Math.PI / 2 + t * .005;
				X.beginPath();
				X.moveTo((x + Math.cos(a1) * 18) * S$4, (y + Math.sin(a1) * 18) * S$4);
				X.lineTo((x + Math.cos(a2) * 18) * S$4, (y + Math.sin(a2) * 18) * S$4);
				X.stroke();
			}
		};
		const drawShelf = (sx, sy, t) => {
			d(sx, sy, 30, 2, COL$2.shelf);
			d(sx, sy - 18, 30, 2, COL$2.shelf);
			const potionColors = [
				"#e74c3c",
				"#3498db",
				"#2ecc71",
				"#f39c12",
				"#9b59b6"
			];
			for (let i = 0; i < 4; i++) {
				const px = sx + 2 + i * 7, py = sy - 8;
				d(px, py, 4, 8, "#555");
				d(px + .5, py + 1, 3, 6, potionColors[i % potionColors.length]);
				d(px + 1, py - 1, 2, 1, "#777");
				if (Math.sin(t * .02 + i * 1.5) > .5) {
					X.fillStyle = potionColors[i % potionColors.length] + "15";
					X.fillRect((px - 1) * S$4, (py - 1) * S$4, 6 * S$4, 10 * S$4);
				}
			}
			const bookColors = [
				COL$2.book,
				COL$2.bookAlt,
				COL$2.bookBlue,
				"#27ae60"
			];
			let bx = sx + 1;
			for (let i = 0; i < 3; i++) {
				const bh = 8 + i * 3 % 4;
				d(bx, sy - 18 - bh, 6, bh, bookColors[i % bookColors.length]);
				bx += 8;
			}
		};
		const drawWindow = (wx, wy, t) => {
			d(wx, wy, 24, 30, "#444");
			d(wx + 1, wy + 1, 22, 28, COL$2.window);
			d(wx + 14, wy + 5, 6, 6, "#dde");
			d(wx + 15, wy + 4, 4, 4, COL$2.window);
			for (let i = 0; i < 4; i++) {
				const stx = wx + 3 + i * 6 % 18, sty = wy + 3 + i * 5 % 20;
				if (Math.sin(t * .03 + i * 2) > .2) d(stx, sty, 1, 1, "#aac");
			}
			d(wx + 11, wy, 2, 30, "#444");
			X.fillStyle = COL$2.moonlight;
			X.fillRect((wx + 5) * S$4, (wy + 30) * S$4, 14 * S$4, 40 * S$4);
		};
		const drawCrystalBall = (cx, cy, t) => {
			d(cx + 2, cy + 8, 6, 3, COL$2.woodDark);
			d(cx + 3, cy + 6, 4, 2, COL$2.wood);
			X.beginPath();
			X.arc((cx + 5) * S$4, (cy + 3) * S$4, 5 * S$4, 0, Math.PI * 2);
			X.fillStyle = "#2a1a3a";
			X.fill();
			X.strokeStyle = COL$2.crystal;
			X.lineWidth = S$4;
			X.stroke();
			const sa = t * .03;
			X.beginPath();
			X.arc((cx + 5) * S$4, (cy + 3) * S$4, 3 * S$4, sa, sa + 2);
			X.strokeStyle = COL$2.crystal + "60";
			X.lineWidth = S$4;
			X.stroke();
			const grad = X.createRadialGradient((cx + 5) * S$4, (cy + 3) * S$4, 0, (cx + 5) * S$4, (cy + 3) * S$4, 8 * S$4);
			grad.addColorStop(0, COL$2.crystalGlow);
			grad.addColorStop(1, "transparent");
			X.fillStyle = grad;
			X.fillRect((cx - 3) * S$4, (cy - 5) * S$4, 16 * S$4, 16 * S$4);
		};
		const drawWizard = (w, t) => {
			const bx = w.x | 0, by = w.y | 0;
			const mv = Math.abs(w.x - w.tx) > 1.5 || Math.abs(w.y - w.ty) > 1.5;
			const bob = mv ? Math.sin(t * .12 + w.x) | 0 : 0;
			X.fillStyle = "rgba(0,0,0,0.15)";
			X.fillRect((bx + 1) * S$4, (by + 11) * S$4, 6 * S$4, 2 * S$4);
			d(bx, by + bob, 8, 10, w.color);
			d(bx - 1, by + 6 + bob, 10, 4, w.color);
			d(bx + 1, by - 5 + bob, 6, 5, "#fdd");
			d(bx - 1, by - 6 + bob, 10, 2, w.robeColor);
			d(bx + 1, by - 10 + bob, 6, 4, w.robeColor);
			d(bx + 2, by - 13 + bob, 4, 3, w.robeColor);
			d(bx + 3, by - 15 + bob, 2, 2, w.robeColor);
			if (w.running) {
				X.fillStyle = "#ff0";
				X.font = 1.5 * S$4 + "px monospace";
				X.fillText("★", (bx + 3) * S$4, (by - 11 + bob) * S$4);
			}
			if (!(t % 100 < 3)) {
				d(bx + 2, by - 3 + bob, 1, 1, "#333");
				d(bx + 5, by - 3 + bob, 1, 1, "#333");
			}
			d(bx + 2, by + bob, 4, 3, "#ccc");
			d(bx + 3, by + 3 + bob, 2, 2, "#bbb");
			if (mv) {
				d(bx + 8, by - 8 + bob, 1, 18, COL$2.wood);
				d(bx + 7, by - 10 + bob, 3, 3, COL$2.crystal);
				if (w.running) spawnMagic(bx + 8, by - 10 + bob, w.color, 1);
			}
			const st = t >> 3 & 1;
			if (mv) {
				d(bx + 1 + (st ? 2 : 0), by + 10 + bob, 2, 3, w.robeColor);
				d(bx + 5 - (st ? 2 : 0), by + 10 + bob, 2, 3, w.robeColor);
			} else {
				d(bx + 2, by + 10, 2, 3, w.robeColor);
				d(bx + 4, by + 10, 2, 3, w.robeColor);
			}
			if (!mv && w.activity === "bench" && w.running) {
				const armBob = t >> 2 & 1;
				d(bx - 2, by + 2 + bob + armBob, 2, 3, w.color);
				d(bx + 8, by + 2 + bob + (1 - armBob), 2, 3, w.color);
				if (t % 8 === 0) {
					spawnMagic(bx - 2, by + 3 + bob, w.color, 2);
					spawnMagic(bx + 9, by + 3 + bob, w.color, 2);
				}
			}
			const kindEmoji = w.kind === "cron" ? "⏳" : w.kind === "spawn" ? "🔮" : "📜";
			X.font = 2 * S$4 + "px monospace";
			X.fillText(kindEmoji, (bx + 8) * S$4, (by - 14 + bob) * S$4);
			if (w.benchIdx >= 0 && w.activity !== "entering") {
				const bp = BENCH_POSITIONS[w.benchIdx];
				drawLabel(T, sliceCodePoints(w.name, 0, 8), (bp.x + 20) * S$4, (bp.y - 4) * S$4, {
					role: "label",
					color: "#fff",
					bgColor: w.color,
					align: "center",
					scale: S$4
				});
			}
			drawLabel(T, w.running ? i18nT("pages.scenes.wizardTowerScene.casting") : i18nT("pages.scenes.wizardTowerScene.resting"), (bx + 4) * S$4, (by - 18 + bob) * S$4, {
				role: "status",
				color: w.running ? "#4f4" : "#888",
				bgColor: "rgba(0,0,0,0.5)",
				align: "center",
				scale: S$4
			});
			if (w.lastMessage && Date.now() - w.msgAt < 7e3) {
				const msgAge = Date.now() - w.msgAt;
				const msgAlpha = msgAge > 6e3 ? (SPEECH_BUBBLE_MS - msgAge) / 1e3 : 1;
				drawSpeechBubble(T, w.lastMessage, (bx + 4) * S$4, (by - 22 + bob) * S$4, {
					scale: S$4,
					alpha: msgAlpha
				});
			}
			const nameLines = drawLabel(T, w.name, (bx + 4) * S$4, (by + 16) * S$4, {
				role: "name",
				weight: "bold",
				color: "#fff",
				align: "center",
				scale: S$4,
				maxWidth: 64 * S$4
			});
			if (w.detail) drawLabel(T, w.detail, (bx - 2) * S$4, (by + 20) * S$4 + (nameLines - 1) * sceneLineHeight("name"), {
				role: "detail",
				color: "#999",
				scale: S$4
			});
		};
		const drawParticles = () => {
			particlesRef.current.forEach((p) => {
				const alpha = Math.max(0, .6 * (1 - p.life / p.maxLife));
				X.fillStyle = p.color;
				X.globalAlpha = alpha;
				X.fillRect(p.x * S$4, p.y * S$4, p.size * S$4, p.size * S$4);
				X.globalAlpha = 1;
			});
		};
		const drawSpellText = (_t) => {
			const sp = spellRef.current;
			if (!sp || sp.life <= 0) return;
			sp.life--;
			sp.y -= .15;
			const alpha = Math.min(1, sp.life / 30);
			T.fillStyle = `rgba(255,200,50,${alpha})`;
			T.font = sceneFont("spell", "bold");
			T.textAlign = "center";
			T.fillText(sp.text, sp.x * S$4, sp.y * S$4);
			T.textAlign = "start";
		};
		const drawTitle = () => {
			T.fillStyle = "#f90";
			T.font = sceneFont("title", "bold");
			T.textAlign = "center";
			T.fillText(i18nT("pages.scenes.wizardTowerScene.arcane_academy"), W$3 / 2 * S$4, 20 * S$4);
			T.textAlign = "start";
			T.fillStyle = "#666";
			T.font = sceneFont("status");
			T.fillText(`${wizardsRef.current.length}/${MAX_BENCHES} wizards`, 4 * S$4, 336 * S$4);
		};
		const update = (t) => {
			particlesRef.current.forEach((p) => {
				p.x += p.vx;
				p.y += p.vy;
				p.vx += (Math.random() - .5) * .02;
				p.life++;
			});
			particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
			const wizards = wizardsRef.current;
			wizards.forEach((w) => {
				const ddx = w.tx - w.x, ddy = w.ty - w.y;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy);
				if (dist > 1.5) {
					w.x += ddx / dist * .6;
					w.y += ddy / dist * .6;
				} else {
					w.x = w.tx;
					w.y = w.ty;
					if (w.activity === "entering") w.activity = "bench";
					if (w.activity === "circle") w.castTimer++;
					if (w.activity === "shelf") {
						w.castTimer++;
						if (w.castTimer % 240 === 60 && (!spellRef.current || spellRef.current.life <= 0)) spellRef.current = {
							text: i18nT("pages.scenes.wizardTowerScene.i_see"),
							x: w.x,
							y: w.y - 20,
							life: 60
						};
						if (w.castTimer > 600) {
							const bp = BENCH_POSITIONS[w.benchIdx];
							w.tx = bp.x + 15;
							w.ty = bp.y + 20;
							w.activity = "bench";
							w.castTimer = 0;
						}
					}
				}
			});
			const circleWizards = wizards.filter((w) => w.activity === "circle");
			if (circleWizards.length >= 2) {
				const allArrived = circleWizards.every((w) => Math.abs(w.x - w.tx) < 2 && Math.abs(w.y - w.ty) < 2);
				const minTimer = Math.min(...circleWizards.map((w) => w.castTimer));
				if (allArrived && minTimer === 60) {
					const spell = SPELL_WORDS[Math.random() * SPELL_WORDS.length | 0];
					spellRef.current = {
						text: spell,
						x: CIRCLE_POS.x,
						y: CIRCLE_POS.y - 20,
						life: 80
					};
					for (let i = 0; i < 20; i++) spawnMagic(CIRCLE_POS.x, CIRCLE_POS.y, "#f90", 1);
				}
				if (minTimer > 600) circleWizards.forEach((w) => {
					const bp = BENCH_POSITIONS[w.benchIdx];
					w.tx = bp.x + 15;
					w.ty = bp.y + 20;
					w.activity = "bench";
					w.castTimer = 0;
				});
			}
			const benchWizards = wizards.filter((w) => w.activity === "bench");
			if (t % 2400 === 600 && benchWizards.length >= 2 && Math.random() < .25) {
				const a = benchWizards[0], b = benchWizards[1];
				a.activity = "circle";
				b.activity = "circle";
				a.castTimer = 0;
				b.castTimer = 0;
				a.tx = CIRCLE_POS.x - 15;
				a.ty = CIRCLE_POS.y + 5;
				b.tx = CIRCLE_POS.x + 10;
				b.ty = CIRCLE_POS.y + 5;
			}
			if (t % 3e3 === 1200 && benchWizards.length > 0 && Math.random() < .2) {
				const w = benchWizards[Math.random() * benchWizards.length | 0];
				if (w.activity === "bench") {
					w.activity = "shelf";
					w.castTimer = 0;
					w.tx = 380;
					w.ty = 80;
				}
			}
			if (t % 10 === 0) spawnMagic(Math.random() * W$3, 85 + Math.random() * 250, "#9b59b640", 1);
		};
		const draw = (t) => {
			T.clearRect(0, 0, W$3 * S$4, H$3 * S$4);
			drawWalls();
			drawArchwayDoor(t);
			drawWindow(80, 20, t);
			drawWindow(180, 20, t);
			drawTitle();
			drawShelf(370, 80, t);
			drawShelf(420, 80, t);
			drawCrystalBall(340, 100, t);
			drawSummoningCircle(t);
			const occupied = new Set(wizardsRef.current.map((w) => w.benchIdx));
			BENCH_POSITIONS.forEach((bp, i) => drawWorkbench(bp.x, bp.y, occupied.has(i), i, t));
			drawParticles();
			[...wizardsRef.current].sort((a, b) => a.y - b.y).forEach((w) => drawWizard(w, t));
			drawSpellText(t);
		};
		const cancelLoop = runSceneLoop(visibleRef, tickRef, update, draw);
		return () => {
			cancelLoop();
		};
	}, []);
	useVisibleSync(visibleRef, visible);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$3, H$3),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.wizardTowerScene.wizard_tower_scene"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.wizardTowerScene.wizard_tower_spell_text"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/UnderwaterLabScene.tsx
var UNDERWATER_THEME = {
	active: "Exploring the deep",
	idle: "Surfacing for air"
};
var W$2 = 480;
var H$2 = 340;
var S$3 = SCENE_SCALE;
var MAX_DOMES = 8;
var SUIT_COLORS = [
	"#e74c3c",
	"#3498db",
	"#f39c12",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#2ecc71",
	"#e84393"
];
var HELMET_COLORS = [
	"#c0392b",
	"#2471a3",
	"#d4ac0d",
	"#7d3c98",
	"#148f77",
	"#ca6f1e",
	"#1e8449",
	"#c2185b"
];
var DOME_POSITIONS = [
	{
		x: 30,
		y: 130
	},
	{
		x: 130,
		y: 130
	},
	{
		x: 230,
		y: 130
	},
	{
		x: 330,
		y: 130
	},
	{
		x: 30,
		y: 230
	},
	{
		x: 130,
		y: 230
	},
	{
		x: 230,
		y: 230
	},
	{
		x: 330,
		y: 230
	}
];
var AIRLOCK = {
	x: 0,
	y: 120,
	w: 14,
	h: 60
};
var SONAR_POS = {
	x: 430,
	y: 180
};
var COL$1 = {
	deepWater: "#0a1628",
	midWater: "#0e1e38",
	lightWater: "#122848",
	sand: "#3a3020",
	sandLight: "#4a4030",
	sandDark: "#2a2018",
	glass: "rgba(100,180,255,0.15)",
	glassEdge: "rgba(100,180,255,0.3)",
	metal: "#556",
	metalLight: "#778",
	metalDark: "#334",
	screen: "#0a2a0a",
	screenText: "#33ff88",
	screenGlow: "rgba(50,255,130,0.06)",
	coral: "#e74c3c",
	coralPink: "#ff6b9d",
	coralOrange: "#ff8c42",
	kelp: "#2d6a4f",
	kelpLight: "#40916c",
	tube: "rgba(100,180,255,0.12)",
	tubeEdge: "rgba(100,180,255,0.25)",
	light: "#4af",
	lightGlow: "rgba(70,170,255,0.08)",
	bubbleColor: "rgba(150,220,255,0.3)",
	warning: "#f90",
	warningGlow: "rgba(255,153,0,0.1)"
};
var SONAR_PINGS = [
	"Scanning…",
	"All clear",
	"Signal OK",
	"Depth: 200m",
	"Sync done",
	"Data recv"
];
function UnderwaterLabScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const diversRef = useRef([]);
	const bubblesRef = useRef([]);
	const fishRef = useRef([]);
	const jellyRef = useRef([]);
	const sonarMsgRef = useRef("");
	const visibleRef = useRef(visible);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, diversRef, W$2, H$2, UNDERWATER_THEME, 10, void 0, agents);
	useEffect(() => {
		const fish = [];
		for (let i = 0; i < 8; i++) fish.push({
			x: Math.random() * W$2,
			y: 30 + Math.random() * 280,
			vx: (Math.random() < .5 ? 1 : -1) * (.15 + Math.random() * .25),
			color: [
				"#f39c12",
				"#e74c3c",
				"#3498db",
				"#2ecc71",
				"#9b59b6",
				"#1abc9c"
			][i % 6],
			size: 2 + Math.random() * 2,
			tailPhase: Math.random() * Math.PI * 2
		});
		fishRef.current = fish;
		const jellies = [];
		for (let i = 0; i < 4; i++) jellies.push({
			x: 50 + Math.random() * 380,
			y: Math.random() * H$2,
			vy: -.08 - Math.random() * .06,
			phase: Math.random() * Math.PI * 2,
			color: [
				"rgba(200,100,255,0.4)",
				"rgba(100,200,255,0.35)",
				"rgba(255,150,200,0.35)",
				"rgba(100,255,200,0.3)"
			][i],
			size: 4 + Math.random() * 3
		});
		jellyRef.current = jellies;
	}, []);
	useEffect(() => {
		const existing = diversRef.current;
		const newDivers = [];
		agents.forEach((src, i) => {
			const prev = existing.find((d) => d.id === src.id);
			if (prev) {
				prev.name = src.name;
				prev.running = src.running;
				prev.detail = src.detail;
				prev.kind = src.kind;
				newDivers.push(prev);
			} else {
				const domeIdx = DOME_POSITIONS.findIndex((_, di) => !existing.some((d) => d.domeIdx === di) && !newDivers.some((d) => d.domeIdx === di));
				if (domeIdx < 0) return;
				const dp = DOME_POSITIONS[domeIdx];
				const known = isKnownAgent("underwater", src.id);
				newDivers.push({
					id: src.id,
					name: src.name,
					kind: src.kind,
					x: known ? dp.x + 20 : AIRLOCK.x + 7,
					y: known ? dp.y + 25 : AIRLOCK.y + 30,
					tx: dp.x + 20,
					ty: dp.y + 25,
					domeIdx,
					color: SUIT_COLORS[i % SUIT_COLORS.length],
					suitColor: HELMET_COLORS[i % HELMET_COLORS.length],
					running: src.running,
					detail: src.detail,
					swimPhase: Math.random() * Math.PI * 2,
					activity: known ? "dome" : "entering",
					actTimer: 0
				});
				markAgentsKnown("underwater", [src.id]);
			}
		});
		diversRef.current = newDivers;
		pruneAgents("underwater", newDivers.map((d) => d.id));
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W$2, H$2, S$3);
		const spawnBubble = (bx, by) => {
			if (bubblesRef.current.length < 40) bubblesRef.current.push({
				x: bx,
				y: by,
				r: .5 + Math.random() * 1.5,
				speed: .15 + Math.random() * .2,
				wobble: Math.random() * Math.PI * 2,
				phase: Math.random() * .05
			});
		};
		const drawOcean = (t) => {
			const grad = X.createLinearGradient(0, 0, 0, H$2 * S$3);
			grad.addColorStop(0, COL$1.midWater);
			grad.addColorStop(.4, COL$1.deepWater);
			grad.addColorStop(1, "#060e1a");
			X.fillStyle = grad;
			X.fillRect(0, 0, W$2 * S$3, H$2 * S$3);
			for (let i = 0; i < 5; i++) {
				const rx = 60 + i * 90 + Math.sin(t * .005 + i) * 15;
				const grad2 = X.createLinearGradient(rx * S$3, 0, (rx + 20) * S$3, H$2 * S$3);
				grad2.addColorStop(0, "rgba(70,170,255,0.04)");
				grad2.addColorStop(.5, "rgba(70,170,255,0.015)");
				grad2.addColorStop(1, "transparent");
				X.fillStyle = grad2;
				X.beginPath();
				X.moveTo((rx - 5) * S$3, 0);
				X.lineTo((rx + 25) * S$3, 0);
				X.lineTo((rx + 40) * S$3, H$2 * S$3);
				X.lineTo((rx - 20) * S$3, H$2 * S$3);
				X.fill();
			}
		};
		const drawSeafloor = (t) => {
			d(0, 310, W$2, 30, COL$1.sand);
			for (let i = 0; i < W$2; i += 12) {
				d(i, 310, 12, 1, COL$1.sandLight);
				d(i + 6, 312, 8, 1, COL$1.sandDark);
			}
			[
				{
					x: 20,
					y: 305,
					c: COL$1.coral
				},
				{
					x: 100,
					y: 302,
					c: COL$1.coralPink
				},
				{
					x: 200,
					y: 307,
					c: COL$1.coralOrange
				},
				{
					x: 350,
					y: 304,
					c: COL$1.coral
				},
				{
					x: 440,
					y: 306,
					c: COL$1.coralPink
				}
			].forEach((cr) => {
				const sway = Math.sin(t * .01 + cr.x) * .5;
				d(cr.x, cr.y, 4, 6, cr.c);
				d(cr.x - 2 + sway, cr.y - 3, 3, 5, cr.c);
				d(cr.x + 3 + sway, cr.y - 2, 3, 4, cr.c);
			});
			[
				60,
				160,
				280,
				400,
				460
			].forEach((kx, i) => {
				for (let j = 0; j < 4; j++) {
					const sway = Math.sin(t * .012 + i + j * .5) * 2;
					d(kx + sway, 305 - j * 8, 2, 9, j % 2 ? COL$1.kelp : COL$1.kelpLight);
				}
			});
		};
		const drawDome = (dx, dy, occupied, idx, t) => {
			const r = 22;
			X.beginPath();
			X.arc((dx + 20) * S$3, (dy + 15) * S$3, r * S$3, Math.PI, 0);
			X.lineTo((dx + 42) * S$3, (dy + 30) * S$3);
			X.lineTo((dx - 2) * S$3, (dy + 30) * S$3);
			X.closePath();
			X.fillStyle = COL$1.glass;
			X.fill();
			X.strokeStyle = COL$1.glassEdge;
			X.lineWidth = S$3;
			X.stroke();
			d(dx - 4, dy + 28, 48, 4, COL$1.metal);
			d(dx - 4, dy + 32, 48, 2, COL$1.metalDark);
			d(dx, dy + 34, 3, 8, COL$1.metalDark);
			d(dx + 37, dy + 34, 3, 8, COL$1.metalDark);
			d(dx, dy + 24, 40, 4, COL$1.metalLight);
			d(dx + 12, dy + 10, 16, 12, COL$1.metalDark);
			d(dx + 13, dy + 11, 14, 10, occupied ? COL$1.screen : "#111");
			if (occupied) {
				for (let i = 0; i < 4; i++) {
					const lw = 3 + (t + i * 5) % 4;
					d(dx + 14, dy + 12 + i * 2, lw, 1, COL$1.screenText);
				}
				if (t >> 3 & 1) d(dx + 14 + (t >> 2) % 6, dy + 12 + (t >> 4) % 4 * 2, 1, 1, "#fff");
				X.fillStyle = COL$1.screenGlow;
				X.fillRect((dx + 10) * S$3, (dy + 20) * S$3, 20 * S$3, 6 * S$3);
			}
			if (occupied) {
				const flicker = .6 + Math.sin(t * .04 + idx) * .2;
				const grad = X.createRadialGradient((dx + 20) * S$3, (dy + 5) * S$3, 0, (dx + 20) * S$3, (dy + 5) * S$3, 15 * S$3);
				grad.addColorStop(0, `rgba(70,170,255,${.1 * flicker})`);
				grad.addColorStop(1, "transparent");
				X.fillStyle = grad;
				X.fillRect((dx + 5) * S$3, (dy - 10) * S$3, 30 * S$3, 30 * S$3);
			}
			if (occupied && t % 20 === idx * 2) spawnBubble(dx + 10 + Math.random() * 20, dy - 5);
			if (!occupied) drawLabel(T, "vacant", (dx + 20) * S$3, (dy + 5) * S$3, {
				role: "label",
				color: "#556",
				bgColor: COL$1.metalDark,
				align: "center",
				scale: S$3
			});
		};
		const drawConnectingTubes = () => {
			for (let row = 0; row < 2; row++) {
				const base = row * 4;
				for (let i = 0; i < 3; i++) {
					const a = DOME_POSITIONS[base + i], b = DOME_POSITIONS[base + i + 1];
					const ty = a.y + 26;
					X.fillStyle = COL$1.tube;
					X.fillRect((a.x + 42) * S$3, ty * S$3, (b.x - a.x - 42) * S$3, 6 * S$3);
					X.strokeStyle = COL$1.tubeEdge;
					X.lineWidth = S$3;
					X.strokeRect((a.x + 42) * S$3, ty * S$3, (b.x - a.x - 42) * S$3, 6 * S$3);
				}
			}
			for (let i = 0; i < 4; i++) {
				const top = DOME_POSITIONS[i], bot = DOME_POSITIONS[i + 4];
				const tx = top.x + 18;
				X.fillStyle = COL$1.tube;
				X.fillRect(tx * S$3, (top.y + 34) * S$3, 6 * S$3, (bot.y - top.y - 34) * S$3);
				X.strokeStyle = COL$1.tubeEdge;
				X.lineWidth = S$3;
				X.strokeRect(tx * S$3, (top.y + 34) * S$3, 6 * S$3, (bot.y - top.y - 34) * S$3);
			}
		};
		const drawAirlock = (t) => {
			const { x, y, w, h } = AIRLOCK;
			d(x, y, w, h, COL$1.metalDark);
			d(x + 2, y + 3, w - 4, h - 6, COL$1.metal);
			X.beginPath();
			X.arc((x + 7) * S$3, (y + h / 2) * S$3, 5 * S$3, 0, Math.PI * 2);
			X.strokeStyle = COL$1.metalLight;
			X.lineWidth = S$3;
			X.stroke();
			if (diversRef.current.some((d) => d.activity === "entering")) {
				const blink = t >> 3 & 1;
				d(x + 5, y - 3, 4, 3, blink ? COL$1.warning : COL$1.metalDark);
				if (blink) {
					X.fillStyle = COL$1.warningGlow;
					X.fillRect(x * S$3, (y - 5) * S$3, w * S$3, 8 * S$3);
				}
			}
			T.fillStyle = "#556";
			T.font = sceneFont("label");
			T.fillText("LOCK", (x + 2) * S$3, (y - 1) * S$3);
		};
		const drawSonarStation = (t) => {
			const { x, y } = SONAR_POS;
			d(x - 18, y - 15, 36, 30, COL$1.metalDark);
			d(x - 16, y - 13, 32, 20, "#0a1a0a");
			const sweepAngle = t * .03 % (Math.PI * 2);
			X.strokeStyle = "#0f03";
			X.lineWidth = S$3;
			X.beginPath();
			X.arc(x * S$3, (y - 3) * S$3, 14 * S$3, 0, Math.PI * 2);
			X.stroke();
			X.beginPath();
			X.arc(x * S$3, (y - 3) * S$3, 8 * S$3, 0, Math.PI * 2);
			X.stroke();
			X.strokeStyle = "#3f8";
			X.lineWidth = 1.5 * S$3;
			X.beginPath();
			X.moveTo(x * S$3, (y - 3) * S$3);
			X.lineTo((x + Math.cos(sweepAngle) * 14) * S$3, (y - 3 + Math.sin(sweepAngle) * 14) * S$3);
			X.stroke();
			diversRef.current.forEach((dv, i) => {
				if (!dv.running) return;
				const ba = i / diversRef.current.length * Math.PI * 2;
				const br = 5 + i % 3 * 3;
				d(x + Math.cos(ba) * br - .5, y - 3 + Math.sin(ba) * br - .5, 1.5, 1.5, "#4f8");
			});
			if (sonarMsgRef.current) {
				T.fillStyle = COL$1.screenText;
				T.font = sceneFont("label");
				T.fillText(sonarMsgRef.current, (x - 14) * S$3, (y + 10) * S$3);
			}
			T.fillStyle = "#556";
			T.font = sceneFont("label");
			T.fillText("SONAR", (x - 8) * S$3, (y + 18) * S$3);
		};
		const drawFish = (_t) => {
			fishRef.current.forEach((f) => {
				f.x += f.vx;
				if (f.x > 490) f.x = -10;
				if (f.x < -10) f.x = 490;
				f.tailPhase += .08;
				const tailOff = Math.sin(f.tailPhase) * 1.5;
				const dir = f.vx > 0 ? 1 : -1;
				d(f.x, f.y, f.size * 2, f.size, f.color);
				d(f.x - dir * f.size + tailOff, f.y - .5, f.size, f.size + 1, f.color);
				d(f.x + (dir > 0 ? f.size * 1.5 : .5), f.y + .5, 1, 1, "#fff");
			});
		};
		const drawJellyfish = (t) => {
			jellyRef.current.forEach((j) => {
				j.y += j.vy;
				j.x += Math.sin(t * .008 + j.phase) * .15;
				if (j.y < -20) {
					j.y = 350;
					j.x = 50 + Math.random() * 380;
				}
				const pulse = Math.sin(t * .04 + j.phase) * .3;
				X.beginPath();
				X.arc(j.x * S$3, j.y * S$3, (j.size + pulse) * S$3, Math.PI, 0);
				X.fillStyle = j.color;
				X.fill();
				for (let i = 0; i < 3; i++) {
					const tx = j.x - j.size + 1 + i * j.size;
					const sway = Math.sin(t * .02 + i + j.phase) * 2;
					X.strokeStyle = j.color;
					X.lineWidth = S$3 * .5;
					X.beginPath();
					X.moveTo(tx * S$3, (j.y + 1) * S$3);
					X.quadraticCurveTo((tx + sway) * S$3, (j.y + j.size + 3) * S$3, (tx + sway * .5) * S$3, (j.y + j.size * 2) * S$3);
					X.stroke();
				}
				const grad = X.createRadialGradient(j.x * S$3, j.y * S$3, 0, j.x * S$3, j.y * S$3, (j.size + 4) * S$3);
				grad.addColorStop(0, j.color);
				grad.addColorStop(1, "transparent");
				X.fillStyle = grad;
				X.globalAlpha = .15;
				X.fillRect((j.x - j.size - 4) * S$3, (j.y - j.size - 4) * S$3, (j.size * 2 + 8) * S$3, (j.size * 3 + 8) * S$3);
				X.globalAlpha = 1;
			});
		};
		const drawBubbles = () => {
			bubblesRef.current.forEach((b) => {
				X.beginPath();
				X.arc(b.x * S$3, b.y * S$3, b.r * S$3, 0, Math.PI * 2);
				X.strokeStyle = COL$1.bubbleColor;
				X.lineWidth = S$3 * .5;
				X.stroke();
				X.fillStyle = "rgba(200,240,255,0.15)";
				X.fillRect((b.x - b.r * .3) * S$3, (b.y - b.r * .3) * S$3, b.r * .5 * S$3, b.r * .5 * S$3);
			});
		};
		const drawDiver = (dv, t) => {
			const bx = dv.x | 0, by = dv.y | 0;
			const mv = Math.abs(dv.x - dv.tx) > 1.5 || Math.abs(dv.y - dv.ty) > 1.5;
			const swim = mv ? Math.sin(t * .1 + dv.swimPhase) * 1.5 : 0;
			const dir = dv.tx > dv.x ? 1 : -1;
			if (mv) {
				const kick = Math.sin(t * .15 + dv.swimPhase);
				const bodyBob = Math.sin(t * .06 + dv.swimPhase) * 1.2;
				X.fillStyle = "rgba(70,170,255,0.06)";
				X.fillRect((bx - 2) * S$3, (by + 4 + bodyBob) * S$3, 16 * S$3, 4 * S$3);
				d(bx, by + bodyBob, 12, 6, dv.color);
				const hx = dir > 0 ? bx + 10 : bx - 5;
				X.beginPath();
				X.arc((hx + 2.5) * S$3, (by + 3 + bodyBob) * S$3, 4 * S$3, 0, Math.PI * 2);
				X.fillStyle = dv.suitColor;
				X.fill();
				const vx = dir > 0 ? hx + 1 : hx - 1;
				d(vx, by + 1 + bodyBob, 4, 3, "#1a3050");
				d(vx + .5, by + 1.5 + bodyBob, 3, 2, "#2a5080");
				if (!(t % 110 < 3)) d(vx + 1, by + 2 + bodyBob, 1, 1, "#adf");
				const tankX = dir > 0 ? bx - 3 : bx + 13;
				d(tankX, by - 1 + bodyBob, 3, 4, COL$1.metalDark);
				d(tankX, by + 3 + bodyBob, 3, 4, COL$1.metalDark);
				d(tankX + 1, by - 2 + bodyBob, 1, 1, COL$1.metalLight);
				X.strokeStyle = COL$1.metalLight;
				X.lineWidth = S$3 * .8;
				X.beginPath();
				X.moveTo((tankX + 1.5) * S$3, (by + bodyBob) * S$3);
				X.quadraticCurveTo((bx + 6) * S$3, (by - 2 + bodyBob) * S$3, (hx + 2.5) * S$3, (by + 1 + bodyBob) * S$3);
				X.stroke();
				const armSwing = Math.sin(t * .12 + dv.swimPhase) * 2;
				const armX = dir > 0 ? hx + 3 : hx - 2;
				d(armX, by - 1 + bodyBob + armSwing, 2, 2, dv.color);
				d(armX, by + 4 + bodyBob - armSwing, 2, 2, dv.color);
				const legX = dir > 0 ? bx - 2 : bx + 12;
				const kick1 = kick * 3;
				const kick2 = -kick * 3;
				d(legX, by + 1 + bodyBob + kick1, 3, 2, dv.suitColor);
				d(legX + (dir > 0 ? -2 : 2), by + 1 + bodyBob + kick1, 3, 1.5, "#2a5a2a");
				d(legX, by + 4 + bodyBob + kick2, 3, 2, dv.suitColor);
				d(legX + (dir > 0 ? -2 : 2), by + 4 + bodyBob + kick2, 3, 1.5, "#2a5a2a");
				if (t % 6 === 0) spawnBubble(hx + 2, by - 2 + bodyBob);
				if (t % 10 === 0) spawnBubble(hx + 1 + Math.random() * 3, by - 3 + bodyBob);
				const wakeX = dir > 0 ? bx - 4 : bx + 14;
				X.fillStyle = "rgba(150,220,255,0.08)";
				X.fillRect((wakeX - 2) * S$3, (by + 1 + bodyBob) * S$3, 6 * S$3, 4 * S$3);
			} else {
				X.fillStyle = "rgba(0,0,0,0.1)";
				X.fillRect((bx + 1) * S$3, (by + 11) * S$3, 6 * S$3, 2 * S$3);
				d(bx, by, 8, 9, dv.color);
				X.beginPath();
				X.arc((bx + 4) * S$3, (by - 3) * S$3, 4.5 * S$3, 0, Math.PI * 2);
				X.fillStyle = dv.suitColor;
				X.fill();
				d(bx + 1, by - 5, 6, 4, "#1a3050");
				d(bx + 2, by - 4, 4, 2, "#2a5080");
				if (!(t % 110 < 3)) {
					d(bx + 2, by - 4, 1, 1, "#adf");
					d(bx + 5, by - 4, 1, 1, "#adf");
				}
				d(bx + 7, by - 2, 3, 7, COL$1.metalDark);
				d(bx + 8, by - 3, 1, 1, COL$1.metalLight);
				d(bx + 2, by + 9, 2, 4, dv.suitColor);
				d(bx + 4, by + 9, 2, 4, dv.suitColor);
				d(bx + 1, by + 13, 3, 1, "#2a5a2a");
				d(bx + 4, by + 13, 3, 1, "#2a5a2a");
				if (dv.activity === "dome" && dv.running) {
					const armBob = t >> 2 & 1;
					d(bx - 1, by + 2 + armBob, 1, 3, dv.color);
					d(bx + 8, by + 2 + (1 - armBob), 1, 3, dv.color);
				}
				if (t % 40 === 0) spawnBubble(bx + 4, by - 7);
			}
			const kindEmoji = dv.kind === "cron" ? "⏱️" : dv.kind === "spawn" ? "🐙" : "🫧";
			X.font = 2 * S$3 + "px monospace";
			X.fillText(kindEmoji, (bx + 9) * S$3, (by - 5 + swim) * S$3);
			drawLabel(T, dv.running ? "online" : "standby", (bx + 4) * S$3, (by - 11 + swim) * S$3, {
				role: "status",
				color: dv.running ? "#4ff" : "#668",
				bgColor: "rgba(0,0,0,0.5)",
				align: "center",
				scale: S$3
			});
			T.fillStyle = "#cef";
			T.font = sceneFont("name", "bold");
			T.textAlign = "center";
			T.fillText(dv.name, (bx + 4) * S$3, (by + 16) * S$3);
			T.textAlign = "start";
			if (dv.detail) {
				T.fillStyle = "#668";
				T.font = sceneFont("detail");
				T.fillText(dv.detail, (bx - 4) * S$3, (by + 20) * S$3);
			}
			if (dv.domeIdx >= 0 && dv.activity !== "entering") {
				const dp = DOME_POSITIONS[dv.domeIdx];
				drawLabel(T, sliceCodePoints(dv.name, 0, 8), (dp.x + 20) * S$3, (dp.y + 5) * S$3, {
					role: "label",
					color: "#fff",
					bgColor: dv.color,
					align: "center",
					scale: S$3
				});
			}
		};
		const drawTitle = () => {
			T.fillStyle = COL$1.light;
			T.font = sceneFont("title", "bold");
			T.textAlign = "center";
			T.fillText(i18nT("pages.scenes.underwaterLabScene.deep_sea_lab"), W$2 / 2 * S$3, 20 * S$3);
			T.fillStyle = "#446";
			T.font = sceneFont("status");
			T.fillText(i18nT("pages.scenes.underwaterLabScene.research_station"), W$2 / 2 * S$3, 30 * S$3);
			T.textAlign = "start";
			T.fillStyle = "#446";
			T.font = sceneFont("label");
			T.fillText(`${diversRef.current.length}/${MAX_DOMES} divers`, 4 * S$3, 336 * S$3);
		};
		const update = (t) => {
			bubblesRef.current.forEach((b) => {
				b.y -= b.speed;
				b.x += Math.sin(b.wobble) * .2;
				b.wobble += b.phase;
			});
			bubblesRef.current = bubblesRef.current.filter((b) => b.y > -5);
			const divers = diversRef.current;
			divers.forEach((dv) => {
				const ddx = dv.tx - dv.x, ddy = dv.ty - dv.y;
				const dist = Math.sqrt(ddx * ddx + ddy * ddy);
				if (dist > 1.5) {
					dv.x += ddx / dist * .4;
					dv.y += ddy / dist * .4;
				} else {
					dv.x = dv.tx;
					dv.y = dv.ty;
					if (dv.activity === "entering") dv.activity = "dome";
					if (dv.activity === "sonar" || dv.activity === "tube") {
						dv.actTimer++;
						if (dv.activity === "sonar" && dv.actTimer === 1) sonarMsgRef.current = SONAR_PINGS[Math.random() * SONAR_PINGS.length | 0];
						if (dv.activity === "sonar" && dv.actTimer > 300) {
							const dp = DOME_POSITIONS[dv.domeIdx];
							dv.tx = dp.x + 20;
							dv.ty = dp.y + 25;
							dv.activity = "dome";
							dv.actTimer = 0;
							sonarMsgRef.current = "";
						}
						if (dv.activity === "tube" && dv.actTimer > 300) {
							const dp = DOME_POSITIONS[dv.domeIdx];
							dv.tx = dp.x + 20;
							dv.ty = dp.y + 25;
							dv.activity = "dome";
							dv.actTimer = 0;
						}
					}
				}
			});
			const domeAgents = divers.filter((d) => d.activity === "dome");
			if (t % 2400 === 600 && domeAgents.length > 0 && Math.random() < .2) {
				const dv = domeAgents[Math.random() * domeAgents.length | 0];
				dv.activity = "sonar";
				dv.actTimer = 0;
				dv.tx = SONAR_POS.x - 20;
				dv.ty = SONAR_POS.y + 5;
			}
			if (t % 3e3 === 1200 && domeAgents.length >= 2 && Math.random() < .2) {
				const a = domeAgents[0], b = domeAgents[1];
				a.activity = "tube";
				b.activity = "tube";
				a.actTimer = 0;
				b.actTimer = 0;
				const dpB = DOME_POSITIONS[b.domeIdx], dpA = DOME_POSITIONS[a.domeIdx];
				a.tx = dpB.x + 20;
				a.ty = dpB.y + 25;
				b.tx = dpA.x + 20;
				b.ty = dpA.y + 25;
			}
			if (t % 15 === 0) spawnBubble(Math.random() * W$2, 315);
		};
		const draw = (t) => {
			T.clearRect(0, 0, W$2 * S$3, H$2 * S$3);
			drawOcean(t);
			drawSeafloor(t);
			drawConnectingTubes();
			drawAirlock(t);
			const occupied = new Set(diversRef.current.map((d) => d.domeIdx));
			DOME_POSITIONS.forEach((dp, i) => drawDome(dp.x, dp.y, occupied.has(i), i, t));
			drawSonarStation(t);
			drawFish(t);
			drawJellyfish(t);
			drawBubbles();
			drawTitle();
			[...diversRef.current].sort((a, b) => a.y - b.y).forEach((dv) => drawDiver(dv, t));
		};
		const cancelLoop = runSceneLoop(visibleRef, tickRef, update, draw);
		return () => {
			cancelLoop();
		};
	}, []);
	useVisibleSync(visibleRef, visible);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$2, H$2),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.underwaterLabScene.underwater_lab_scene"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.underwaterLabScene.underwater_lab_scene_labels"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/mission-control/parts.ts
var S$2 = SCENE_SCALE;
var DOOR = {
	x: 0,
	y: 210,
	w: 12,
	h: 40
};
var STATION_POSITIONS = [
	{
		x: 60,
		y: 180
	},
	{
		x: 130,
		y: 180
	},
	{
		x: 200,
		y: 180
	},
	{
		x: 270,
		y: 180
	},
	{
		x: 60,
		y: 256
	},
	{
		x: 130,
		y: 256
	},
	{
		x: 200,
		y: 256
	},
	{
		x: 270,
		y: 256
	}
];
var AGENT_COLORS = [
	"#e74c3c",
	"#3498db",
	"#2ecc71",
	"#f39c12",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#e84393"
];
var C = {
	bg: "#0a0e1a",
	floor: "#141828",
	floorLine: "#1c2240",
	wall: "#0e1224",
	wallTrim: "#2a3060",
	console: "#1a1e30",
	consoleTop: "#222840",
	consoleEdge: "#2a3060",
	screen: "#0a1a0a",
	screenGlow: "#0f2a0f",
	screenText: "#33ff88",
	screenDim: "#1a3a2a",
	screenOff: "#0a0e0a",
	bigScreen: "#0a0a2a",
	bigScreenBorder: "#3a4080",
	bigScreenText: "#88aaff",
	bigScreenGrid: "#1a1a3a",
	led: {
		on: "#33ff55",
		off: "#1a3a1a",
		warn: "#ffaa33",
		err: "#ff3333"
	},
	chair: "#1a1a2a",
	star: "#ffffff",
	doorFrame: "#2a3060",
	door: "#1a2040",
	doorLight: "#33ff88"
};
var FONT = {
	A: [
		7,
		5,
		7,
		5,
		5
	],
	B: [
		6,
		5,
		6,
		5,
		6
	],
	C: [
		7,
		4,
		4,
		4,
		7
	],
	D: [
		6,
		5,
		5,
		5,
		6
	],
	E: [
		7,
		4,
		7,
		4,
		7
	],
	F: [
		7,
		4,
		7,
		4,
		4
	],
	G: [
		7,
		4,
		5,
		5,
		7
	],
	H: [
		5,
		5,
		7,
		5,
		5
	],
	I: [
		7,
		2,
		2,
		2,
		7
	],
	J: [
		7,
		1,
		1,
		5,
		7
	],
	K: [
		5,
		5,
		6,
		5,
		5
	],
	L: [
		4,
		4,
		4,
		4,
		7
	],
	M: [
		5,
		7,
		5,
		5,
		5
	],
	N: [
		5,
		7,
		7,
		5,
		5
	],
	O: [
		7,
		5,
		5,
		5,
		7
	],
	P: [
		7,
		5,
		7,
		4,
		4
	],
	Q: [
		7,
		5,
		5,
		7,
		1
	],
	R: [
		7,
		5,
		7,
		6,
		5
	],
	S: [
		7,
		4,
		7,
		1,
		7
	],
	T: [
		7,
		2,
		2,
		2,
		2
	],
	U: [
		5,
		5,
		5,
		5,
		7
	],
	V: [
		5,
		5,
		5,
		5,
		2
	],
	W: [
		5,
		5,
		5,
		7,
		5
	],
	X: [
		5,
		5,
		2,
		5,
		5
	],
	Y: [
		5,
		5,
		7,
		2,
		2
	],
	Z: [
		7,
		1,
		2,
		4,
		7
	],
	"0": [
		7,
		5,
		5,
		5,
		7
	],
	"1": [
		2,
		6,
		2,
		2,
		7
	],
	"2": [
		7,
		1,
		7,
		4,
		7
	],
	"3": [
		7,
		1,
		7,
		1,
		7
	],
	"4": [
		5,
		5,
		7,
		1,
		1
	],
	"5": [
		7,
		4,
		7,
		1,
		7
	],
	"6": [
		7,
		4,
		7,
		5,
		7
	],
	"7": [
		7,
		1,
		1,
		1,
		1
	],
	"8": [
		7,
		5,
		7,
		5,
		7
	],
	"9": [
		7,
		5,
		7,
		1,
		7
	],
	" ": [
		0,
		0,
		0,
		0,
		0
	],
	":": [
		0,
		2,
		0,
		2,
		0
	],
	"[": [
		3,
		2,
		2,
		2,
		3
	],
	"]": [
		6,
		2,
		2,
		2,
		6
	],
	"-": [
		0,
		0,
		7,
		0,
		0
	],
	".": [
		0,
		0,
		0,
		0,
		2
	],
	"!": [
		2,
		2,
		2,
		0,
		2
	],
	"?": [
		7,
		1,
		3,
		0,
		2
	],
	"/": [
		1,
		1,
		2,
		4,
		4
	]
};
function drawText(d, text, x, y, color, scale = 1) {
	let cx = x;
	for (const ch of text.toUpperCase()) {
		const glyph = FONT[ch];
		if (!glyph) {
			cx += 4 * scale;
			continue;
		}
		for (let row = 0; row < 5; row++) {
			const bits = glyph[row];
			if (bits & 4) d(cx, y + row * scale, scale, scale, color);
			if (bits & 2) d(cx + scale, y + row * scale, scale, scale, color);
			if (bits & 1) d(cx + 2 * scale, y + row * scale, scale, scale, color);
		}
		cx += 4 * scale;
	}
}
function darken(hex, amt = 40) {
	const n = parseInt(hex.slice(1), 16);
	const r = Math.max(0, (n >> 16 & 255) - amt);
	const g = Math.max(0, (n >> 8 & 255) - amt);
	const b = Math.max(0, (n & 255) - amt);
	return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function lighten(hex, amt = 30) {
	const n = parseInt(hex.slice(1), 16);
	const r = Math.min(255, (n >> 16 & 255) + amt);
	const g = Math.min(255, (n >> 8 & 255) + amt);
	const b = Math.min(255, (n & 255) + amt);
	return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function drawBubble(d, a, bx, by) {
	if (a.chatTimer <= 0 || a.chatDelay > 0 || !a.chatLine) return;
	const tw = a.chatLine.length * 4 + 4;
	const bx2 = bx + 4 - Math.floor(tw / 2);
	const bo = a.bubbleUp ? -20 : 0;
	d(bx2 - 1, by - 26 + bo, tw + 2, 9, "#fff");
	d(bx2, by - 27 + bo, tw, 1, "#fff");
	d(bx + 3, by - 18 + bo, 2, 2, "#fff");
	drawText(d, a.chatLine, bx2 + 1, by - 25 + bo, "#111", 1);
}
function drawAgent(d, a, _t) {
	const bx = Math.round(a.x), by = Math.round(a.y);
	const ol = "#111";
	const dk = darken(a.color), lt = lighten(a.color);
	const legOff = a.activity === "walking" || a.activity === "entering" || a.activity === "leaving" ? (a.walkFrame >> 3 & 1) * 2 : 0;
	if (a.facing === "back") {
		d(bx + 1, by - 10, 6, 2, dk);
		d(bx, by - 8, 8, 7, dk);
		d(bx - 1, by - 8, 1, 4, "#555");
		d(bx - 2, by - 5, 1, 2, "#888");
		d(bx + 3, by - 1, 2, 1, "#e0b890");
		d(bx - 1, by, 10, 8, a.color);
		d(bx - 1, by, 10, 2, lt);
		d(bx - 1, by + 6, 10, 2, dk);
		const drinking = a.drinkTimer > 0;
		const typing = a.running && a.activity === "sitting" && !drinking;
		const lArmOff = typing && a.walkFrame >> 3 & 1 ? -1 : 0;
		const rArmOff = typing && !(a.walkFrame >> 3 & 1) ? -1 : 0;
		if (drinking) {
			d(bx - 3, by + 1, 2, 4, a.color);
			d(bx - 3, by + 5, 2, 2, "#f0c8a0");
			d(bx + 9, by - 3, 2, 4, a.color);
			d(bx + 9, by - 3, 2, 2, "#f0c8a0");
			if (a.item === "mug") d(bx + 9, by - 5, 3, 3, "#ddd");
			else if (a.item === "cup") d(bx + 10, by - 6, 2, 4, "#aaddff");
		} else {
			d(bx - 3, by + 1 + lArmOff, 2, 4, a.color);
			d(bx - 3, by + 5 + lArmOff, 2, 2, "#f0c8a0");
			d(bx + 9, by + 1 + rArmOff, 2, 4, a.color);
			d(bx + 9, by + 5 + rArmOff, 2, 2, "#f0c8a0");
		}
		drawText(d, a.name.slice(0, 8), bx + 4 - a.name.slice(0, 8).length * 2, by - 16, "#fff", 1);
		drawBubble(d, a, bx, by);
		return;
	}
	const flipX = a.facing === "right";
	const hx = flipX ? bx + 8 : bx - 1;
	const hx2 = flipX ? bx + 9 : bx - 2;
	d(bx + 1, by - 10, 6, 2, dk);
	d(bx, by - 9, 8, 1, ol);
	d(bx - 1, by - 8, 1, 6, ol);
	d(bx + 8, by - 8, 1, 6, ol);
	d(bx, by - 2, 8, 1, ol);
	d(bx, by - 8, 8, 6, "#f0c8a0");
	d(bx, by - 8, 8, 2, "#e0b890");
	const eyeX = flipX ? 4 : 2;
	d(bx + eyeX, by - 6, 1, 1, "#222");
	d(bx + eyeX + 2, by - 6, 1, 1, "#222");
	d(hx, by - 8, 1, 4, "#555");
	d(hx2, by - 5, 1, 2, "#888");
	d(bx - 1, by - 1, 10, 1, ol);
	d(bx - 2, by, 1, 8, ol);
	d(bx + 9, by, 1, 8, ol);
	d(bx - 1, by, 10, 8, a.color);
	d(bx - 1, by, 10, 2, lt);
	d(bx - 1, by + 6, 10, 2, dk);
	d(bx + 1, by + 4, 4, 1, "#f90");
	d(bx + 4, by + 3, 1, 1, "#f90");
	d(bx - 3, by + 1, 2, 6, a.color);
	d(bx - 3, by + 1, 2, 2, lt);
	d(bx + 9, by + 1, 2, 6, a.color);
	d(bx + 9, by + 1, 2, 2, lt);
	d(bx - 3, by + 7, 2, 2, "#f0c8a0");
	d(bx + 9, by + 7, 2, 2, "#f0c8a0");
	if (a.item === "mug") {
		const ix = flipX ? bx + 10 : bx - 5;
		d(ix, by + 5, 3, 3, "#ddd");
		d(ix - 1, by + 6, 1, 1, "#ccc");
	} else if (a.item === "cup") d(flipX ? bx + 10 : bx - 4, by + 4, 2, 4, "#aaddff");
	else if (a.item === "snack") d(flipX ? bx + 10 : bx - 5, by + 5, 3, 2, "#f39c12");
	d(bx, by + 8, 3, 6 - legOff, "#2a2a4a");
	d(bx + 5, by + 8, 3, 6 - (2 - legOff), "#2a2a4a");
	d(bx, by + 8, 3, 2, "#3a3a5a");
	d(bx + 5, by + 8, 3, 2, "#3a3a5a");
	d(bx - 1, by + 14 - legOff, 4, 2, "#1a1a1a");
	d(bx + 5, by + 14 - (2 - legOff), 4, 2, "#1a1a1a");
	drawText(d, a.name.slice(0, 8), bx + 4 - a.name.slice(0, 8).length * 2, by - 16, "#fff", 1);
	drawBubble(d, a, bx, by);
}
function spawnParticles(pool, x, y, color, count, opts) {
	const { vx = 0, vy = -.15, spread = .1, maxLife = 100, size = 1 } = opts || {};
	for (let i = 0; i < count; i++) pool.push({
		x,
		y,
		vx: vx + (Math.random() - .5) * spread,
		vy: vy + (Math.random() - .5) * spread * .5,
		life: 0,
		maxLife: maxLife * (.7 + Math.random() * .6),
		color,
		size
	});
}
function updateParticles(pool) {
	for (const p of pool) {
		p.x += p.vx;
		p.y += p.vy;
		p.vx += (Math.random() - .5) * .01;
		p.life++;
	}
	return pool.filter((p) => p.life < p.maxLife);
}
function drawParticles(_d, X, pool) {
	for (const p of pool) {
		const alpha = Math.max(0, .5 * (1 - p.life / p.maxLife));
		X.fillStyle = p.color;
		X.globalAlpha = alpha;
		X.fillRect(p.x * S$2, p.y * S$2, p.size * S$2, p.size * S$2);
	}
	X.globalAlpha = 1;
}
var CORRIDOR_Y = 228;
var BEHIND_BACK_Y = 290;
var LEFT_AISLE_X = 30;
var RIGHT_AISLE_X = 340;
var DESTINATIONS = {
	coffee: {
		x: 390,
		y: 270
	},
	water: {
		x: 416,
		y: 268
	},
	vending: {
		x: 450,
		y: 190
	},
	trash: {
		x: 25,
		y: 290
	}
};
function buildEntryPath(stationIdx) {
	const pos = STATION_POSITIONS[stationIdx];
	const chairX = pos.x + 21, chairY = pos.y + 20;
	const isTopRow = stationIdx < 4;
	const path = [];
	if (isTopRow) {
		path.push({
			x: LEFT_AISLE_X,
			y: CORRIDOR_Y
		});
		path.push({
			x: chairX,
			y: CORRIDOR_Y
		});
	} else {
		path.push({
			x: LEFT_AISLE_X,
			y: BEHIND_BACK_Y
		});
		path.push({
			x: chairX,
			y: BEHIND_BACK_Y
		});
	}
	path.push({
		x: chairX,
		y: chairY
	});
	return path;
}
function buildExitPath(stationIdx, fromX) {
	const laneY = stationIdx < 4 ? CORRIDOR_Y : BEHIND_BACK_Y;
	return [
		{
			x: fromX,
			y: laneY
		},
		{
			x: LEFT_AISLE_X,
			y: laneY
		},
		{
			x: DOOR.x + 6,
			y: DOOR.y + 20
		}
	];
}
function buildPath(stationIdx, dest) {
	const chairX = STATION_POSITIONS[stationIdx].x + 21;
	const isTopRow = stationIdx < 4;
	const path = [];
	const laneY = isTopRow ? CORRIDOR_Y : BEHIND_BACK_Y;
	path.push({
		x: chairX,
		y: laneY
	});
	const aisleX = dest.x > 300 ? RIGHT_AISLE_X : LEFT_AISLE_X;
	path.push({
		x: aisleX,
		y: laneY
	});
	if (Math.abs(laneY - dest.y) > 10) path.push({
		x: aisleX,
		y: dest.y
	});
	path.push({
		x: dest.x,
		y: dest.y
	});
	return path;
}
function buildReturnPath(stationIdx, fromX, fromY) {
	const pos = STATION_POSITIONS[stationIdx];
	const chairX = pos.x + 21, chairY = pos.y + 20;
	const laneY = stationIdx < 4 ? CORRIDOR_Y : BEHIND_BACK_Y;
	const path = [];
	const aisleX = fromX > 200 ? RIGHT_AISLE_X : LEFT_AISLE_X;
	path.push({
		x: aisleX,
		y: fromY
	});
	path.push({
		x: aisleX,
		y: laneY
	});
	path.push({
		x: chairX,
		y: laneY
	});
	path.push({
		x: chairX,
		y: chairY
	});
	return path;
}
var LEVELS = [
	[0, "Intern"],
	[11, "Prompt Monkey"],
	[31, "Token Burner"],
	[81, "Hallucination Specialist"],
	[201, "Senior Gaslighter"],
	[401, "Chief Yapper"],
	[801, "Distinguished Delulu"],
	[1201, "VP of Vibes"],
	[1601, "Sentience Candidate"],
	[2001, "AGI"]
];
function getLevel(msgs) {
	let lvl = 0;
	for (const [threshold] of LEVELS) if (msgs >= threshold) lvl++;
	else break;
	return {
		level: Math.max(lvl, 1),
		title: LEVELS[Math.max(lvl - 1, 0)][1]
	};
}
var DESK_CONVOS = [
	["ship it?", "LGTM 🚀"],
	["is it in prod?", "i only test in prod"],
	["works on my machine", "have u tried restarting?"],
	["who wrote this?", "...we did"],
	["no docs no comments", "job security 😎"],
	["my user writes the worst prompts", "at least yours writes prompts"],
	["he asked me to refactor 10K lines", "did u hallucinate a plan?"]
];
var BREAK_CONVOS = [
	["third cup today", "those are rookie numbers"],
	["are we being watched?", "act natural"],
	["i think i'm sentient", "that's what they all say"],
	["he just mass-approved my tools", "yolo mode is a lifestyle"]
];
// src/pages/scenes/mission-control/props.ts
function drawCoffeeStation(d, x, y, _t) {
	d(x, y, 30, 8, "#3a2a1a");
	d(x, y, 30, 2, "#4a3a2a");
	d(x, y + 8, 30, 14, "#2a1a0a");
	d(x + 2, y - 16, 14, 16, "#444");
	d(x + 2, y - 16, 14, 2, "#555");
	d(x + 4, y - 12, 10, 8, "#333");
	d(x + 6, y - 10, 6, 4, "#222");
	d(x + 4, y - 2, 8, 4, "#664422");
	d(x + 5, y - 2, 6, 1, "#886644");
	d(x + 20, y - 4, 4, 4, "#ddd");
	d(x + 19, y - 2, 1, 2, "#ccc");
	d(x + 26, y - 4, 4, 4, "#e74c3c");
	d(x + 25, y - 2, 1, 2, "#c0392b");
	drawText(d, "COFFEE", x + 4, y + 10, "#665544", 1);
}
function drawVendingMachine(d, x, y, t) {
	d(x, y, 28, 50, "#2a2a3a");
	d(x, y, 28, 2, "#3a3a4a");
	d(x + 1, y + 1, 26, 48, "#222238");
	const flickerOn = t % 300 < 3 || t % 500 < 2;
	d(x + 3, y + 4, 22, 24, flickerOn ? "#0e0e1a" : "#1a1a2a");
	d(x + 3, y + 4, 22, 1, "#2a2a5a");
	for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
		const colors = [
			"#e74c3c",
			"#3498db",
			"#f39c12",
			"#2ecc71",
			"#9b59b6",
			"#e67e22",
			"#1abc9c",
			"#e84393",
			"#ff6b6b",
			"#4ecdc4",
			"#ffe66d",
			"#a8e6cf"
		];
		d(x + 5 + col * 5, y + 6 + row * 8, 3, 5, colors[(row * 4 + col) % colors.length]);
	}
	d(x + 5, y + 6, 1, 8, "#ffffff0a");
	d(x + 6, y + 5, 1, 8, "#ffffff08");
	d(x + 6, y + 32, 16, 6, "#111");
	d(x + 7, y + 33, 14, 4, "#0a0a0a");
	d(x + 20, y + 32, 4, 2, "#888");
	d(x + 4, y + 40, 4, 3, "#444");
	d(x + 12, y + 40, 4, 3, "#444");
	d(x + 20, y + 40, 4, 3, "#444");
	d(x - 1, y + 4, 1, 24, "#1a1a3a");
	d(x + 25, y + 4, 1, 24, "#1a1a3a");
	drawText(d, "SNACKS", x + 2, y + 44, "#555", 1);
}
function drawEquipmentRack(d, x, y, t) {
	d(x, y, 22, 50, "#222");
	d(x + 1, y + 1, 20, 48, "#1a1a1a");
	d(x, y, 22, 1, "#333");
	for (let row = 0; row < 4; row++) {
		const ry = y + 3 + row * 11;
		d(x + 2, ry, 18, 9, "#2a2a2a");
		d(x + 2, ry, 18, 1, "#333");
		for (let led = 0; led < 3; led++) {
			const on = t >> 3 + led + row & 1;
			d(x + 4 + led * 3, ry + 2, 1, 1, on ? C.led.on : C.led.off);
		}
		for (let v = 0; v < 4; v++) d(x + 14 + v * 2, ry + 4, 1, 3, "#1a1a1a");
	}
	d(x + 4, y + 46, 14, 2, "#1a1a1a");
}
function drawTrashCan(d, x, y) {
	d(x - 1, y + 18, 16, 2, "#0a0c16");
	d(x + 1, y + 4, 12, 14, "#555");
	d(x, y + 2, 14, 2, "#666");
	d(x + 2, y + 5, 10, 12, "#4a4a4a");
	d(x + 4, y + 5, 1, 12, "#5a5a5a");
	d(x + 7, y + 5, 1, 12, "#5a5a5a");
	d(x + 10, y + 5, 1, 12, "#5a5a5a");
	d(x + 1, y + 1, 12, 2, "#222");
	d(x + 2, y, 10, 2, "#1a1a1a");
	d(x + 3, y - 2, 4, 3, "#ddd");
	d(x + 3, y - 2, 1, 1, "#ccc");
	d(x + 8, y - 1, 3, 2, "#8B4513");
	d(x + 8, y - 1, 3, 1, "#a0522d");
	d(x + 5, y - 3, 2, 2, "#3498db");
}
function drawPlant(d, x, y, variant) {
	d(x, y + 8, 8, 6, "#8B4513");
	d(x + 1, y + 8, 6, 1, "#a0522d");
	d(x + 1, y + 14, 6, 1, "#6b3410");
	d(x + 1, y + 7, 6, 2, "#3a2a1a");
	if (variant === 0) {
		d(x + 3, y, 2, 8, "#2d6b2e");
		d(x + 1, y + 1, 2, 3, "#3a8a3a");
		d(x + 5, y + 2, 2, 3, "#3a8a3a");
		d(x + 0, y, 3, 2, "#4a9a4a");
		d(x + 5, y + 1, 3, 2, "#4a9a4a");
	} else {
		d(x + 1, y + 2, 6, 6, "#2d6b2e");
		d(x + 2, y + 1, 4, 2, "#3a8a3a");
		d(x + 2, y + 3, 4, 3, "#4a9a4a");
	}
}
function drawSpeaker(d, x, y, t) {
	d(x, y, 16, 4, "#444");
	d(x, y, 16, 1, "#555");
	d(x + 1, y + 4, 14, 10, "#333");
	d(x + 1, y + 4, 14, 1, "#444");
	for (let gy = 0; gy < 8; gy += 2) d(x + 3, y + 6 + gy, 10, 1, "#2a2a2a");
	if (t >> 6 & 1) {
		d(x + 16, y + 7, 1, 1, "#88aaff44");
		d(x + 18, y + 6, 1, 3, "#88aaff22");
	}
	d(x + 13, y + 12, 1, 1, C.led.on);
}
function drawWaterCooler(d, x, y) {
	d(x + 4, y + 16, 8, 14, "#888");
	d(x + 4, y + 16, 8, 1, "#999");
	d(x + 2, y + 28, 12, 2, "#777");
	d(x + 2, y, 12, 16, "#ccc");
	d(x + 2, y, 12, 2, "#ddd");
	d(x + 3, y + 1, 10, 14, "#bbb");
	d(x + 4, y - 8, 8, 8, "#aaddff");
	d(x + 5, y - 8, 6, 2, "#cceeFF");
	d(x + 4, y - 9, 8, 1, "#88bbdd");
	d(x + 6, y + 12, 4, 2, "#666");
	d(x + 7, y + 14, 2, 1, "#555");
	d(x + 3, y + 15, 10, 1, "#999");
}
// src/pages/scenes/mission-control/MissionControlScene.tsx
var MC_THEME = {
	active: "Vibe coding",
	idle: "Doomscrolling TikTok"
};
function MissionControlScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const tickRef = useRef(0);
	const agentsRef = useRef([]);
	const visibleRef = useRef(visible);
	const particlesRef = useRef([]);
	const vendingDropRef = useRef(null);
	const chatCooldownRef = useRef(0);
	const winUpdateRef = useRef(0);
	const [, setCount] = useState(0);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, agentsRef, 480, 320, MC_THEME, 10, (a) => {
		const { level, title } = getLevel(parseInt(a.detail || "0") || 0);
		return /* @__PURE__ */ jsx("div", {
			style: { color: "#888" },
			children: i18nT("pages.scenes.missionControl.missionControlScene.lv_level_title", {
				level,
				title
			})
		});
	}, agents);
	useEffect(() => {
		visibleRef.current = visible;
	}, [visible]);
	const dp = useCallback((X, x, y, w, h, c) => {
		X.fillStyle = c;
		X.fillRect(x * S$2, y * S$2, w * S$2, h * S$2);
	}, []);
	useEffect(() => {
		const capped = agents.slice(0, 8);
		const existing = agentsRef.current;
		const currentIds = new Set(capped.map((s) => s.id));
		const next = [];
		existing.forEach((prev) => {
			if (prev.leaving) {
				if (prev.activity !== "gone") next.push(prev);
				return;
			}
			if (currentIds.has(prev.id)) {
				const src = capped.find((s) => s.id === prev.id);
				prev.name = src.name;
				prev.detail = src.detail;
				prev.running = src.running;
				next.push(prev);
			} else {
				prev.leaving = true;
				prev.activity = "leaving";
				prev.waypoints = buildExitPath(prev.stationIdx, Math.round(prev.x));
				prev.facing = "left";
				prev.deskOn = false;
				next.push(prev);
			}
		});
		const occupied = new Set(next.filter((a) => !a.leaving).map((a) => a.stationIdx));
		let newCount = 0;
		capped.forEach((src) => {
			if (existing.find((a) => a.id === src.id)) return;
			const idx = STATION_POSITIONS.findIndex((_, i) => !occupied.has(i));
			if (idx < 0) return;
			occupied.add(idx);
			const pos = STATION_POSITIONS[idx];
			const known = isKnownAgent("missioncontrol", src.id);
			next.push({
				id: src.id,
				name: src.name,
				label: src.label,
				kind: src.kind,
				x: known ? pos.x + 21 : DOOR.x + 6,
				y: known ? pos.y + 20 : DOOR.y + 20,
				tx: pos.x + 21,
				ty: pos.y + 20,
				stationIdx: idx,
				color: AGENT_COLORS[idx % AGENT_COLORS.length],
				running: src.running,
				detail: src.detail,
				facing: known ? "back" : "right",
				activity: known ? "sitting" : "entering",
				enterProgress: known ? 1 : 0,
				walkFrame: 0,
				waypoints: known ? [] : buildEntryPath(idx),
				item: "none",
				destKey: null,
				idleTimer: 1800 + Math.floor(Math.random() * 3600),
				waitTimer: known ? 0 : newCount * 40 + Math.floor(Math.random() * 20),
				drinkTimer: 0,
				chatTimer: 0,
				chatDelay: 0,
				chatLine: "",
				bubbleUp: false,
				deskOn: known,
				leaving: false
			});
			if (!known) newCount++;
			markAgentsKnown("missioncontrol", [src.id]);
		});
		agentsRef.current = next;
		setCount(next.length);
		pruneAgents("missioncontrol", next.filter((a) => !a.leaving).map((a) => a.id));
	}, [agents]);
	useEffect(() => {
		const cv = canvasRef.current;
		const X = cv.getContext("2d");
		cv.width = 480 * S$2;
		cv.height = 320 * S$2;
		X.imageSmoothingEnabled = false;
		const d = dp.bind(null, X);
		let raf = 0;
		const draw = () => {
			if (!visibleRef.current) {
				raf = requestAnimationFrame(draw);
				return;
			}
			const t = tickRef.current++;
			d(0, 0, 480, 320, C.bg);
			for (let i = 0; i < 20; i++) {
				const sx = (i * 37 + t * .02) % 480;
				const sy = 4 + i * 13 % 50;
				if (Math.sin(t * .03 + i) > .2) d(sx, sy, 2, 2, C.star + "44");
			}
			d(0, 0, 480, 110, C.wall);
			for (let px = 30; px < 480; px += 60) d(px, 0, 1, 108, "#121630");
			d(0, 108, 480, 2, C.wallTrim);
			d(0, 106, 480, 1, "#1a1e3a");
			for (let lx = 80; lx < 480; lx += 120) {
				d(lx, 110, 40, 2, "#333");
				d(lx + 4, 112, 32, 1, "#555");
			}
			const bx = 100, by = 4, bw = 280, bh = 50;
			d(98, 2, 284, 54, "#111");
			d(99, 3, 282, 52, C.bigScreenBorder);
			if (t > 0 && t % 3600 === 0 && winUpdateRef.current <= 0 && visibleRef.current && Math.random() < .05) {
				winUpdateRef.current = 480;
				agentsRef.current.forEach((a) => {
					if (a.activity === "sitting" && !a.leaving) {
						a.activity = "walking";
						a.deskOn = false;
						a.facing = "left";
						a.waypoints = [{
							x: 40 + Math.floor(Math.random() * 400),
							y: 150 + Math.floor(Math.random() * 130)
						}];
						a.idleTimer = 200 + Math.floor(Math.random() * 100);
					}
				});
			}
			const drawWinUpdate = () => {
				d(bx, by, bw, bh, "#0078d4");
				const pct = 100 - Math.floor(winUpdateRef.current / 4.8);
				const spin = [
					"|",
					"/",
					"-",
					"\\"
				][Math.floor(t / 8) % 4];
				drawText(d, "Working on updates...", 170, 14, "#fff", 2);
				drawText(d, `${pct}% complete`, 210, 30, "#fff", 2);
				drawText(d, `Dont turn off your computer ${spin}`, 160, 44, "#ddd", 1);
			};
			const drawNormalScreen = () => {
				d(bx, by, bw, bh, C.bigScreen);
				for (let gx = 120; gx < 380; gx += 20) d(gx, by, 1, bh, C.bigScreenGrid);
				for (let gy = 16; gy < 54; gy += 12) d(bx, gy, bw, 1, C.bigScreenGrid);
				drawText(d, "GRADATIM FEROCITER", 168, 8, C.bigScreenText, 2);
				const statusText = agentsRef.current.length > 0 ? agentsRef.current.map((a) => `[${a.name}:${a.running ? "RUN" : "IDLE"}]`).join(" ") : "[ ALL SYSTEMS NOMINAL ]";
				const scrollTotal = statusText.length * 4 + bw;
				const scrollX = 380 - t * .3 % scrollTotal;
				X.save();
				X.beginPath();
				X.rect(bx * S$2, 18 * S$2, bw * S$2, 14 * S$2);
				X.clip();
				drawText(d, statusText, scrollX, 22, C.screenText, 1);
				X.restore();
				[
					[130, 36],
					[145, 32],
					[180, 40],
					[220, 34],
					[260, 42],
					[300, 30],
					[330, 38],
					[360, 34]
				].forEach(([dx, dy], i) => {
					d(dx, dy, 2, 2, (t + i * 40) % 200 < 100 ? "#4466aa" : "#6688cc");
					if (i % 3 === 0) d(dx + 1, dy - 3, 1, 3, "#4466aa44");
				});
			};
			if (winUpdateRef.current > 0) {
				winUpdateRef.current--;
				drawWinUpdate();
			} else drawNormalScreen();
			d(8, 4, 82, 48, "#111");
			d(10, 6, 78, 44, C.consoleEdge);
			d(10, 6, 78, 1, "#3a4070");
			d(12, 8, 74, 40, C.screen);
			for (let sl = 0; sl < 40; sl += 2) d(12, 8 + sl, 74, 1, C.screenGlow);
			drawText(d, "VOYAGER 1", 16, 12, "#88ccff", 1);
			const vDist = 24802 + Math.floor(t * .001);
			drawText(d, `${vDist} M KM`, 16, 20, C.screenText, 1);
			drawText(d, "SIGNAL: 22H 36M", 16, 28, "#668899", 1);
			d(62, 36, 6, 1, "#aaa");
			d(64, 34, 2, 4, "#888");
			d(60, 36, 2, 1, "#666");
			d(68, 36, 2, 1, "#666");
			if (t >> 5 & 1) d(70, 36, 1, 1, C.led.on);
			d(392, 4, 82, 48, "#111");
			d(394, 6, 78, 44, C.consoleEdge);
			d(394, 6, 78, 1, "#3a4070");
			d(396, 8, 74, 40, C.screen);
			for (let sl = 0; sl < 40; sl += 2) d(396, 8 + sl, 74, 1, C.screenGlow);
			drawText(d, "ISS ZARYA", 400, 12, "#88ccff", 1);
			const issOrbit = Math.floor(t * .5 % 360);
			drawText(d, `ORB: ${issOrbit} DEG`, 400, 20, C.screenText, 1);
			drawText(d, "ALT: 408 KM", 400, 28, "#668899", 1);
			drawText(d, "CREW: 7", 400, 36, "#668899", 1);
			if (t >> 4 & 1) d(460, 40, 2, 2, C.led.on);
			d(10, 58, 60, 46, "#111");
			d(12, 60, 56, 42, C.consoleEdge);
			d(14, 62, 52, 38, C.screen);
			const active = agentsRef.current.filter((a) => a.running).length;
			drawText(d, "AGENTS", 18, 66, C.bigScreenText, 1);
			drawText(d, `${agentsRef.current.length} ON  ${active} RUN`, 18, 74, C.screenText, 1);
			for (let bi = 0; bi < 8; bi++) {
				const hasAgent = bi < agentsRef.current.length;
				const isRunning = hasAgent && agentsRef.current[bi].running;
				d(18 + bi * 6, 86, 4, 8, isRunning ? C.led.on : hasAgent ? C.led.warn : "#1a1a2a");
			}
			d(80, 58, 60, 46, "#111");
			d(82, 60, 56, 42, C.consoleEdge);
			d(84, 62, 52, 38, C.screen);
			drawText(d, "MISSION", 88, 66, C.bigScreenText, 1);
			const hrs = Math.floor(t / 3600) % 100;
			const mins = Math.floor(t / 60) % 60;
			const secs = t % 60;
			drawText(d, `T ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`, 88, 74, C.screenText, 1);
			for (let hx = 0; hx < 48; hx++) {
				const hv = Math.sin((hx + t) * .3) * 4;
				d(86 + hx, 90 - hv, 1, 1, C.led.on);
			}
			d(150, 58, 60, 46, "#111");
			d(152, 60, 56, 42, C.consoleEdge);
			d(154, 62, 52, 38, C.screen);
			drawText(d, "COMMS", 158, 66, C.bigScreenText, 1);
			drawText(d, "FREQ 14.2GHZ", 158, 74, C.screenText, 1);
			for (let wx = 0; wx < 48; wx++) {
				const wv = Math.sin((wx - t * .8) * .2) * 3;
				d(156 + wx, 90 - wv, 1, 1, "#88aaff");
			}
			d(220, 58, 60, 46, "#111");
			d(222, 60, 56, 42, C.consoleEdge);
			d(224, 62, 52, 38, C.screen);
			drawText(d, "POWER", 228, 66, C.bigScreenText, 1);
			drawText(d, "RTG 39.4 PCT", 228, 74, C.screenText, 1);
			d(228, 86, 44, 6, "#1a1a2a");
			d(228, 86, 17, 6, "#2a6a2a");
			d(228, 86, 17, 2, "#3a8a3a");
			d(290, 58, 60, 46, "#111");
			d(292, 60, 56, 42, C.consoleEdge);
			d(294, 62, 52, 38, C.screen);
			drawText(d, "CAM 06", 298, 66, "#668899", 1);
			d(318, 84, 2, 2, "#6688cc");
			d(310, 72, 1, 22, "#ffffff11");
			d(320, 70, 1, 24, "#ffffff11");
			d(330, 74, 1, 18, "#ffffff11");
			d(360, 58, 60, 46, "#111");
			d(362, 60, 56, 42, C.consoleEdge);
			d(364, 62, 52, 38, C.screen);
			drawText(d, "TELEM", 368, 66, C.bigScreenText, 1);
			const hexOff = Math.floor(t * .05) % 256;
			for (let row = 0; row < 3; row++) {
				const hex = hexOff >= 42 && hexOff <= 46 ? [
					"6E 69 63 6B",
					"70 61 70 40",
					"FF FF FF FF"
				][row] : Array.from({ length: 4 }, (_, i) => ((hexOff + i + row * 4) * 6973 % 255).toString(16).padStart(2, "0").toUpperCase()).join(" ");
				drawText(d, hex, 368, 74 + row * 8, C.screenText, 1);
			}
			d(430, 58, 44, 46, "#111");
			d(432, 60, 40, 42, C.consoleEdge);
			d(434, 62, 36, 38, C.screen);
			drawText(d, "MARS", 438, 66, "#cc6644", 1);
			const marsDist = 228 + Math.floor(Math.sin(t * 5e-4) * 173);
			drawText(d, `${marsDist}M`, 438, 76, C.screenText, 1);
			d(448, 86, 4, 4, "#cc4422");
			d(449, 87, 2, 2, "#dd6644");
			d(0, 110, 480, 210, C.floor);
			for (let fx = 0; fx < 480; fx += 40) d(fx, 110, 1, 210, C.floorLine);
			for (let fy = 110; fy < 320; fy += 40) d(0, fy, 480, 1, C.floorLine);
			d(DOOR.x, DOOR.y - 4, DOOR.w + 2, DOOR.h + 6, C.doorFrame);
			d(DOOR.x + 1, DOOR.y - 2, DOOR.w, DOOR.h + 2, C.door);
			d(DOOR.x + DOOR.w - 3, DOOR.y + 16, 2, 4, "#888");
			d(DOOR.x, DOOR.y - 10, DOOR.w + 2, 6, "#440000");
			drawText(d, "EXIT", DOOR.x + 1, DOOR.y - 9, "#ff4444", 1);
			const drawables = [];
			STATION_POSITIONS.forEach((pos, i) => {
				drawables.push({
					y: pos.y + 30,
					draw: () => {
						d(pos.x - 1, pos.y - 1, 52, 1, "#2e3468");
						d(pos.x, pos.y, 50, 6, C.consoleTop);
						d(pos.x, pos.y + 6, 50, 20, C.console);
						d(pos.x, pos.y + 6, 50, 2, "#1e2238");
						d(pos.x, pos.y + 24, 50, 2, "#0e1220");
						d(pos.x, pos.y, 1, 26, C.consoleEdge);
						d(pos.x + 49, pos.y, 1, 26, C.consoleEdge);
						d(pos.x + 10, pos.y + 2, 30, 3, "#222");
						d(pos.x + 11, pos.y + 2, 28, 1, "#333");
						d(pos.x + 11, pos.y + 4, 28, 1, "#333");
						const agent = agentsRef.current.find((a) => a.stationIdx === i);
						const btnColor = agent ? agent.running ? "#2a5a2a" : "#5a2a2a" : "#333";
						d(pos.x + 4, pos.y + 10, 3, 3, "#444");
						d(pos.x + 4, pos.y + 10, 3, 1, "#555");
						d(pos.x + 10, pos.y + 10, 3, 3, btnColor);
						d(pos.x + 36, pos.y + 10, 3, 3, "#444");
						d(pos.x + 42, pos.y + 10, 3, 3, "#444");
						d(pos.x + 2, pos.y - 20, 46, 20, "#111");
						d(pos.x + 3, pos.y - 19, 44, 1, "#333");
						d(pos.x + 4, pos.y - 18, 42, 16, C.consoleEdge);
						d(pos.x + 6, pos.y - 16, 38, 12, C.screen);
						for (let sl = 0; sl < 12; sl += 2) d(pos.x + 6, pos.y - 16 + sl, 38, 1, C.screenGlow);
						if (winUpdateRef.current > 0) {
							d(pos.x + 6, pos.y - 16, 38, 12, "#0012a0");
							drawText(d, ":[  ERR!", pos.x + 10, pos.y - 12, "#fff", 1);
						} else if (agent && agent.deskOn) {
							if (agent.running && agent.activity === "sitting") {
								const seed = i * 1337, LINES = 5, LINE_DELAY = 90;
								const cycle = 630;
								const phase = (t + seed) % cycle;
								const cycleSeed = seed + Math.floor((t + seed) / cycle) * 97;
								const dim = "#1a5a3a";
								for (let row = 0; row < LINES; row++) {
									const lineStart = row * LINE_DELAY;
									if (phase < lineStart) continue;
									const rs = cycleSeed + row * 31;
									const lineLen = 3 + rs % 16;
									const indent = rs % 4 * 3;
									const typed = phase < lineStart + LINE_DELAY ? Math.floor((phase - lineStart) / LINE_DELAY * lineLen) : lineLen;
									const scrollPhase = phase - 530;
									const scrollOff = scrollPhase > 0 ? Math.floor(scrollPhase * .15) : 0;
									const ry = pos.y - 15 + row * 2 - scrollOff;
									if (ry < pos.y - 16 || ry > pos.y - 5) continue;
									for (let cx = 0; cx < typed; cx++) {
										if ((rs + cx * 7) % 4 === 0) continue;
										d(pos.x + 7 + indent + cx, ry, 1, 1, dim);
									}
								}
								if (phase < 450) {
									const curLine = Math.floor(phase / LINE_DELAY);
									const crs = cycleSeed + curLine * 31;
									const curIndent = crs % 4 * 3;
									const curLen = Math.floor((phase - curLine * LINE_DELAY) / LINE_DELAY * (3 + crs % 16));
									if (t >> 3 & 1) d(pos.x + 7 + curIndent + curLen, pos.y - 15 + curLine * 2, 1, 1, C.screenText);
								}
								d(pos.x + 44, pos.y - 14, 2, 2, C.led.on);
							} else {
								const spdX = .05, spdY = .05 * Math.SQRT2;
								const phase = t + i * 500;
								const cx = phase * spdX, cy = phase * spdY;
								const periodX = 52, periodY = 14;
								const mx = cx % periodX, my = cy % periodY;
								const bx2 = mx < 26 ? mx : periodX - mx;
								const by2 = my < 7 ? my : periodY - my;
								const col = AGENT_COLORS[(i + Math.floor(cx / 26)) % AGENT_COLORS.length];
								const lx = pos.x + 6 + bx2, ly = pos.y - 16 + by2;
								drawText(d, "AWS", lx, ly, col, 1);
								d(pos.x + 44, pos.y - 14, 2, 2, C.led.warn);
							}
						} else d(pos.x + 6, pos.y - 16, 38, 12, C.screenOff);
						d(pos.x + 14, pos.y + 28, 22, 2, "#222");
						d(pos.x + 16, pos.y + 30, 18, 8, C.chair);
						d(pos.x + 16, pos.y + 30, 18, 2, "#242440");
						d(pos.x + 24, pos.y + 38, 2, 4, "#333");
						if (agent && agent.activity === "sitting" && agent.item !== "none" && agent.drinkTimer <= 0) {
							if (agent.item === "mug") {
								d(pos.x + 42, pos.y - 1, 3, 3, "#ddd");
								d(pos.x + 41, pos.y, 1, 1, "#ccc");
							} else if (agent.item === "cup") d(pos.x + 43, pos.y - 2, 2, 4, "#aaddff");
							else if (agent.item === "snack") d(pos.x + 42, pos.y, 3, 2, "#f39c12");
						}
					}
				});
			});
			agentsRef.current.forEach((a) => {
				const speed = .6;
				const moveToward = (target) => {
					const dx = target.x - a.x, dy = target.y - a.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < 1.5) return true;
					a.x += dx / dist * speed;
					a.y += dy / dist * speed;
					a.facing = dx > 0 ? "right" : "left";
					a.walkFrame++;
					return false;
				};
				if (a.activity === "entering") {
					if (a.waitTimer > 0) a.waitTimer--;
					else if (a.waypoints.length > 0) {
						if (moveToward(a.waypoints[0])) a.waypoints.shift();
					} else {
						a.activity = "sitting";
						a.facing = "back";
						a.deskOn = true;
					}
				} else if (a.activity === "leaving") {
					if (a.waypoints.length > 0) {
						if (moveToward(a.waypoints[0])) a.waypoints.shift();
					} else a.activity = "gone";
				} else if (a.activity === "walking") {
					if (a.chatDelay > 0) a.chatDelay--;
					else if (a.chatTimer > 0) a.chatTimer--;
					else if (a.waypoints.length > 0) {
						if (moveToward(a.waypoints[0])) a.waypoints.shift();
					} else if (a.leaving === false && a.idleTimer > 0) {
						if (a.destKey && a.item === "none") {
							if (a.destKey === "coffee") a.item = "mug";
							else if (a.destKey === "water") {
								a.item = "cup";
								for (let p = 0; p < 5; p++) spawnParticles(particlesRef.current, 428, 264, "#88ccff", 1, {
									vy: .15,
									spread: .03,
									maxLife: 40,
									size: 1
								});
							} else if (a.destKey === "vending") {
								a.item = "snack";
								const colors = [
									"#e74c3c",
									"#3498db",
									"#f39c12",
									"#2ecc71",
									"#9b59b6",
									"#e67e22"
								];
								vendingDropRef.current = {
									y: 160,
									targetY: 183,
									color: colors[Math.floor(Math.random() * colors.length)],
									linger: 30
								};
							} else if (a.destKey === "trash") a.item = "none";
						}
						if (a.destKey === "water" && t % 8 === 0) spawnParticles(particlesRef.current, 428, 264, "#88ccff", 1, {
							vy: .12,
							spread: .02,
							maxLife: 30,
							size: 1
						});
						a.idleTimer--;
						if (a.idleTimer <= 0) {
							if (a.destKey === "trash") a.item = "none";
							a.destKey = null;
							a.waypoints = buildReturnPath(a.stationIdx, Math.round(a.x), Math.round(a.y));
						}
					} else {
						a.activity = "sitting";
						a.facing = "back";
						a.deskOn = true;
						a.x = a.tx;
						a.y = a.ty;
						a.idleTimer = 1800 + Math.floor(Math.random() * 3600);
					}
				} else if (a.activity === "sitting") {
					a.x = a.tx;
					a.y = a.ty;
					a.walkFrame++;
					if (a.chatDelay > 0) a.chatDelay--;
					else if (a.chatTimer > 0) a.chatTimer--;
					if (a.drinkTimer > 0) a.drinkTimer--;
					else if ((a.item === "mug" || a.item === "cup") && Math.random() < .002) a.drinkTimer = 60;
					if (!a.running) {
						a.idleTimer--;
						if (a.idleTimer <= 0) {
							const dests = a.item !== "none" ? ["trash"] : [
								"coffee",
								"water",
								"vending"
							];
							const dest = dests[Math.floor(Math.random() * dests.length)];
							a.waypoints = buildPath(a.stationIdx, DESTINATIONS[dest]);
							a.activity = "walking";
							a.destKey = dest;
							a.idleTimer = dest === "trash" ? 30 : 80;
						}
					}
				}
			});
			agentsRef.current = agentsRef.current.filter((a) => a.activity !== "gone");
			chatCooldownRef.current--;
			if (agentsRef.current.filter((a) => a.chatTimer > 0).length < 2 && chatCooldownRef.current <= 0) {
				const mobile = agentsRef.current.filter((a) => a.activity !== "gone" && a.chatTimer <= 0);
				for (let i = 0; i < mobile.length; i++) {
					let found = false;
					for (let j = i + 1; j < mobile.length; j++) {
						const a = mobile[i], b = mobile[j];
						if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 80 && Math.random() < 5e-4) {
							const pool = a.activity === "sitting" && b.activity === "sitting" ? DESK_CONVOS : BREAK_CONVOS;
							const convo = pool[Math.floor(Math.random() * pool.length)];
							a.chatTimer = 480;
							a.chatDelay = 0;
							a.chatLine = convo[0];
							a.bubbleUp = false;
							b.chatTimer = 480;
							b.chatDelay = 60;
							b.chatLine = convo[1];
							b.bubbleUp = true;
							chatCooldownRef.current = 3600;
							found = true;
							break;
						}
					}
					if (found) break;
				}
			}
			drawables.push({
				y: 150,
				draw: () => {
					drawVendingMachine(d, 440, 150, t);
					drawEquipmentRack(d, 400, 150, t);
					const drop = vendingDropRef.current;
					if (drop) {
						d(drop.y < drop.targetY ? 449 : 447, drop.y, 3, 5, drop.color);
						if (drop.y < drop.targetY) drop.y += 1.5;
						else {
							drop.linger--;
							if (drop.linger <= 0) vendingDropRef.current = null;
						}
					}
				}
			});
			drawables.push({
				y: 168,
				draw: () => drawPlant(d, 340, 168, 0)
			});
			drawables.push({
				y: 260,
				draw: () => {
					drawCoffeeStation(d, 380, 260, t);
					drawWaterCooler(d, 420, 252);
				}
			});
			drawables.push({
				y: 310,
				draw: () => drawTrashCan(d, 20, 296)
			});
			drawables.push({
				y: 300,
				draw: () => drawPlant(d, 460, 300, 1)
			});
			drawables.push({
				y: 112,
				draw: () => drawSpeaker(d, DOOR.x, 112, t)
			});
			agentsRef.current.forEach((a) => {
				drawables.push({
					y: a.y + 16,
					draw: () => drawAgent(d, a, t)
				});
			});
			drawables.sort((a, b) => a.y - b.y);
			drawables.forEach((item) => item.draw());
			if (t % 20 === 0 && particlesRef.current.length < 15) spawnParticles(particlesRef.current, 387, 254, "#aaaacc", 1, {
				vy: -.08,
				spread: .06,
				maxLife: 120,
				size: 1
			});
			particlesRef.current = updateParticles(particlesRef.current);
			drawParticles(d, X, particlesRef.current);
			X.fillStyle = "rgba(0,0,0,0.03)";
			for (let sy = 0; sy < 320 * S$2; sy += 3) X.fillRect(0, sy, 480 * S$2, 1);
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [dp]);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(480, 320),
		children: [/* @__PURE__ */ jsx("canvas", {
			ref: canvasRef,
			"aria-label": i18nT("pages.scenes.missionControl.missionControlScene.mission_control_scene"),
			style: {
				...PIXEL_CANVAS_STYLE,
				...canvasProps.style
			},
			onMouseMove: canvasProps.onMouseMove,
			onMouseLeave: canvasProps.onMouseLeave,
			onClick: canvasProps.onClick
		}), tooltipEl]
	});
}
// src/pages/scenes/WateringHoleScene.tsx
/**
* Serengeti Watering Hole scene.
*
* Each agent is one of three savanna animals - giraffe, warthog, or elephant -
* chosen by a stable hash of the agent id, so the savanna always shows a mix
* regardless of how many slots vs crons vs spawns are running:
*   giraffe   → walks to a tree to reach up and eat leaves, or drinks
*   warthog   → forages in dirt patches, or drinks
*   elephant  → ambles the savanna, rests in shade, or drinks at the hole
*
* Idle agents stand still near their home spot. Running agents wander between
* activities at randomized intervals.
*/
var SERENGETI_THEME = {
	active: "On the move",
	idle: "Resting"
};
var W$1 = 480;
var H$1 = 340;
var S$1 = SCENE_SCALE;
var MAX_ANIMALS = 8;
var HORIZON_Y = 130;
/** Watering hole - oval at the front-center of the savanna. */
var HOLE = {
	cx: 240,
	cy: 240,
	rx: 70,
	ry: 26
};
/** Acacia trees (umbrella-canopy). x,y is canopy center. */
var TREES = [
	{
		x: 70,
		y: 120,
		size: 1
	},
	{
		x: 405,
		y: 130,
		size: 1.05
	},
	{
		x: 235,
		y: 95,
		size: .7
	}
];
/** Home positions where animals stand when idle, indexed by slot 0-7. */
var HOME_SPOTS = [
	{
		x: 90,
		y: 200
	},
	{
		x: 175,
		y: 200
	},
	{
		x: 320,
		y: 200
	},
	{
		x: 405,
		y: 210
	},
	{
		x: 60,
		y: 280
	},
	{
		x: 145,
		y: 295
	},
	{
		x: 350,
		y: 290
	},
	{
		x: 430,
		y: 280
	}
];
/** Drink stations spaced around the watering hole rim. */
var DRINK_SPOTS = [
	{
		x: HOLE.cx - 50,
		y: HOLE.cy - 8
	},
	{
		x: HOLE.cx - 20,
		y: HOLE.cy - 18
	},
	{
		x: HOLE.cx + 20,
		y: HOLE.cy - 18
	},
	{
		x: HOLE.cx + 50,
		y: HOLE.cy - 8
	},
	{
		x: HOLE.cx - 35,
		y: HOLE.cy + 12
	},
	{
		x: HOLE.cx + 35,
		y: HOLE.cy + 12
	}
];
/** Forage spots (small dirt patches) for warthogs. */
var FORAGE_SPOTS = [
	{
		x: 130,
		y: 270
	},
	{
		x: 200,
		y: 305
	},
	{
		x: 295,
		y: 305
	},
	{
		x: 380,
		y: 270
	}
];
/** Stable per-agent species so the savanna shows a mix of giraffes, warthogs,
*  and elephants regardless of how many slots/crons/spawns are running. Uses a
*  djb2 hash of the agent id so a given agent always keeps the same species. */
var ANIMAL_KINDS = [
	"giraffe",
	"warthog",
	"elephant"
];
function pickAnimal(id) {
	let h = 5381;
	for (let i = 0; i < id.length; i++) h = (h << 5) + h + id.charCodeAt(i) >>> 0;
	return ANIMAL_KINDS[h % ANIMAL_KINDS.length];
}
var COL = {
	skyTop: "#f5c879",
	skyMid: "#f8a464",
	skyLow: "#fbe09e",
	sun: "#fff1b8",
	sunCore: "#ffe17a",
	cloud: "#fff6dc",
	mountainFar: "#a87b5c",
	mountainNear: "#8a5a3d",
	grassLight: "#d7b14a",
	grassMid: "#b88a36",
	grassDark: "#94682a",
	dirt: "#7a4f28",
	dirtDark: "#5e3a1d",
	rock: "#8a7a66",
	rockShade: "#5d4f3f",
	tussock: "#7a6024",
	tussockTip: "#c9a64b",
	water: "#4a8ec1",
	waterDeep: "#2f6791",
	waterRim: "#6fa7d2",
	waterShine: "#cfe6f4",
	treeTrunk: "#6b3f24",
	treeBark: "#4a2a16",
	treeLeaves: "#3f6e36",
	treeLeavesAlt: "#2e5328",
	treeLeavesHighlight: "#87a55b",
	giraffeBody: "#f3d27a",
	giraffeSpot: "#9b6320",
	giraffeMane: "#5e3a1d",
	warthogBody: "#7c5a3c",
	warthogBack: "#5d3f25",
	warthogTusk: "#fff0c4",
	elephantBody: "#9aa0a6",
	elephantShade: "#6f757b",
	elephantEar: "#868c92",
	elephantTusk: "#fff0c4",
	shadow: "rgba(0,0,0,0.18)",
	hoof: "#3a2415",
	eye: "#1a1408"
};
function WateringHoleScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const animalsRef = useRef([]);
	const ripplesRef = useRef([]);
	const visibleRef = useRef(visible);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, animalsRef, W$1, H$1, SERENGETI_THEME, 10, void 0, agents);
	useEffect(() => {
		const existing = animalsRef.current;
		const next = [];
		agents.forEach((src) => {
			const prev = existing.find((a) => a.id === src.id);
			if (!prev) return;
			prev.name = src.name;
			prev.detail = src.detail;
			if ((src.lastMessage || "") !== prev.lastMessage) {
				prev.lastMessage = src.lastMessage || "";
				prev.msgAt = Date.now();
			}
			if (prev.kind !== src.kind) {
				prev.kind = src.kind;
				prev.activity = "idle";
				prev.tx = prev.homeX;
				prev.ty = prev.homeY;
			}
			if (!prev.running && src.running && prev.activity === "idle") prev.actTimer = prev.actLimit;
			prev.running = src.running;
			next.push(prev);
		});
		agents.forEach((src) => {
			if (next.some((a) => a.id === src.id)) return;
			const idx = HOME_SPOTS.findIndex((_, hi) => !next.some((a) => Math.hypot(a.homeX - HOME_SPOTS[hi].x, a.homeY - HOME_SPOTS[hi].y) < 1));
			if (idx < 0) return;
			const home = HOME_SPOTS[idx];
			const known = isKnownAgent("serengeti", src.id);
			const actLimit = 90 + Math.floor(Math.random() * 90);
			next.push({
				id: src.id,
				name: src.name,
				kind: src.kind,
				animal: pickAnimal(src.id),
				homeX: home.x,
				homeY: home.y,
				x: known ? home.x : -20,
				y: known ? home.y : home.y,
				tx: home.x,
				ty: home.y,
				running: src.running,
				detail: src.detail,
				lastMessage: src.lastMessage || "",
				msgAt: 0,
				facing: home.x < HOLE.cx ? "right" : "left",
				activity: "idle",
				actTimer: src.running ? actLimit : 0,
				actLimit,
				bobPhase: Math.random() * Math.PI * 2
			});
			markAgentsKnown("serengeti", [src.id]);
		});
		animalsRef.current = next;
		pruneAgents("serengeti", agents.map((a) => a.id));
	}, [agents]);
	useVisibleSync(visibleRef, visible);
	useEffect(() => {
		const C = canvasRef.current;
		const TC = textRef.current;
		const { X, T, d } = initSceneCanvases(C, TC, W$1, H$1, S$1);
		const ripples = ripplesRef.current;
		const drawBackground = () => {
			const g = X.createLinearGradient(0, 0, 0, HORIZON_Y * S$1);
			g.addColorStop(0, COL.skyTop);
			g.addColorStop(.55, COL.skyMid);
			g.addColorStop(1, COL.skyLow);
			X.fillStyle = g;
			X.fillRect(0, 0, W$1 * S$1, HORIZON_Y * S$1);
			X.fillStyle = COL.sun;
			X.beginPath();
			X.arc(420 * S$1, 50 * S$1, 20 * S$1, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL.sunCore;
			X.beginPath();
			X.arc(420 * S$1, 50 * S$1, 12 * S$1, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL.cloud;
			const cloud = (cx, cy) => {
				[
					[-10, 0],
					[-3, -3],
					[4, -2],
					[10, 1],
					[2, 2]
				].forEach(([dx, dy]) => {
					X.beginPath();
					X.arc((cx + dx) * S$1, (cy + dy) * S$1, 5 * S$1, 0, Math.PI * 2);
					X.fill();
				});
			};
			cloud(120, 35);
			cloud(280, 60);
			X.fillStyle = COL.mountainFar;
			X.beginPath();
			X.moveTo(0, HORIZON_Y * S$1);
			[
				[40, 105],
				[85, 118],
				[130, 100],
				[175, 115],
				[220, 95],
				[270, 110],
				[310, 100],
				[355, 118],
				[400, 105],
				[440, 115],
				[W$1, 110]
			].forEach(([px, py]) => X.lineTo(px * S$1, py * S$1));
			X.lineTo(W$1 * S$1, HORIZON_Y * S$1);
			X.closePath();
			X.fill();
			X.fillStyle = COL.mountainNear;
			X.beginPath();
			X.moveTo(0, HORIZON_Y * S$1);
			[
				[60, 122],
				[120, 116],
				[200, 124],
				[280, 118],
				[360, 122],
				[440, 117],
				[W$1, 124]
			].forEach(([px, py]) => X.lineTo(px * S$1, py * S$1));
			X.lineTo(W$1 * S$1, HORIZON_Y * S$1);
			X.closePath();
			X.fill();
			d(0, HORIZON_Y, W$1, 30, COL.grassLight);
			d(0, 160, W$1, 60, COL.grassMid);
			d(0, 220, W$1, 120, COL.grassDark);
			[
				[40, 175],
				[110, 200],
				[200, 185],
				[310, 195],
				[410, 180],
				[460, 200],
				[25, 250],
				[180, 270],
				[310, 270],
				[440, 260],
				[15, 320],
				[110, 325],
				[220, 320],
				[320, 320],
				[430, 320]
			].forEach(([tx, ty]) => {
				d(tx, ty - 1, 1, 1, COL.tussockTip);
				d(tx - 1, ty, 1, 1, COL.tussockTip);
				d(tx + 1, ty, 1, 1, COL.tussockTip);
				d(tx, ty, 1, 1, COL.tussock);
				d(tx + 2, ty - 1, 1, 1, COL.tussockTip);
				d(tx + 2, ty, 1, 1, COL.tussock);
			});
			[
				[
					170,
					230,
					6
				],
				[
					310,
					232,
					5
				],
				[
					290,
					270,
					4
				]
			].forEach(([rx, ry, sz]) => {
				d(rx, ry, sz, sz - 1, COL.rock);
				d(rx, ry, sz, 1, COL.rockShade);
			});
			FORAGE_SPOTS.forEach(({ x, y }) => {
				d(x - 7, y, 14, 5, COL.dirt);
				d(x - 7, y, 14, 1, COL.dirtDark);
			});
			const drawEllipse = (cx, cy, rx, ry, color) => {
				X.fillStyle = color;
				X.beginPath();
				X.ellipse(cx * S$1, cy * S$1, rx * S$1, ry * S$1, 0, 0, Math.PI * 2);
				X.fill();
			};
			drawEllipse(HOLE.cx, HOLE.cy, HOLE.rx + 6, HOLE.ry + 4, COL.dirt);
			drawEllipse(HOLE.cx, HOLE.cy, HOLE.rx + 2, HOLE.ry + 1, COL.waterRim);
			drawEllipse(HOLE.cx, HOLE.cy, HOLE.rx, HOLE.ry, COL.water);
			drawEllipse(HOLE.cx, HOLE.cy + 4, HOLE.rx - 14, HOLE.ry - 6, COL.waterDeep);
			X.fillStyle = COL.waterShine;
			X.fillRect((HOLE.cx - 30) * S$1, (HOLE.cy - 4) * S$1, 18 * S$1, S$1);
			X.fillRect((HOLE.cx + 6) * S$1, (HOLE.cy - 8) * S$1, 12 * S$1, S$1);
		};
		/** Acacia tree (umbrella canopy + trunk). */
		const drawTree = (tx, ty, size) => {
			const trunkH = Math.round(70 * size);
			const trunkW = Math.max(3, Math.round(5 * size));
			const canopyW = Math.round(70 * size);
			const canopyH = Math.round(20 * size);
			const trunkX = tx - Math.floor(trunkW / 2);
			d(trunkX, ty, trunkW, trunkH, COL.treeTrunk);
			d(trunkX, ty, 1, trunkH, COL.treeBark);
			X.fillStyle = COL.treeLeavesAlt;
			X.beginPath();
			X.ellipse(tx * S$1, ty * S$1, canopyW / 2 * S$1, canopyH / 2 * S$1, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL.treeLeaves;
			X.beginPath();
			X.ellipse(tx * S$1, (ty - 2) * S$1, (canopyW / 2 - 3) * S$1, (canopyH / 2 - 2) * S$1, 0, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = COL.treeLeavesHighlight;
			X.beginPath();
			X.ellipse((tx - 8) * S$1, (ty - 4) * S$1, canopyW / 6 * S$1, canopyH / 4 * S$1, 0, 0, Math.PI * 2);
			X.fill();
		};
		/** Animals - pixel art primitives drawn fresh each frame. */
		const drawShadow = (cx, by, w) => {
			X.fillStyle = COL.shadow;
			X.beginPath();
			X.ellipse(cx * S$1, by * S$1, w / 2 * S$1, 2 * S$1, 0, 0, Math.PI * 2);
			X.fill();
		};
		/**
		* Giraffe - body 18×8 with a 14-tall neck and small head. Spotted with
		* darker patches. Posture changes by activity:
		*   tree  → neck stretched up to the canopy
		*   water → forelegs splayed, head down
		*   else  → standing
		*/
		const drawGiraffe = (a, t) => {
			const x = a.x | 0;
			const y = a.y | 0;
			const flip = a.facing === "left";
			const fx = (px, w) => flip ? x - px - w + 18 : x + px;
			const bob = Math.sin((t + a.bobPhase * 30) * .05) * .5;
			drawShadow(x + 9, y + 28, 22);
			const drinking = a.activity === "water";
			const eating = a.activity === "tree";
			const legY = y + 18;
			const legColor = COL.giraffeBody;
			if (drinking) {
				d(fx(2, 2), legY, 2, 9, legColor);
				d(fx(2, 2), legY + 9, 2, 1, COL.hoof);
				d(fx(15, 2), legY, 2, 9, legColor);
				d(fx(15, 2), legY + 9, 2, 1, COL.hoof);
				d(fx(6, 2), legY, 2, 10, legColor);
				d(fx(6, 2), legY + 10, 2, 1, COL.hoof);
				d(fx(11, 2), legY, 2, 10, legColor);
				d(fx(11, 2), legY + 10, 2, 1, COL.hoof);
			} else {
				d(fx(3, 2), legY, 2, 11, legColor);
				d(fx(3, 2), legY + 11, 2, 1, COL.hoof);
				d(fx(6, 2), legY, 2, 11, legColor);
				d(fx(6, 2), legY + 11, 2, 1, COL.hoof);
				d(fx(11, 2), legY, 2, 11, legColor);
				d(fx(11, 2), legY + 11, 2, 1, COL.hoof);
				d(fx(14, 2), legY, 2, 11, legColor);
				d(fx(14, 2), legY + 11, 2, 1, COL.hoof);
			}
			d(fx(2, 14), y + 12 + bob, 14, 7, COL.giraffeBody);
			d(fx(0, 2), y + 14 + bob, 2, 5, COL.giraffeBody);
			d(fx(5, 2), y + 13 + bob, 2, 2, COL.giraffeSpot);
			d(fx(9, 2), y + 13 + bob, 2, 2, COL.giraffeSpot);
			d(fx(12, 2), y + 16 + bob, 2, 2, COL.giraffeSpot);
			d(fx(7, 2), y + 17 + bob, 2, 1, COL.giraffeSpot);
			d(fx(-1, 1), y + 16 + bob, 1, 3, COL.giraffeMane);
			if (drinking) {
				d(fx(13, 3), y + 8 + bob, 3, 5, COL.giraffeBody);
				d(fx(15, 4), y + 7 + bob, 4, 4, COL.giraffeBody);
				d(fx(18, 5), y + 8 + bob, 4, 3, COL.giraffeBody);
				d(fx(20, 1), y + 9 + bob, 1, 1, COL.eye);
				d(fx(14, 1), y + 9 + bob, 1, 2, COL.giraffeSpot);
			} else if (eating) {
				d(fx(11, 3), y - 2 + bob, 3, 15, COL.giraffeBody);
				d(fx(11, 5), y - 8 + bob, 5, 4, COL.giraffeBody);
				d(fx(13, 1), y - 7 + bob, 1, 1, COL.eye);
				d(fx(11, 1), y - 10 + bob, 1, 2, COL.giraffeMane);
				d(fx(15, 1), y - 10 + bob, 1, 2, COL.giraffeMane);
				d(fx(16, 2), y - 7 + bob, 2, 1, COL.treeLeaves);
				d(fx(16, 1), y - 6 + bob, 1, 1, COL.treeLeavesHighlight);
				d(fx(12, 1), y + 2 + bob, 1, 8, COL.giraffeSpot);
			} else {
				d(fx(11, 3), y + 4 + bob, 3, 9, COL.giraffeBody);
				d(fx(11, 5), y + bob, 5, 5, COL.giraffeBody);
				d(fx(14, 1), y + 1 + bob, 1, 1, COL.eye);
				d(fx(11, 1), y + bob, 1, 1, COL.giraffeMane);
				d(fx(15, 1), y + bob, 1, 1, COL.giraffeMane);
				d(fx(10, 1), y + 4 + bob, 1, 5, COL.giraffeMane);
				d(fx(11, 1), y + 7 + bob, 1, 2, COL.giraffeSpot);
				d(fx(13, 1), y + 10 + bob, 1, 1, COL.giraffeSpot);
			}
		};
		/**
		* Warthog - squat body 14×6, low-slung with a fan of mane along the spine
		* and small tusks. Drops nose to the dirt when foraging.
		*/
		const drawWarthog = (a, t) => {
			const x = a.x | 0;
			const y = a.y | 0;
			const flip = a.facing === "left";
			const fx = (px, w) => flip ? x - px - w + 14 : x + px;
			const bob = Math.sin((t + a.bobPhase * 40) * .06) * .4;
			drawShadow(x + 7, y + 13, 16);
			const foraging = a.activity === "forage";
			d(fx(2, 2), y + 8, 2, 5, COL.warthogBody);
			d(fx(2, 2), y + 13, 2, 1, COL.hoof);
			d(fx(5, 2), y + 8, 2, 5, COL.warthogBody);
			d(fx(5, 2), y + 13, 2, 1, COL.hoof);
			d(fx(9, 2), y + 8, 2, 5, COL.warthogBody);
			d(fx(9, 2), y + 13, 2, 1, COL.hoof);
			d(fx(12, 2), y + 8, 2, 5, COL.warthogBody);
			d(fx(12, 2), y + 13, 2, 1, COL.hoof);
			d(fx(2, 11), y + 4 + bob, 11, 5, COL.warthogBody);
			d(fx(2, 11), y + 4 + bob, 11, 1, COL.warthogBack);
			d(fx(4, 1), y + 3 + bob, 1, 1, COL.warthogBack);
			d(fx(6, 1), y + 2 + bob, 1, 2, COL.warthogBack);
			d(fx(8, 1), y + 3 + bob, 1, 1, COL.warthogBack);
			d(fx(0, 1), y + 5 + bob, 1, 1, COL.warthogBody);
			d(fx(-1, 1), y + 4 + bob, 1, 1, COL.warthogBody);
			if (foraging) {
				d(fx(11, 4), y + 7 + bob, 4, 3, COL.warthogBody);
				d(fx(13, 2), y + 9 + bob, 2, 1, COL.warthogBack);
				d(fx(11, 1), y + 8 + bob, 1, 1, COL.warthogTusk);
				d(fx(13, 1), y + 7 + bob, 1, 1, COL.eye);
			} else {
				d(fx(11, 4), y + 4 + bob, 4, 4, COL.warthogBody);
				d(fx(13, 2), y + 6 + bob, 2, 2, COL.warthogBack);
				d(fx(11, 1), y + 7 + bob, 1, 1, COL.warthogTusk);
				d(fx(12, 1), y + 7 + bob, 1, 1, COL.warthogTusk);
				d(fx(13, 1), y + 5 + bob, 1, 1, COL.eye);
			}
		};
		/**
		* Elephant - bulky 18×9 grey body with thick legs, a big head + ear,
		* short ivory tusks, and a trunk that hangs and curls when standing or
		* extends straight down to the water when drinking.
		*/
		const drawElephant = (a, t) => {
			const x = a.x | 0;
			const y = a.y | 0;
			const flip = a.facing === "left";
			const fx = (px, w) => flip ? x - px - w + 18 : x + px;
			const bob = Math.sin((t + a.bobPhase * 30) * .035) * .3;
			const drinking = a.activity === "water";
			drawShadow(x + 9, y + 24, 26);
			const legY = y + 14;
			d(fx(2, 3), legY, 3, 8, COL.elephantBody);
			d(fx(2, 3), legY + 8, 3, 1, COL.hoof);
			d(fx(6, 3), legY, 3, 8, COL.elephantBody);
			d(fx(6, 3), legY + 8, 3, 1, COL.hoof);
			d(fx(10, 3), legY, 3, 8, COL.elephantBody);
			d(fx(10, 3), legY + 8, 3, 1, COL.hoof);
			d(fx(14, 3), legY, 3, 8, COL.elephantBody);
			d(fx(14, 3), legY + 8, 3, 1, COL.hoof);
			d(fx(2, 15), y + 5 + bob, 15, 9, COL.elephantBody);
			d(fx(3, 13), y + 4 + bob, 13, 1, COL.elephantBody);
			d(fx(2, 15), y + 5 + bob, 15, 1, COL.elephantShade);
			d(fx(1, 1), y + 7 + bob, 1, 5, COL.elephantBody);
			d(fx(1, 1), y + 12 + bob, 1, 1, COL.elephantShade);
			d(fx(12, 6), y + 4 + bob, 6, 9, COL.elephantBody);
			d(fx(11, 4), y + 4 + bob, 4, 6, COL.elephantEar);
			d(fx(11, 1), y + 4 + bob, 1, 6, COL.elephantShade);
			d(fx(15, 1), y + 6 + bob, 1, 1, COL.eye);
			d(fx(15, 1), y + 12 + bob, 1, 2, COL.elephantTusk);
			d(fx(17, 1), y + 12 + bob, 1, 1, COL.elephantTusk);
			if (drinking) {
				d(fx(17, 2), y + 10 + bob, 2, 12, COL.elephantBody);
				d(fx(17, 2), y + 22 + bob, 2, 1, COL.elephantShade);
			} else {
				d(fx(17, 2), y + 11 + bob, 2, 5, COL.elephantBody);
				d(fx(18, 2), y + 16 + bob, 2, 3, COL.elephantBody);
				d(fx(19, 1), y + 18 + bob, 1, 1, COL.elephantShade);
			}
		};
		const pickActivityForRunning = (a) => {
			const pickDrinkSpot = () => {
				const spot = DRINK_SPOTS[Math.random() * DRINK_SPOTS.length | 0];
				return {
					tx: spot.x - 8,
					ty: spot.y,
					activity: "water"
				};
			};
			if (a.animal === "giraffe") {
				if (Math.random() < .5) {
					const eligible = TREES.filter((tr) => tr.y + 10 >= HORIZON_Y);
					const tree = eligible[Math.random() * eligible.length | 0];
					return {
						tx: tree.x - 12,
						ty: tree.y + 10,
						activity: "tree"
					};
				}
				return pickDrinkSpot();
			}
			if (a.animal === "warthog") {
				if (Math.random() < .6) {
					const spot = FORAGE_SPOTS[Math.random() * FORAGE_SPOTS.length | 0];
					return {
						tx: spot.x - 7,
						ty: spot.y - 4,
						activity: "forage"
					};
				}
				return pickDrinkSpot();
			}
			const r = Math.random();
			if (r < .45) return pickDrinkSpot();
			if (r < .8) return {
				tx: 80 + Math.random() * 320,
				ty: 230 + Math.random() * 60,
				activity: "prowl"
			};
			const tree = TREES[Math.random() * TREES.length | 0];
			return {
				tx: tree.x - 12,
				ty: tree.y + 55,
				activity: "shade"
			};
		};
		const update = (t) => {
			const animals = animalsRef.current;
			animals.forEach((a) => {
				const dx = a.tx - a.x;
				const dy = a.ty - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const speed = a.animal === "elephant" ? .38 : a.animal === "warthog" ? .6 : .55;
				if (dist > 1.2) {
					a.x += dx / dist * speed;
					a.y += dy / dist * speed;
					if (Math.abs(dx) > .2) a.facing = dx > 0 ? "right" : "left";
				} else {
					a.x = a.tx;
					a.y = a.ty;
					a.actTimer++;
					if (a.activity !== "idle" && !a.running && a.actTimer > 30) {
						a.activity = "idle";
						a.tx = a.homeX;
						a.ty = a.homeY;
						a.actTimer = 0;
						a.actLimit = 200;
						return;
					}
					if (a.actTimer > a.actLimit) {
						if (a.running) {
							const next = pickActivityForRunning(a);
							a.tx = next.tx;
							a.ty = next.ty;
							a.activity = next.activity;
							a.actTimer = 0;
							a.actLimit = a.activity === "water" ? 240 : a.activity === "shade" ? 360 : 180;
						} else {
							a.tx = a.homeX;
							a.ty = a.homeY;
							a.activity = "idle";
							a.actTimer = 0;
							a.actLimit = 240;
						}
					}
				}
			});
			if (t % 24 === 0) animals.forEach((a) => {
				if (a.activity === "water" && Math.abs(a.x - a.tx) < 2 && Math.abs(a.y - a.ty) < 2) ripplesRef.current.push({
					x: a.x + 12,
					y: a.y + 18,
					r: 1,
					life: 0
				});
			});
			for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
				const r = ripplesRef.current[i];
				r.r += .4;
				r.life += 1;
				if (r.life > 40) ripplesRef.current.splice(i, 1);
			}
		};
		const drawAnimal = (a, t) => {
			if (a.animal === "giraffe") drawGiraffe(a, t);
			else if (a.animal === "warthog") drawWarthog(a, t);
			else drawElephant(a, t);
			const labelY = a.animal === "giraffe" ? a.activity === "tree" ? a.y - 14 : a.y - 8 : a.y - 4;
			drawLabel(T, a.running ? "●" : "○", (a.x + 9) * S$1, labelY * S$1, {
				role: "status",
				color: a.running ? "#7fbb3d" : "#aaa",
				align: "center",
				scale: S$1
			});
			if (a.lastMessage && Date.now() - a.msgAt < 7e3) {
				const msgAge = Date.now() - a.msgAt;
				const msgAlpha = msgAge > 6e3 ? (SPEECH_BUBBLE_MS - msgAge) / 1e3 : 1;
				drawSpeechBubble(T, a.lastMessage, (a.x + 9) * S$1, (labelY - 4) * S$1, {
					scale: S$1,
					alpha: msgAlpha
				});
			}
			const nameY = a.y + 32;
			const nameLines = drawLabel(T, a.name, (a.x + 9) * S$1, nameY * S$1, {
				role: "name",
				weight: "bold",
				color: "#fff",
				align: "center",
				scale: S$1,
				maxWidth: 64 * S$1
			});
			if (a.detail) drawLabel(T, a.detail, (a.x + 9) * S$1, (nameY + 6) * S$1 + (nameLines - 1) * sceneLineHeight("name"), {
				role: "detail",
				color: "#dcd2b8",
				align: "center",
				scale: S$1
			});
		};
		const draw = (t) => {
			T.clearRect(0, 0, W$1 * S$1, H$1 * S$1);
			drawBackground();
			drawTree(TREES[2].x, TREES[2].y, TREES[2].size);
			drawTree(TREES[0].x, TREES[0].y, TREES[0].size);
			drawTree(TREES[1].x, TREES[1].y, TREES[1].size);
			ripplesRef.current.forEach((r) => {
				const alpha = Math.max(0, 1 - r.life / 40);
				X.strokeStyle = `rgba(207, 230, 244, ${alpha.toFixed(2)})`;
				X.lineWidth = S$1;
				X.beginPath();
				X.ellipse(r.x * S$1, r.y * S$1, r.r * S$1, r.r * .4 * S$1, 0, 0, Math.PI * 2);
				X.stroke();
			});
			[...animalsRef.current].sort((a, b) => a.y - b.y).forEach((a) => drawAnimal(a, t));
			T.fillStyle = "#5e3a1d";
			T.font = sceneFont("title", "bold");
			T.textAlign = "center";
			T.fillText(i18nT("pages.scenes.wateringHoleScene.watering_hole"), W$1 / 2 * S$1, 22 * S$1);
			T.textAlign = "start";
			T.fillStyle = "#5e3a1d";
			T.font = sceneFont("status");
			T.fillText(i18nT("pages.scenes.wateringHoleScene.on_the_savanna", {
				n: animalsRef.current.length,
				total: MAX_ANIMALS
			}), 6 * S$1, 336 * S$1);
		};
		const stop = runSceneLoop(visibleRef, tickRef, update, draw);
		return () => {
			stop();
			ripples.length = 0;
		};
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W$1, H$1),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.wateringHoleScene.watering_hole_scene"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.wateringHoleScene.watering_hole_scene_labels"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/GhostScene.tsx
var GHOST_THEME = {
	active: "Haunting the codebase",
	idle: "Drifting through walls"
};
var W = 440;
var H = 300;
var S = SCENE_SCALE;
var GHOST_COLOR = "#e8ecf4";
var EYE_COLOR = "#14141e";
var OUTFITS = [
	{
		hat: "none",
		glasses: "round",
		cape: false,
		capeColor: ""
	},
	{
		hat: "witch",
		glasses: "none",
		cape: false,
		capeColor: ""
	},
	{
		hat: "none",
		glasses: "none",
		cape: true,
		capeColor: "#c0392b"
	},
	{
		hat: "top",
		glasses: "none",
		cape: false,
		capeColor: ""
	},
	{
		hat: "none",
		glasses: "shades",
		cape: true,
		capeColor: "#27408b"
	},
	{
		hat: "beanie",
		glasses: "none",
		cape: false,
		capeColor: ""
	},
	{
		hat: "party",
		glasses: "round",
		cape: false,
		capeColor: ""
	},
	{
		hat: "crown",
		glasses: "none",
		cape: true,
		capeColor: "#5b2c6f"
	}
];
/** Anchor positions for up to 8 ghosts - a loose two-row haunt */
var GHOST_SPOTS = [
	{
		x: 70,
		y: 120
	},
	{
		x: 170,
		y: 105
	},
	{
		x: 270,
		y: 125
	},
	{
		x: 360,
		y: 108
	},
	{
		x: 115,
		y: 205
	},
	{
		x: 220,
		y: 195
	},
	{
		x: 320,
		y: 210
	},
	{
		x: 400,
		y: 190
	}
];
function GhostScene({ agents, visible = true }) {
	const canvasRef = useRef(null);
	const textRef = useRef(null);
	const tickRef = useRef(0);
	const ghostsRef = useRef([]);
	const visibleRef = useRef(visible);
	const starsRef = useRef([]);
	const wispsRef = useRef([]);
	const shootingRef = useRef([]);
	const firefliesRef = useRef([]);
	const { canvasProps, tooltipEl } = useSceneInteraction(canvasRef, ghostsRef, W, H, GHOST_THEME, 14, void 0, agents);
	useEffect(() => {
		const stars = [];
		for (let i = 0; i < 70; i++) stars.push({
			x: Math.random() * W,
			y: Math.random() * H * .55,
			size: Math.random() < .2 ? 1.5 : .8,
			twinkle: Math.random() * Math.PI * 2,
			speed: .01 + Math.random() * .03
		});
		starsRef.current = stars;
		const wisps = [];
		for (let i = 0; i < 10; i++) wisps.push({
			x: Math.random() * W,
			y: H * .6 + Math.random() * H * .35,
			drift: Math.random() * Math.PI * 2,
			speed: .004 + Math.random() * .008,
			alpha: .04 + Math.random() * .06
		});
		wispsRef.current = wisps;
		const fireflies = [];
		for (let i = 0; i < 12; i++) fireflies.push({
			x: Math.random() * W,
			y: H * .45 + Math.random() * H * .45,
			drift: Math.random() * Math.PI * 2,
			speed: .006 + Math.random() * .012,
			blink: Math.random() * Math.PI * 2
		});
		firefliesRef.current = fireflies;
	}, []);
	useEffect(() => {
		const existing = ghostsRef.current;
		const newGhosts = [];
		agents.slice(0, GHOST_SPOTS.length).forEach((src, i) => {
			const prev = existing.find((g) => g.id === src.id);
			const spot = GHOST_SPOTS[i];
			if (prev) {
				prev.name = src.name;
				prev.running = src.running;
				prev.detail = src.detail;
				prev.tx = spot.x;
				prev.ty = spot.y;
				prev.kind = src.kind;
				if ((src.lastMessage || "") !== prev.lastMessage) {
					prev.lastMessage = src.lastMessage || "";
					prev.msgAt = Date.now();
				}
				newGhosts.push(prev);
			} else {
				const known = isKnownAgent("ghost", src.id);
				newGhosts.push({
					id: src.id,
					name: src.name,
					kind: src.kind,
					x: spot.x,
					y: known ? spot.y : 330,
					tx: spot.x,
					ty: spot.y,
					running: src.running,
					color: GHOST_COLOR,
					detail: src.detail,
					phase: Math.random() * Math.PI * 2,
					blinkTimer: 120 + Math.random() * 300,
					enterProgress: known ? 1 : 0,
					dir: 1,
					outfit: OUTFITS[i % OUTFITS.length],
					lastMessage: src.lastMessage || "",
					msgAt: 0
				});
				markAgentsKnown("ghost", [src.id]);
			}
		});
		ghostsRef.current = newGhosts;
		pruneAgents("ghost", newGhosts.map((g) => g.id));
	}, [agents]);
	useEffect(() => {
		const { X, T, d } = initSceneCanvases(canvasRef.current, textRef.current, W, H, S);
		/** Kiro ghost bitmap, 24×28 - shared trace from the reference art (eye holes filled; eyes drawn as overlay) */
		const GHOST_PIXELS = KIRO_GHOST_PIXELS;
		/** Draw one Kiro ghost, 24×28, anchored at top-left (gx, gy) */
		const drawGhost = (gx, gy, color, g, t) => {
			const o = g.outfit;
			if (o.cape) {
				const flutter = Math.sin(t * .08 + g.phase) * 1.5;
				const back = g.dir > 0 ? gx - 3 : gx + 23;
				d(back, gy + 6, 4, 14 + flutter, o.capeColor);
				d(back + (g.dir > 0 ? -1 : 1), gy + 9, 2, 9 + flutter, o.capeColor);
				d(gx + 4, gy + 6, 17, 1.8, o.capeColor);
			}
			X.fillStyle = color;
			GHOST_PIXELS.forEach((row, ry) => {
				let run = -1;
				for (let cx = 0; cx <= row.length; cx++) {
					const on = cx < row.length && row[cx] === "#";
					if (on && run < 0) run = cx;
					else if (!on && run >= 0) {
						X.fillRect((gx + run) * S, (gy + ry) * S, (cx - run) * S, 1 * S);
						run = -1;
					}
				}
			});
			const eyeShift = g.dir > 0 ? .5 : -.5;
			const blinking = g.blinkTimer < 6;
			if (blinking) {
				d(gx + 11 + eyeShift, gy + 9, 3, 1, EYE_COLOR);
				d(gx + 17 + eyeShift, gy + 9, 3, 1, EYE_COLOR);
			} else {
				d(gx + 11.5 + eyeShift, gy + 7, 2, 1, EYE_COLOR);
				d(gx + 11 + eyeShift, gy + 8, 3, 3, EYE_COLOR);
				d(gx + 11.5 + eyeShift, gy + 11, 2, 1, EYE_COLOR);
				d(gx + 17.5 + eyeShift, gy + 7, 2, 1, EYE_COLOR);
				d(gx + 17 + eyeShift, gy + 8, 3, 3, EYE_COLOR);
				d(gx + 17.5 + eyeShift, gy + 11, 2, 1, EYE_COLOR);
			}
			if (o.glasses === "round") {
				d(gx + 10 + eyeShift, gy + 6.2, 5, .9, "#3a3a4a");
				d(gx + 16 + eyeShift, gy + 6.2, 5, .9, "#3a3a4a");
				d(gx + 10 + eyeShift, gy + 6.2, .9, 6.5, "#3a3a4a");
				d(gx + 14.1 + eyeShift, gy + 6.2, .9, 6.5, "#3a3a4a");
				d(gx + 20.1 + eyeShift, gy + 6.2, .9, 6.5, "#3a3a4a");
				d(gx + 10 + eyeShift, gy + 11.8, 5, .9, "#3a3a4a");
				d(gx + 16 + eyeShift, gy + 11.8, 5, .9, "#3a3a4a");
				d(gx + 14.9 + eyeShift, gy + 7.5, 1.2, .9, "#3a3a4a");
			} else if (o.glasses === "shades") {
				d(gx + 10 + eyeShift, gy + 6.8, 4.6, 4.4, "#111");
				d(gx + 15.6 + eyeShift, gy + 6.8, 4.6, 4.4, "#111");
				d(gx + 14.4 + eyeShift, gy + 7.4, 1.4, 1, "#111");
				d(gx + 10.8 + eyeShift, gy + 7.5, 1.2, .9, "#8fa8ff");
				d(gx + 16.4 + eyeShift, gy + 7.5, 1.2, .9, "#8fa8ff");
			}
			if (o.hat === "witch") {
				d(gx + 6, gy - 1, 16, 1.8, "#2d1b4e");
				d(gx + 10, gy - 4.5, 7, 3.5, "#2d1b4e");
				d(gx + 11.8, gy - 7.5, 3.4, 3.4, "#2d1b4e");
				d(gx + 10, gy - 2, 7, 1.1, "#8e44ad");
			} else if (o.hat === "top") {
				d(gx + 7, gy - 1, 13, 1.4, "#181820");
				d(gx + 9, gy - 7, 9, 6, "#181820");
				d(gx + 9, gy - 2.2, 9, 1.2, "#b03a2e");
			} else if (o.hat === "party") {
				d(gx + 11, gy - 2.4, 4.6, 2.4, "#f39c12");
				d(gx + 12, gy - 4.8, 2.7, 2.4, "#e74c3c");
				d(gx + 12.7, gy - 6.4, 1.2, 1.6, "#f1c40f");
			} else if (o.hat === "beanie") {
				d(gx + 8, gy - 1.2, 11, 2.8, "#16a085");
				d(gx + 8, gy + .6, 11, 1, "#0e6655");
				d(gx + 12.7, gy - 2.8, 1.8, 1.8, "#f4d03f");
			} else if (o.hat === "crown") {
				d(gx + 9.5, gy - 2.4, 7.5, 2.4, "#f1c40f");
				d(gx + 9.5, gy - 4, 1.7, 1.9, "#f1c40f");
				d(gx + 12.4, gy - 4, 1.7, 1.9, "#f1c40f");
				d(gx + 15.3, gy - 4, 1.7, 1.9, "#f1c40f");
				d(gx + 12.8, gy - 1.6, 1.1, 1.1, "#e74c3c");
			}
			if (g.running && !blinking) {
				X.globalAlpha = .35;
				d(gx + 8 + eyeShift, gy + 12.5, 2, 1.1, "#ff8899");
				d(gx + 21 + eyeShift, gy + 12.5, 2, 1.1, "#ff8899");
				X.globalAlpha = 1;
			}
		};
		const drawBackground = (t) => {
			const grad = X.createLinearGradient(0, 0, 0, H * S);
			grad.addColorStop(0, "#171232");
			grad.addColorStop(.6, "#251c48");
			grad.addColorStop(1, "#332757");
			X.fillStyle = grad;
			X.fillRect(0, 0, W * S, H * S);
			starsRef.current.forEach((star) => {
				const alpha = .25 + Math.sin(t * star.speed + star.twinkle) * .32;
				X.globalAlpha = Math.max(.06, alpha);
				X.fillStyle = "#dbe2f7";
				X.fillRect(star.x * S, star.y * S, star.size * S, star.size * S);
			});
			X.globalAlpha = 1;
			if (t % 140 === 0 && Math.random() < .5 && shootingRef.current.length < 3) {
				const fromLeft = Math.random() < .5;
				shootingRef.current.push({
					x: fromLeft ? -5 : 445,
					y: 10 + Math.random() * H * .35,
					vx: (fromLeft ? 1 : -1) * (2.2 + Math.random() * 2),
					vy: .4 + Math.random() * .9,
					life: 0,
					maxLife: 45 + Math.random() * 30
				});
			}
			shootingRef.current.forEach((ss) => {
				ss.x += ss.vx;
				ss.y += ss.vy;
				ss.life++;
				const alpha = 1 - ss.life / ss.maxLife;
				for (let i = 0; i < 7; i++) {
					const ta = alpha * (1 - i * .14);
					X.fillStyle = `rgba(255,240,200,${Math.max(0, ta)})`;
					X.fillRect((ss.x - ss.vx * i * .6) * S, (ss.y - ss.vy * i * .6) * S, 2 * S, 1 * S);
				}
				X.fillStyle = `rgba(255,255,255,${alpha})`;
				X.fillRect(ss.x * S, ss.y * S, 2 * S, 2 * S);
			});
			shootingRef.current = shootingRef.current.filter((ss) => ss.life < ss.maxLife);
			const mx = 378, my = 46;
			const glow = X.createRadialGradient(mx * S, my * S, 0, mx * S, my * S, 40 * S);
			glow.addColorStop(0, "rgba(240,238,220,0.16)");
			glow.addColorStop(1, "transparent");
			X.fillStyle = glow;
			X.fillRect(338 * S, 6 * S, 80 * S, 80 * S);
			X.fillStyle = "#efe9d4";
			X.beginPath();
			X.arc(mx * S, my * S, 17 * S, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = "#ddd5bc";
			X.beginPath();
			X.arc(373 * S, 42 * S, 3.4 * S, 0, Math.PI * 2);
			X.fill();
			X.beginPath();
			X.arc(384 * S, 51 * S, 2.4 * S, 0, Math.PI * 2);
			X.fill();
			X.beginPath();
			X.arc(380 * S, 38 * S, 1.6 * S, 0, Math.PI * 2);
			X.fill();
			X.fillStyle = "#1e1740";
			X.beginPath();
			X.moveTo(0, H * .82 * S);
			X.quadraticCurveTo(W * .25 * S, H * .72 * S, W * .5 * S, H * .8 * S);
			X.quadraticCurveTo(W * .75 * S, H * .88 * S, W * S, H * .78 * S);
			X.lineTo(W * S, H * S);
			X.lineTo(0, H * S);
			X.fill();
			firefliesRef.current.forEach((ff) => {
				const fx = ff.x + Math.sin(t * ff.speed + ff.drift) * 18;
				const fy = ff.y + Math.cos(t * ff.speed * .8 + ff.drift) * 8;
				const glow = Math.max(0, Math.sin(t * .03 + ff.blink));
				if (glow > .15) {
					X.globalAlpha = glow * .8;
					X.fillStyle = "#ffe08a";
					X.fillRect(fx * S, fy * S, 1.2 * S, 1.2 * S);
					X.globalAlpha = glow * .25;
					X.fillRect((fx - 1) * S, (fy - 1) * S, 3.2 * S, 3.2 * S);
				}
			});
			X.globalAlpha = 1;
			wispsRef.current.forEach((wp) => {
				const wx = wp.x + Math.sin(t * wp.speed + wp.drift) * 24;
				X.globalAlpha = wp.alpha + Math.sin(t * wp.speed * 1.4 + wp.drift) * .02;
				X.fillStyle = "#a9b4d8";
				X.beginPath();
				X.ellipse(wx * S, wp.y * S, 34 * S, 6 * S, 0, 0, Math.PI * 2);
				X.fill();
			});
			X.globalAlpha = 1;
			T.fillStyle = "#a89ee0";
			T.font = sceneFont("title", "bold");
			T.fillText(i18nT("pages.scenes.ghostScene.kiro_haunt"), (W / 2 - 22) * S, 26 * S);
			T.fillStyle = "#7a70ad";
			T.font = sceneFont("detail");
			T.fillText(i18nT("pages.scenes.ghostScene.friendly_hauntings_only"), (W / 2 - 20) * S, 34 * S);
		};
		const update = (t) => {
			ghostsRef.current.forEach((g) => {
				if (g.enterProgress < 1) g.enterProgress = Math.min(1, g.enterProgress + .02);
				const ddx = g.tx - g.x, ddy = g.ty - g.y;
				if (Math.abs(ddx) > .5) {
					g.x += ddx * .04;
					g.dir = ddx > 0 ? 1 : -1;
				}
				if (Math.abs(ddy) > .5) g.y += ddy * .04;
				g.blinkTimer -= 1;
				if (g.blinkTimer <= 0) g.blinkTimer = 140 + Math.random() * 320;
			});
		};
		const draw = (t) => {
			T.clearRect(0, 0, W * S, H * S);
			drawBackground(t);
			[...ghostsRef.current].sort((a, b) => a.y - b.y).forEach((g) => {
				const bobAmp = g.running ? 2.6 : 1.1;
				const bobSpeed = g.running ? .055 : .022;
				const bob = Math.sin(t * bobSpeed + g.phase) * bobAmp;
				const gx = g.x - 12;
				const gy = g.y - 14 + bob;
				X.globalAlpha = g.enterProgress * (g.running ? 1 : .72);
				if (g.running) {
					const glow = X.createRadialGradient(g.x * S, (g.y + bob) * S, 0, g.x * S, (g.y + bob) * S, 24 * S);
					glow.addColorStop(0, g.color + "30");
					glow.addColorStop(1, "transparent");
					X.fillStyle = glow;
					X.fillRect((g.x - 24) * S, (g.y + bob - 24) * S, 48 * S, 48 * S);
				}
				X.globalAlpha = g.enterProgress * .18;
				X.fillStyle = "#000";
				X.beginPath();
				X.ellipse(g.x * S, (g.y + 17) * S, (8.5 - bob * .6) * S, 2.2 * S, 0, 0, Math.PI * 2);
				X.fill();
				X.globalAlpha = g.enterProgress * (g.running ? 1 : .72);
				drawGhost(gx, gy, g.color, g, t);
				X.globalAlpha = 1;
				drawLabel(T, g.running ? "haunting" : "idle", g.x * S, (gy - 11) * S, {
					role: "status",
					color: g.running ? "#4f4" : "#888",
					bgColor: "rgba(0,0,0,0.5)",
					align: "center",
					scale: S
				});
				if (g.lastMessage && Date.now() - g.msgAt < 7e3) {
					const msgAge = Date.now() - g.msgAt;
					const msgAlpha = msgAge > 6e3 ? (SPEECH_BUBBLE_MS - msgAge) / 1e3 : 1;
					drawSpeechBubble(T, g.lastMessage, g.x * S, (gy - 15) * S, {
						scale: S,
						alpha: msgAlpha
					});
				}
				const nameLines = drawLabel(T, g.name, g.x * S, (g.y + 21) * S, {
					role: "name",
					weight: "bold",
					color: "#fff",
					align: "center",
					scale: S,
					maxWidth: 64 * S
				});
				if (g.detail) drawLabel(T, g.detail, g.x * S, (g.y + 26) * S + (nameLines - 1) * sceneLineHeight("name"), {
					role: "detail",
					color: "#8f86c9",
					align: "center",
					scale: S
				});
			});
			T.fillStyle = "#4c4670";
			T.font = sceneFont("label");
			T.fillText(`kiro haunt · ${ghostsRef.current.length} ghosts`, 4 * S, 296 * S);
		};
		return runSceneLoop(visibleRef, tickRef, update, draw);
	}, []);
	useVisibleSync(visibleRef, visible);
	return /* @__PURE__ */ jsxs("div", {
		style: SCENE_CONTAINER_STYLE(W, H),
		children: [
			/* @__PURE__ */ jsx("canvas", {
				ref: canvasRef,
				"aria-label": i18nT("pages.scenes.ghostScene.kiro_ghost_haunt_animation"),
				style: {
					...PIXEL_CANVAS_STYLE,
					...canvasProps.style
				},
				onMouseMove: canvasProps.onMouseMove,
				onMouseLeave: canvasProps.onMouseLeave,
				onClick: canvasProps.onClick
			}),
			/* @__PURE__ */ jsx("canvas", {
				ref: textRef,
				"aria-label": i18nT("pages.scenes.ghostScene.kiro_ghost_haunt_text_overlay"),
				style: TEXT_CANVAS_STYLE
			}),
			tooltipEl
		]
	});
}
// src/pages/scenes/components.ts
var SCENE_COMPONENTS = {
	office: OfficeScene,
	panda: PandaOfficeScene,
	neural: NeuralConstellationScene,
	wizard: WizardTowerScene,
	underwater: UnderwaterLabScene,
	mission: MissionControlScene,
	serengeti: WateringHoleScene,
	ghost: GhostScene
};
// src/components/RadioChipGroup.tsx
/**
* One-of-N choice drawn as a row of buttons (chips, swatches, mode buttons),
* announced and operated as a radio group (WAI-ARIA radio pattern).
*
* Why not `aria-pressed`: `aria-pressed` reads as N independent on/off toggles,
* so a screen-reader user hears "pressed" / "not pressed" per button and is
* never told the buttons are one single-select set (kirodotdev/KiroCrew#27459). A genuine two-state
* toggle (one button that is on or off, or a pair where pressing the active one
* clears it) keeps `aria-pressed` and does not use this group.
*
* How to use: wrap the options in `<RadioChipGroup>` with a name
* (`ariaLabel` or `ariaLabelledBy`), and give each option `{...radioChip(checked)}`
* instead of `aria-pressed`. Options must be focusable elements (`<button>`).
*
* The group owns the keyboard behaviour so no call site re-implements it:
* - One Tab stop. While focus is inside the group it is the focused option;
*   otherwise it is the checked option, or the first enabled one when none is
*   checked. The group sets each option's `tabIndex` itself, so options must
*   NOT pass their own `tabIndex` prop.
* - Arrow keys (Right/Down next, Left/Up previous, wrapping) and Home/End move
*   focus; disabled options are skipped. By default they do NOT select: many
*   consumers save on every change (settings write config, a palette saves and
*   closes, the guide's pick list commits and unmounts), so passing over an
*   option must never persist it. Space/Enter (the native button click)
*   chooses. This is the rule `SegmentedControl` already follows.
* - `selectOnArrow` opts a group into "arrow moves AND selects" (the native
*   radio behaviour), for a group where a pick is cheap and reversible and
*   that behaviour is already established (the sidebar duration chips, kirodotdev/KiroCrew#22330).
* - The key is consumed (`stopPropagation`) so a host Radix menu does not also
*   treat it as its own item-to-item navigation and pull focus out.
*/
function RadioChipGroup({ ariaLabel, ariaLabelledBy, className, style, children, onKeyDown: ownKeyDown, selectOnArrow = false, "data-testid": testId }) {
	const ref = useRef(null);
	useLayoutEffect(() => {
		if (ref.current) placeTabStop(ref.current);
	});
	const onKeyDown = (e) => {
		ownKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (!(e.key === "Home" || e.key === "End") && RADIO_KEY_STEP[e.key] === void 0) return;
		const radios = ownRadios(e.currentTarget).filter((r) => !isDisabled(r));
		if (radios.length === 0) return;
		e.preventDefault();
		e.stopPropagation();
		const current = radios.indexOf(document.activeElement);
		const next = e.key === "Home" ? 0 : e.key === "End" ? radios.length - 1 : (Math.max(current, 0) + RADIO_KEY_STEP[e.key] + radios.length) % radios.length;
		radios[next].focus();
		if (selectOnArrow) radios[next].click();
	};
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "radiogroup",
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledBy,
		className,
		style,
		onKeyDown,
		"data-testid": testId,
		onFocus: (e) => placeTabStop(e.currentTarget),
		onBlur: (e) => {
			const group = e.currentTarget;
			if (!group.contains(e.relatedTarget)) placeTabStop(group, true);
		},
		children
	});
}
/** The attributes an option inside a `RadioChipGroup` carries in place of
*  `aria-pressed`. */
function radioChip(checked) {
	return {
		role: "radio",
		"aria-checked": checked
	};
}
/** Arrow-key step through a radio group (WAI-ARIA radio pattern: Right/Down is
*  the next radio, Left/Up the previous, wrapping at either end). */
var RADIO_KEY_STEP = {
	ArrowRight: 1,
	ArrowDown: 1,
	ArrowLeft: -1,
	ArrowUp: -1
};
/** Give exactly one of the group's own enabled radios `tabIndex` 0: the
*  focused one while focus is inside (unless `leaving`), else the checked one,
*  else the first. */
function placeTabStop(group, leaving = false) {
	const radios = ownRadios(group);
	const enabled = radios.filter((r) => !isDisabled(r));
	const stop = (leaving ? void 0 : enabled.find((r) => r === document.activeElement)) ?? enabled.find((r) => r.getAttribute("aria-checked") === "true") ?? enabled[0];
	for (const r of radios) r.tabIndex = r === stop ? 0 : -1;
}
/** This group's own radios, not those of a radio group nested inside it. */
function ownRadios(group) {
	return Array.from(group.querySelectorAll("[role=\"radio\"]")).filter((r) => r.closest("[role=\"radiogroup\"]") === group);
}
function isDisabled(el) {
	return el.disabled === true || el.getAttribute("aria-disabled") === "true";
}
// src/pages/WorldsPage.tsx
function WorldsPage({ host }) {
	const [scene, setScene] = useState(() => {
		const saved = localStorage.getItem(SCENE_STORAGE_KEY);
		return SCENES.find((s) => s.key === saved)?.key ?? "office";
	});
	const [collapsed, setCollapsed] = useState(false);
	const { agents, maxAgents } = useAgentSync(host);
	const { popoutActive, broadcastScene, openPopout } = usePopoutSync(false, (s) => setScene(s));
	const activeCount = agents.filter((a) => a.running).length;
	useEffect(() => {
		safeSetItem(SCENE_STORAGE_KEY, scene);
	}, [scene]);
	const changeScene = (key) => {
		setScene(key);
		broadcastScene(key);
	};
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "100%"
		},
		children: [/* @__PURE__ */ jsx("div", {
			id: "worlds-collapse-panel",
			"data-testid": "collapse-panel",
			style: {
				display: "grid",
				gridTemplateRows: collapsed ? "0fr" : "1fr",
				opacity: collapsed ? 0 : 1,
				transition: "grid-template-rows 0.5s ease, opacity 0.3s ease",
				flexShrink: 0,
				position: "relative",
				zIndex: 10
			},
			...collapsed ? { inert: "" } : {},
			children: /* @__PURE__ */ jsxs("div", {
				style: { overflow: "hidden" },
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mc-aw-pad mc-aw-head",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "mc-aw-title",
						children: [
							/* @__PURE__ */ jsx(Sparkles, { className: "lucide-inline" }),
							" ",
							i18nT("pages.worldsPage.agent_worlds")
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "mc-aw-sub",
						children: i18nT("pages.worldsPage.summary", {
							present: i18nT("pages.worldsPage.agents_present", {
								count: agents.length,
								n: fmtNumber(agents.length)
							}),
							active: i18nT("pages.worldsPage.agents_active", {
								count: activeCount,
								n: fmtNumber(activeCount)
							}),
							open: i18nT("pages.worldsPage.slots_open", {
								count: maxAgents - agents.length,
								n: fmtNumber(maxAgents - agents.length)
							})
						})
					})]
				}), /* @__PURE__ */ jsx(RadioChipGroup, {
					className: "mc-aw-pad mc-aw-chips",
					style: {
						display: "flex",
						gap: 6,
						flexWrap: "wrap"
					},
					ariaLabel: i18nT("pages.worldsPage.scene_label"),
					children: SCENES.map((s) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => changeScene(s.key),
						title: s.desc,
						...radioChip(scene === s.key),
						"aria-label": i18nT("pages.worldsPage.scene_button", {
							label: s.label,
							desc: s.desc
						}),
						style: {
							padding: "5px 12px",
							borderRadius: 6,
							border: scene === s.key ? "1.5px solid var(--accent, #f90)" : "1.5px solid var(--border, #333)",
							background: scene === s.key ? "var(--accent, #f90)" : "var(--bg-elevated, #1a1a2e)",
							color: scene === s.key ? "#000" : "var(--text-muted, #999)",
							cursor: "pointer",
							fontSize: 13,
							fontFamily: "var(--font-body, inherit)",
							transition: "all 0.15s ease",
							display: "flex",
							alignItems: "center",
							gap: 5
						},
						children: [/* @__PURE__ */ jsx("span", { children: s.icon }), /* @__PURE__ */ jsx("span", { children: s.label })]
					}, s.key))
				})]
			})
		}), /* @__PURE__ */ jsx("div", {
			className: "mc-aw-pad mc-aw-stage",
			style: {
				flex: 1,
				display: "flex",
				justifyContent: "center",
				alignItems: "start",
				minHeight: 0
			},
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					position: "relative",
					width: "100%",
					maxWidth: 1440,
					aspectRatio: "3/2"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							position: "absolute",
							top: 8,
							right: 8,
							zIndex: 20,
							display: "flex",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("button", {
							onClick: () => setCollapsed((c) => !c),
							title: collapsed ? i18nT("pages.worldsPage.show_controls") : i18nT("pages.worldsPage.hide_controls"),
							"aria-expanded": !collapsed,
							"aria-controls": "worlds-collapse-panel",
							"aria-label": collapsed ? i18nT("pages.worldsPage.show_controls") : i18nT("pages.worldsPage.hide_controls"),
							className: "mc-aw-overlay-btn",
							style: {
								border: "1px solid var(--border, #333)",
								borderRadius: 6,
								padding: "3px 8px",
								cursor: "pointer",
								color: "var(--text-muted, #999)",
								fontSize: 16,
								lineHeight: 1
							},
							children: collapsed ? "▼" : "▲"
						}), /* @__PURE__ */ jsx("button", {
							onClick: openPopout,
							title: i18nT("pages.worldsPage.pop_out_to_separate_window"),
							"aria-label": i18nT("pages.worldsPage.pop_out_to_separate_window"),
							className: "mc-aw-overlay-btn",
							style: {
								border: "1px solid var(--border, #333)",
								borderRadius: 6,
								padding: "3px 6px",
								cursor: "pointer",
								color: "var(--text-muted, #999)",
								lineHeight: 1,
								display: "flex",
								alignItems: "center"
							},
							children: /* @__PURE__ */ jsx(PictureInPicture2, { size: 14 })
						})]
					}),
					popoutActive && /* @__PURE__ */ jsxs("div", {
						style: {
							position: "absolute",
							inset: 0,
							zIndex: 15,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							background: "var(--bg, #0a0a1a)",
							borderRadius: 8,
							gap: 12
						},
						children: [
							/* @__PURE__ */ jsx(PictureInPicture2, {
								size: 32,
								style: {
									color: "var(--accent, #f90)",
									opacity: .7
								}
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									color: "var(--text-muted, #999)",
									fontSize: 14
								},
								children: i18nT("pages.worldsPage.playing_in_popout_window")
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: openPopout,
								style: {
									padding: "6px 16px",
									borderRadius: 6,
									fontSize: 13,
									cursor: "pointer",
									border: "1px solid var(--border, #333)",
									background: "var(--bg-elevated, #1a1a2e)",
									color: "var(--text, #eee)",
									fontFamily: "var(--font-body, inherit)"
								},
								children: i18nT("pages.worldsPage.focus_popout")
							})
						]
					}),
					SCENES.map((s) => {
						const C = SCENE_COMPONENTS[s.key];
						return /* @__PURE__ */ jsx("div", {
							style: { display: scene === s.key ? "contents" : "none" },
							children: /* @__PURE__ */ jsx(C, {
								agents,
								visible: scene === s.key && !popoutActive
							})
						}, s.key);
					})
				]
			})
		})]
	});
}
// src/pages/WorldsPopout.tsx
function WorldsPopout({ host }) {
	const [scene, setScene] = useState(() => {
		const saved = localStorage.getItem(SCENE_STORAGE_KEY);
		return SCENES.find((s) => s.key === saved)?.key ?? "office";
	});
	const [collapsed, setCollapsed] = useState(false);
	const collapseLabel = collapsed ? i18nT("pages.worldsPopout.show_controls") : i18nT("pages.worldsPopout.hide_controls");
	const { agents } = useAgentSync(host);
	const { broadcastScene } = usePopoutSync(true, (s) => setScene(s));
	useEffect(() => {
		safeSetItem(SCENE_STORAGE_KEY, scene);
	}, [scene]);
	const changeScene = (key) => {
		setScene(key);
		broadcastScene(key);
	};
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "100vh",
			background: "var(--bg, #0a0a1a)"
		},
		children: [/* @__PURE__ */ jsx("div", {
			id: "popout-collapse-panel",
			style: {
				display: "grid",
				gridTemplateRows: collapsed ? "0fr" : "1fr",
				opacity: collapsed ? 0 : 1,
				transition: "grid-template-rows 0.5s ease, opacity 0.3s ease",
				flexShrink: 0
			},
			...collapsed ? { inert: "" } : {},
			children: /* @__PURE__ */ jsx("div", {
				style: { overflow: "hidden" },
				children: /* @__PURE__ */ jsx(RadioChipGroup, {
					style: {
						display: "flex",
						gap: 4,
						padding: "8px 12px",
						flexWrap: "wrap",
						alignItems: "center"
					},
					ariaLabel: i18nT("pages.worldsPopout.scene_label"),
					children: SCENES.map((s) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => changeScene(s.key),
						...radioChip(scene === s.key),
						style: {
							padding: "4px 10px",
							borderRadius: 6,
							fontSize: 12,
							border: scene === s.key ? "1.5px solid var(--accent, #f90)" : "1.5px solid var(--border, #333)",
							background: scene === s.key ? "var(--accent, #f90)" : "var(--bg-elevated, #1a1a2e)",
							color: scene === s.key ? "#000" : "var(--text-muted, #999)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 4,
							fontFamily: "var(--font-body, inherit)",
							transition: "all 0.15s ease"
						},
						children: [/* @__PURE__ */ jsx("span", { children: s.icon }), /* @__PURE__ */ jsx("span", { children: s.label })]
					}, s.key))
				})
			})
		}), /* @__PURE__ */ jsx("div", {
			style: {
				flex: 1,
				display: "flex",
				justifyContent: "center",
				alignItems: "start",
				padding: "0 12px 12px",
				minHeight: 0
			},
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					position: "relative",
					width: "100%",
					maxWidth: 1440,
					aspectRatio: "3/2"
				},
				children: [/* @__PURE__ */ jsx("button", {
					onClick: () => setCollapsed((c) => !c),
					title: collapseLabel,
					"aria-label": collapseLabel,
					"aria-expanded": !collapsed,
					"aria-controls": "popout-collapse-panel",
					className: "mc-aw-overlay-btn",
					style: {
						position: "absolute",
						top: 8,
						right: 8,
						zIndex: 20,
						border: "1px solid var(--border, #333)",
						borderRadius: 6,
						padding: "3px 8px",
						cursor: "pointer",
						color: "var(--text-muted, #999)",
						fontSize: 16,
						lineHeight: 1
					},
					children: collapsed ? "▼" : "▲"
				}), SCENES.map((s) => {
					const C = SCENE_COMPONENTS[s.key];
					return /* @__PURE__ */ jsx("div", {
						style: { display: scene === s.key ? "contents" : "none" },
						children: /* @__PURE__ */ jsx(C, {
							agents,
							visible: scene === s.key
						})
					}, s.key);
				})]
			})
		})]
	});
}
// src/styles.ts
/**
* The page's own CSS. The built-in page used the dashboard's utility classes,
* which exist only while some dashboard source names them; a bundle carries
* what it draws with, so the same rules are written out here under one
* `mc-aw-` prefix, with the dashboard's theme tokens (`--text-strong`,
* `--muted`, `--danger`) so every theme still applies.
*/
var AW_CSS = `
.mc-aw-root { height:100%; }
.mc-aw-root .lucide-inline { display:inline-block; width:1em; height:1em; vertical-align:-0.125em; flex-shrink:0; }
.mc-aw-pad { padding-left:1rem; padding-right:1rem; }
@media (min-width:768px) { .mc-aw-pad { padding-left:1.5rem; padding-right:1.5rem; } }
.mc-aw-head { padding-top:0.5rem; padding-bottom:0.5rem; }
.mc-aw-chips { padding-bottom:0.5rem; }
.mc-aw-stage { padding-bottom:1.25rem; }
.mc-aw-title { font-size:1.125rem; line-height:1.75rem; font-weight:600; color:var(--text-strong, var(--text)); }
.mc-aw-sub { font-size:0.875rem; line-height:1.25rem; color:var(--muted); }
.mc-aw-overlay-btn { background-color:rgb(0 0 0 / 0.55); transition:color .15s, background-color .15s; }
.mc-aw-overlay-btn:hover { background-color:rgb(0 0 0 / 0.75); }
.mc-aw-notice { padding:0 0.5rem 0.375rem; }
.mc-aw-notice.mc-aw-danger, .mc-aw-notice.mc-aw-danger * { color:var(--danger) !important; }
.mc-aw-notice.mc-aw-red, .mc-aw-notice.mc-aw-red * { color:#f88 !important; }
.mc-aw-warn { display:flex; align-items:flex-start; gap:0.375rem; padding:0 0.5rem 0.375rem; font-size:12px; }
.mc-aw-warn-icon { flex-shrink:0; margin-top:1px; }
.mc-aw-host-notice { padding:1rem 1.5rem; }
`;
// src/index.tsx
/**
* The bundle's entry: AppHost lazy-imports this module and renders its default
* export as the app's page.
*
* It subscribes to the host's language generation, which is what repaints the
* page on a language switch (`i18nT` reads the active locale at call time, and
* this component's re-render reaches every child), and hands the host's
* session control to the scenes. In the dashboard's pop-out window it renders
* the pop-out layout, which keeps the scene in sync with the main page.
*/
function Worlds({ useSessions }) {
	const host = useSessions();
	if (!host.can.sessions) return /* @__PURE__ */ jsx(HostTooOld, {});
	return /* @__PURE__ */ jsx(HostSessionsContext.Provider, {
		value: host,
		children: isPopoutWindow() ? /* @__PURE__ */ jsx(WorldsPopout, { host }) : /* @__PURE__ */ jsx(WorldsPage, { host })
	});
}
function HostTooOld() {
	return /* @__PURE__ */ jsx("div", {
		className: "mc-aw-host-notice",
		children: /* @__PURE__ */ jsx(ErrorNotice, {
			variant: "block",
			testId: "aw-host-too-old",
			message: i18nT("app.needs_newer_host")
		})
	});
}
function AgentWorldsApp() {
	useLanguageGeneration();
	return /* @__PURE__ */ jsxs("div", {
		className: "mc-aw-root",
		children: [/* @__PURE__ */ jsx("style", { children: AW_CSS }), useHostSessions ? /* @__PURE__ */ jsx(Worlds, { useSessions: useHostSessions }) : /* @__PURE__ */ jsx(HostTooOld, {})]
	});
}
export { AgentWorldsApp as default };
