**V1 Spec**

**1\. Core concept**

A retro pixel RPG web app for the Home Theater team.

Each employee has their **own character and progression**.  
They enter each sale individually.  
Each sale gives:

- XP
- gold
- battle damage
- quest progress

Each player moves through:

- 2-3 mini-enemies
- then 1 boss
- across **5 bosses total this season**

This is **not team-based**. Everyone progresses on their own path.

**2\. MVP goals**

The app should let players:

- enter employee number
- access their character/profile
- submit sales one at a time
- gain XP/gold
- fight enemies with calculated battle logic
- buy weapons, armor, potions, cosmetics
- see their level and leaderboard rank
- track quest progress
- progress through the season map

The app should let managers:

- view recent sales
- delete bad sales
- add gold to players

**3\. Theme / art direction**

**Style:** retro pixel RPG

Visual vibe:

- pixel UI panels
- pixel enemy sprites
- pixel player portraits/cards
- pixel weapon/armor/item icons
- pixel overworld path/map nodes
- damage popups, crit popups, quest banners

**4\. Core gameplay loop**

**Player loop**

- Open site
- Enter employee number
- Land on dashboard
- See:
  - player level
  - XP progress
  - gold
  - equipped weapon
  - equipped armor
  - active potion effect if any
  - current enemy or boss
  - quest progress
  - leaderboard preview
- Click **Made Sale**
- Enter:
  - TV price
  - basket amount
  - checkboxes:
    - audio
    - services
    - protection
    - membership
    - card
- Submit
- Battle result appears:
  - damage dealt
  - XP gained
  - gold gained
  - any crit/combo/shield break text
  - enemy HP reduced
- Return to dashboard
- Optionally visit:

- shop
- inventory
- leaderboard
- map

**5\. Progression structure**

**Season structure**

- 5 worlds / stages
- each world contains:
  - 2 or 3 mini-enemies
  - 1 boss
- when boss is defeated, next world unlocks

**Player progression**

Each player has:

- level
- total XP
- gold
- equipped weapon
- equipped armor
- active potion
- inventory
- cosmetic selection
- current world
- current enemy
- enemy HP state
- sales history

**6\. Leaderboard**

Primary ranking metric:

- **Level**

Secondary displayed stats:

- XP
- gold
- bosses cleared
- total sales entered
- maybe current world/stage

This keeps it simple and lines up with your goal.

**7\. Sales input system**

Every sale is entered individually.

**Sale form fields**

Required:

- TV price
- basket amount

Checkboxes:

- audio
- services
- protection
- membership
- card

Optional hidden metadata:

- timestamp
- player ID
- created automatically by app

**8\. Reward formula, V1**

We can tune this later, but here's a very good starting point.

**XP**

- Base XP per sale: **20**
- TV price bonus: **1 XP per \$50 of TV price**
- Basket bonus: **1 XP per \$100 of basket**
- Audio: **+10 XP**
- Services: **+15 XP**
- Protection: **+8 XP**
- Membership: **+12 XP**
- Card: **+15 XP**

**Gold**

- Base gold per sale: **10**
- TV price bonus: **1 gold per \$200 TV price**
- Basket bonus: **1 gold per \$150 basket**
- Audio: **+4 gold**
- Services: **+6 gold**
- Protection: **+3 gold**
- Membership: **+5 gold**
- Card: **+6 gold**

This gives meaningful bonuses without making one checkbox absurdly dominant.

**9\. Battle formula, V1**

This is your Level 2 combat system.

**Player battle stats**

Derived from:

- weapon attack bonus
- armor defense bonus
- potion daily buff
- sale entry bonuses

**Damage formula**

Start with:

**Base damage = 10**

Then add:

- - floor(TV price / 200)
    - floor(basket / 150)
- Audio: +8 damage
- Services: +12 damage
- Protection: +5 damage
- Membership: +10 damage
- Card: +12 damage
- Weapon attack bonus
- Potion bonus if active

