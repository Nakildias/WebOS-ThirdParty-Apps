// Volume settings
let volume;
if (JSON.parse(localStorage.getItem("volumeData")) == undefined) {
    volume = {
        master: 100 / 100,
        bgm: (80 / 100) / 2,
        sfx: 100 / 100
    }
} else {
    volume = JSON.parse(localStorage.getItem("volumeData"));
}


// BGM
let bgmDungeon;
let bgmBattleMain;
let bgmBattleBoss;
let bgmBattleGuardian;

// SFX
let sfxEncounter;
let sfxEnemyDeath;
let sfxAttack;
let sfxLvlUp;
let sfxConfirm;
let sfxDecline;
let sfxDeny;
let sfxEquip;
let sfxUnequip;
let sfxOpen;
let sfxPause;
let sfxUnpause;
let sfxSell;
let sfxItem;
let sfxBuff;

const setVolume = () => {
    // ===== BGM =====
    bgmDungeon = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/dungeon.webm', '/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/dungeon.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleMain = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_main.webm', '/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_main.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleBoss = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_boss.webm', '/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_boss.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleGuardian = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_guardian.webm', '/static/third-party/apps/dungeon-crawler-rg-od.app/assets/bgm/battle_guardian.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    // ===== SFX =====
    sfxEncounter = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/encounter.wav'],
        volume: volume.sfx * volume.master
    });

    sfxCombatEnd = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/combat_end.wav'],
        volume: volume.sfx * volume.master
    });

    sfxAttack = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/attack.wav'],
        volume: volume.sfx * volume.master
    });

    sfxLvlUp = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/level_up.wav'],
        volume: volume.sfx * volume.master
    });

    sfxConfirm = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/confirm.wav'],
        volume: volume.sfx * volume.master
    });

    sfxDecline = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/decline.wav'],
        volume: volume.sfx * volume.master
    });

    sfxDeny = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/denied.wav'],
        volume: volume.sfx * volume.master
    });

    sfxEquip = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/equip.wav'],
        volume: volume.sfx * volume.master
    });

    sfxUnequip = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/unequip.wav'],
        volume: volume.sfx * volume.master
    });

    sfxOpen = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/hover.wav'],
        volume: volume.sfx * volume.master
    });

    sfxPause = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/pause.wav'],
        volume: volume.sfx * volume.master
    });

    sfxUnpause = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/unpause.wav'],
        volume: volume.sfx * volume.master
    });

    sfxSell = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/sell.wav'],
        volume: volume.sfx * volume.master
    });

    sfxItem = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/item_use.wav'],
        volume: volume.sfx * volume.master
    });

    sfxBuff = new Howl({
        src: ['/static/third-party/apps/dungeon-crawler-rg-od.app/assets/sfx/buff.wav'],
        volume: volume.sfx * volume.master
    });
}

document.querySelector("#title-screen").addEventListener("click", function () {
    setVolume();
    sfxOpen.play();
});
