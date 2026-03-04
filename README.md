# Soundspace

Soundspace is a browser-based rhythm game featuring timing-based note hits, a beatmap editor, a cosmetic shop and inventory system, and gameplay modifiers. The project runs entirely client-side and requires no backend.

## Features

### Gameplay

- Timing-based hit detection with Perfect, Great, OK, and Miss judgements  
- Combo, score, accuracy, and multiplier tracking  
- Health-based fail mode (Deaths mode)  
- Hidden, HardRock, Easy, SuddenDeath, Perfect, and Bot modifiers  
- Custom cursor skins with support for unbuyable or admin-only skins  
- Smooth note animations with easing and approach effects  

### Beatmap Editor

- Real-time audio scrubbing  
- Click-to-place notes  
- Drag-to-move notes  
- Adjustable note speed  
- Adjustable default note points  
- Import and export of `.beatmap` files  
- MP3 song loading  
- Visual timing preview for notes  

### Economy and Cosmetics

- Coin system based on accuracy and hits  
- Shop with purchasable cursor skins  
- Inventory with equip and ownership logic  
- Support for unbuyable skins that do not appear in the shop  

## Project Structure

```text
/public
  /beatmaps        Audio files and exported beatmaps
  /skins           Cursor skin images
/src
  main.js          Gameplay engine
  maker.js         Beatmap editor
  mods.js          Modifier logic
  globals.js       Shared constants and coin system
  shop.js          Shop UI and purchasing logic
  inventory.js     Inventory UI and equip logic
  mapload.js       Beatmap loader
  score.js         Scoring and judgement logic
  alert.js         Popup system
index.html
game.html
maker.html
shop.html
inventory.html
