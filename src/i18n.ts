// UI strings of the site. Keys are the English text; German is the only other language. Content
// (résumé, posts, privacy, legal notice) comes from `content/` and `blog/`, never from here.

const DE: Record<string, string> = {
    'Skip to content': 'Zum Inhalt springen',
    'Main menu': 'Hauptmenü',
    Menu: 'Menü',
    Language: 'Sprache',
    Logbook: 'Logbuch',
    CV: 'Lebenslauf',
    Support: 'Unterstützen',
    Privacy: 'Datenschutz',
    'Legal notice': 'Impressum',
    'Atom feed': 'Atom-Feed',
    Inventory: 'Inventar',
    'Skill tree': 'Fähigkeitenbaum',
    'Switch day and night': 'Tag und Nacht wechseln',
    'Latest entries': 'Neueste Einträge',
    'All entries': 'Alle Einträge',
    'Log entry': 'Logbuch-Eintrag',
    'Entries tagged “{tag}”': 'Einträge mit „{tag}“',
    'All tags': 'Alle Tags',
    'Entries by {name}': 'Einträge von {name}',
    'No entries in this language yet.': 'In dieser Sprache gibt es noch keine Einträge.',
    'Subscribe to the feed': 'Feed abonnieren',
    'Subscribe to “{tag}”': '„{tag}“ abonnieren',
    'By topic:': 'Nach Thema:',
    'Updated {date}': 'Aktualisiert am {date}',
    Draft: 'Entwurf',
    'Newer entry': 'Neuerer Eintrag',
    'Older entry': 'Älterer Eintrag',
    'Back to the logbook': 'Zurück zum Logbuch',
    'Back to {name}': 'Zurück zu {name}',
    'If this post was useful to you, you can support my work.':
        'Wenn dir dieser Beitrag geholfen hat, kannst du meine Arbeit unterstützen.',
    'Support my work': 'Meine Arbeit unterstützen',
    'Character sheet': 'Charakterbogen',
    Quests: 'Quests',
    Education: 'Ausbildung',
    Skills: 'Fähigkeiten',
    Languages: 'Sprachen',
    'Things I made': 'Was ich gebaut habe',
    'Work and projects': 'Arbeit und Projekte',
    Items: 'Gegenstände',
    'Earlier quests': 'Frühere Quests',
    Profiles: 'Profile',
    today: 'heute',
    'Print this page': 'Seite drucken',
    'Pixel-art figure of {name} on the dike': 'Pixel-Figur von {name} auf dem Deich',
    'Portrait of {name} in pixel art': 'Porträt von {name} als Pixelgrafik',
    'Experience, projects and skills of {name}.': 'Erfahrung, Projekte und Fähigkeiten von {name}.',
    'Software and writing by {name}.': 'Software und Texte von {name}.',
    '{name} writes free software. Support the work with a transfer or a service.':
        '{name} schreibt freie Software. Unterstütze die Arbeit per Überweisung oder über einen Dienst.',
    'Bank transfer': 'Überweisung',
    Recipient: 'Empfänger',
    Reference: 'Verwendungszweck',
    'Scan with your banking app': 'Mit der Banking-App scannen',
    'QR code for a bank transfer': 'QR-Code für eine Überweisung',
    'Who publishes this site, and how to reach them.': 'Wer diese Seite betreibt und wie man sie erreicht.',
    'What this site does with data.': 'Was diese Seite mit Daten macht.',
    'Source code': 'Quellcode',
    'Home page': 'Startseite',
    'Photo of {name}': 'Foto von {name}',
};

export type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Keys a German page asked for that `DE` does not have; the build prints them. */
export const missing = new Set<string>();

export function translator(lang: string): Translate {
    return (key, values = {}) => {
        let text = key;
        if (lang === 'de') {
            const german = DE[key];
            if (german === undefined) missing.add(key);
            else text = german;
        }
        return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
    };
}