**Bonus mechanics**

- **Services** can trigger "shield break" on shielded enemies
- **Membership or card** can trigger crit chance boost
- **Audio** can trigger combo text / bonus damage
- Bosses can have simple traits:
  - armored
  - crit vulnerable
  - combo vulnerable

**Enemy flow**

- each enemy has HP
- sale submission deals damage
- when HP hits 0:
  - enemy defeated animation
  - reward granted
  - next enemy unlocks

**10\. Items**

**Weapons**

Purpose:

- increase attack bonus

Examples:

- Training Sword: +2 attack
- Bronze Blade: +5 attack
- Neon Katana: +9 attack
- Pixel Slayer: +14 attack

**Armor**

Purpose:

- small defense bonus
- can later affect certain boss mechanics if wanted

Examples:

- Cloth Vest: +2 defense
- Chain Vest: +5 defense
- Arcade Armor: +9 defense
- Bossbreaker Plate: +14 defense

**Potions**

Purpose:

- apply a buff for the **current calendar day only**

Examples:

- Attack Potion: +10 damage on all sales today
- Gold Potion: +25% gold today
- XP Potion: +25% XP today

**Cosmetics**

Purpose:

- profile flex only

Examples:

- portrait frame
- title
- background
- badge
- pixel pet icon

**11\. Inventory system**

Each player has:

- owned weapons
- owned armor
- owned potions
- owned cosmetics
- currently equipped weapon
- currently equipped armor
- currently equipped cosmetic
- active potion effect + expiration date

**12\. Quest system**

**Daily quests**

Examples:

- Enter 2 sales
- Get 1 audio attach
- Get 1 service attach
- Sell a TV over \$800
- Hit basket over \$1200 once

**Weekly quests**

Examples:

- Get 3 services
- Get 2 memberships/cards
- Enter 8 sales
- Clear 2 mini-enemies
- Earn 300 gold

Rewards:

- XP
- gold
- sometimes potion or cosmetic

**13\. Manager tools**

Managers can:

- view recent sale entries
- delete a sale
- award gold to a player

Managers cannot be self-assigned through UI.

For V1:

- manager employee numbers are stored in a hardcoded config or a protected Firestore collection
- if employee number matches that list, manager tab appears

That's the simplest version that stops random people from toggling themselves in the front end.

**14\. Main screens**

**1\. Login / entry screen**

- enter employee number

**2\. Player dashboard**

- level
- XP bar
- gold
- current enemy/boss
- active quests
- quick links

**3\. Sale entry screen**

- sale form
- submit button

**4\. Battle result modal/screen**

- damage dealt
- rewards gained
- enemy HP result

**5\. Shop**

- buy items

**6\. Inventory**

- equip weapon/armor/cosmetic
- use potion

**7\. Map / progression**

- world path
- current stage
- locked/unlocked stages

**8\. Leaderboard**

- ranked by level

**9\. Manager panel**

- recent sales
- delete sale
- add gold

**15\. Firestore collections, V1**

**players**

One document per employee number.

Fields:

- employeeNumber
- displayName
- level
- xp
- gold
- equippedWeapon
- equippedArmor
- equippedCosmetic
- activePotion
- activePotionExpiresAt
- currentWorld
- currentEnemyIndex
- currentEnemyHp
- bossesCleared
- totalSales
- isManagerViewOnlyFlag optional if needed

**sales**

One document per sale.

Fields:

- playerId
- tvPrice
- basketAmount
- audio
- services
- protection
- membership
- card
- xpEarned
- goldEarned
- damageDealt
- createdAt

**inventory**

Can either be a subcollection under player or stored on player doc.  
For simplicity:

- use subcollection under player

Examples:  
players/{playerId}/inventory/{itemId}

**quests**

Definitions for daily/weekly quests

**playerQuestProgress**

Tracks each player's quest progress

**worlds**

Stores worlds, enemies, bosses, HP, traits

**managerConfig**

Stores approved manager employee numbers