# Link Editor

## Überblick

Link Editor ist ein leistungsstarkes Userscript, das das Surfen im Web verbessert, indem es Benutzern ermöglicht, Linktitel und -verhalten über Websites hinweg anzupassen. Es bietet eine benutzerfreundliche Oberfläche zur Verwaltung von Link-Attributen und zur Verbesserung der Navigation.

## Hauptfunktionen

- Fügen Sie benutzerdefinierte Tooltips zu Links basierend auf deren Textinhalt hinzu
- Steuern Sie, ob sich Links in neuen Tabs öffnen
- Wenden Sie Anpassungen auf spezifische URL-Muster an
- Einfach zu bedienende Einstellungsoberfläche zur Verwaltung von Regeln
- Drag-and-Drop-Schnittstelle zum Organisieren von Regeln
- Tastenkürzel `Ctrl + Alt + 0` für schnellen Zugriff auf Einstellungen

## Funktionsweise

1. Benutzer definieren Regeln mit CSS-Selektoren, um bestimmte Elemente anzusprechen
2. Das Skript fügt den übereinstimmenden Elementen Titelattribute hinzu und erstellt Tooltips
3. Bei verlinkten Elementen kann es eingestellt werden, dass sie sich in neuen Tabs öffnen
4. Regeln werden dynamisch angewendet, wenn sich die Seite ändert

## Verwendung

- Öffnen Sie das Einstellungsfenster über das Userscript-Menü des Browsers oder das Tastenkürzel `Ctrl + Alt + 0`
- Fügen Sie neue Regeln hinzu, indem Sie auf die Schaltfläche '+' klicken
- Konfigurieren Sie jede Regel mit:
  - Titel: Der im Tooltip anzuzeigende Text
  - Selektor: CSS-Selektor zum Ansprechen von Elementen
  - URL-Muster: Regulärer Ausdruck zum Abgleichen von Website-URLs
  - Ein-/Ausschalten
  - Option "In neuem Tab öffnen" für Links

## Technische Details

- Verwendet MutationObserver zur Behandlung dynamischer Inhalte
- Speichert Einstellungen in GM_setValue zur Persistenz
- Implementiert ein verschiebbares Einstellungsfenster
- Responsives Design für verschiedene Bildschirmgrößen

## Installation

1. Installieren Sie einen Userscript-Manager (z.B. Tampermonkey)
2. Kopieren Sie den Skriptcode
3. Erstellen Sie ein neues Userscript in Ihrem Manager und fügen Sie den Code ein
4. Speichern und aktivieren Sie das Skript

Verbessern Sie Ihr Surferlebnis mit der anpassbaren Link-Verwaltung von Link Editor!
