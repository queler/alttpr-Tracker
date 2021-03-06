"use strict";
function swordless() {
    return false;
    //todo: replace sword with net
    // change toggle logic for it.

}
function keysanity() {
	return (settings.keyMode ==1);
}
function retro() {
	return (settings.keyMode == 2);
}
function inverted() {
    return settings.openMode==2;
}
function std() {
    return settings.openMode==0;
}
function objToArray( obj,preId ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    preId=preId||"";
    while (i--)
      resArray[i] = {id:preId+ownProps[i], obj:obj[ownProps[i]]};

    return resArray;
  };
function goModeTest(){
    if(window.testing==true){
        return false;
    }
    var goalTest=(items.crystal1.val===9)?logic.chests[6]
                   :logic.chests[65];
    window.testing=true;
    var s=trackables.createSaveObj();
    var go=undefined;
    var i=0;
    var d;
    var id;

    try{
        while(go===undefined && ++i<=65){
            if (goalTest()==STATE.avail){
                go=true;

            }else{
                d=objToArray(dungeons,"dungeon");
                d.forEach(function(o){
                    id=idParser.exec(o.id)[2];
                    o.completed=items['boss'+id].val;
                    o.state=logic.dungeons[id]().boss
                });
                d=d.filter(function(o){
                    return !o.completed && o.state==STATE.avail;
                });
                if(d<=0){
                    go=false
                }else{
                    d.forEach(function(o){
                        id='boss'+idParser.exec(o.id)[2];
                        items[id].val=!items[id].val+0;
                    });
                    logic.setPrizes();
                }

            }

        }
    }
    catch(e){
        debugger;
    }
    finally{
        if (s){trackables.loadFromObj(s)};
        window.testing=false;
        return go;
    }
}
var STATE={
      unavail:0,
      avail:1,
      dark:2,
      maybe:3,
      visible:4,
      darkmaybe:6
};
//0 = unknown, 1 = bombos, 2 = ether, 3 = quake
var MEDAL={
    unknown:0,
    bombos:1,
    ether:2,
    quake:3
};
var logic = {
  fromEl: function (id){ //only for trackables
      var parsed=idParser.exec(id);
      return logic[parsed[1]+'s'][+parsed[2]]();
   },
    //these functions return true or false
    canActivatabteTablets: function(){
        if( swordless()){
            return items.hammer.val;
        }else{
            return items.sword.val>=2;
        }
    },
    canShoot: function canShoot(){
        return items.bow.val >= 1 && (!retro() || items.keyShopFound.val);
    },
    canShootSilvers: function canShootSilvers(){
        return items.bow.val >= 2 && (!retro() || items.keyShopFound.val);
    },
    canUseMedallions: function(){
        if( swordless()){
            return 1
        }else{
            return items.sword.val>0;
        }
    },

    canRemoveCurtains: function(){
        if( swordless()){
            return 1
        }else{
            return items.sword.val>0;
        }
    },
    darkWorldNWReg: function (){
        return items.pearl.val && //need this of course
            (items.glove.val >= 2 || //kakariko portal
                (items.glove.val >= 1 && items.hammer.val) || //kakariko portal
                (items.boss11.val && items.hookshot.val && (items.hammer.val || items.glove.val || items.flippers.val)) //agahnim then river crossing
            );
    },
    darkWorldNW: function () { //check for access to this whole region
        return inverted()?true: this.darkWorldNWReg();
    },

    darkWorldEastInv: function(){
    //emu: [ "hammer", "flippers", "lift2,pearl,mirror", "aga1,mirror" ], => pyr, catfish, pod
    //hyph: DW*N*E flippers || hammer || (canEnterLightWorld && trackerData.items.mirror) => [yr catfish pod,
            //LW=aga1(boss11) || ((canLiftDarkRocks() || (trackerData.items.hammer && canLiftRocks())) && trackerData.items.moonpearl)
        return items.hammer.val || items.flippers.val ||
            (items.mirror.val &&
                (items.boss11.val || (items.glove.val>=2 && items.pearl.val)) );
    },

    darkWorldEastReg: function () {
        return items.pearl.val && //need this of course
            (items.boss11.val || //agahnim gives direct access
                items.hammer.val && items.glove.val>=1 || //portal at flute 5
                items.glove.val >= 2 && items.flippers.val //kakariko portal then river crossing
            ); //
    },
    darkWorldEast: function () { //check for access to this whole region
            return inverted() ? this.darkWorldEastInv() : this.darkWorldEastReg();
        },
        darkWorldSouth: function () {
            return inverted() ? true : logic.darkWorldSouthReg();
        },
        darkWorldSouthReg: function () { //check for access to this whole region
            return logic.darkWorldNW() || //can drop down from village -- includes hammer + glove option
                (items.boss11.val && items.pearl.val && items.hammer.val); //agahnim + hammer also works
        },
        lightWorldBunny: function () {
            return !inverted() || (
                items.boss11.val || //aga1
                (
                    (
                        items.glove.val >= 2 ||
                        (items.hammer.val && items.glove.val)
                    ) && items.pearl.val
                )
            );
        },
        lightWorldLink: function () {
            return !inverted() || (logic.lightWorldBunny() && items.pearl.val);
        },
        canFly: function () {
            return items.flute.val &&
                (
                    !inverted() ||
                    (this.lightWorldLink())
                );
        },
    DMlight: function () { return (items.lamp.val || logic.canFly() || chests[39].opened); }, //used to determine if DM chests require dark
    DMlightAorD: function () { return logic.DMlight() ? 1 : 2; }, //used to determine val if DM chests require dark
    climbDM: function () { return (items.glove.val || logic.canFly()); }, //can get up Death Mountain, all below spec rock
    eastDMReg: function () { return logic.climbDM() && (items.hookshot.val || items.mirror.val && items.hammer.val); }, //can get to EDM
	eastDMInv: function () {return logic.climbDM() && ((items.hookshot.val && items.pearl.val) || (items.glove.val>=2));},
	eastDM: function () {return !inverted() ? logic.eastDMReg() : logic.eastDMInv();},
    darkEastDM: function () { return inverted()
      ? logic.climbDM()
      :logic.eastDM() && items.pearl.val && items.glove.val >= 2; },  //can get to dark EDM
    heraArea: function () {
        if (inverted()) {
            return logic.eastDM() && items.pearl.val && items.hammer.val;
        }
        else {
            return logic.climbDM() && (items.mirror.val || items.hookshot.val && items.hammer.val);
        }
    },
    cane: function () { return items.somaria.val || items.byrna.val; }, //the canes work against certain bosses
    rod: function () { return items.firerod.val || items.icerod.val; }, //the rods work against certain bosses
    fire: function () { return items.lamp.val || items.firerod.val; }, //can light torches
    bunnyMaybe: function() {
      return logic.lightWorldLink()
         ? STATE.avail
         : logic.lightWorldBunny()
            ? STATE.maybe
            : STATE.unavail;
    },
    mireArea: function() {
       return inverted()
               ? logic.canFly() ||
               (logic.lightWorldBunny() && items.mirror.val)
               :items.pearl.val && items.flute.val && items.glove.val >= 2;
    },
    //Dungeon entry
    entry0: function () {return !inverted() || (logic.lightWorldLink()); },
    entry1: function () {
       return inverted()
       ? logic.lightWorldLink() && items.book.val
       : items.book.val || items.glove.val >= 2 && items.flute.val && items.mirror.val; },
    entry2: function () { return logic.heraArea(); },
    //POD
    entry3: function () { return logic.darkWorldEast(); },
    //SP
    entry4: function () {
        if (inverted()) {
            return this.lightWorldLink() && items.mirror.val && items.flippers.val;
        } else {
            return this.darkWorldSouth() && items.mirror.val && items.flippers.val;
        }
    },
    //sw
    entry5: function () { return logic.darkWorldNW(); },
    //tt
    entry6: function () { return logic.darkWorldNW(); },
    //IP
    entry7: function () {
            return  (
               (items.pearl.val && items.glove.val >= 2)
                  || inverted()
               )  &&
               (items.firerod.val || (items.bombos.val && logic.canUseMedallions()))
                  ? items.flippers.val
                     ? STATE.avail
                     : STATE.dark
                  :STATE.unavail;
     },
        entry8: function () {//mm access no medal
            return logic.mireArea() && (items.boots.val || items.hookshot.val);
        },
        entry9: function () {//tr no medal light only
            return logic.darkEastDM() && items.hammer.val && items.somaria.val;
        },
        entry10: function () {
            return (inverted()
                  ? logic.lightWorldLink()
                  : logic.darkEastDM()
                     ? logic.DMlightAorD()
                     : STATE.unavail)

               * logic.crystal(0);
        },
    entry11: function () { if(inverted()){
          return logic.climbDM();
       }else{
          return (swordless()?items.hammer.val:(items.sword.val >= 2)) || items.cape.val;
       }
    },
    crystal: function(id) {
       var have=items.crystal.val;
       var needed=items['crystal'+id].val;
       return needed==8
          ? have==7
             ? STATE.avail
             : have>=0
                ? STATE.maybe
                : STATE.unavail
          : have>=needed;

    },
    //this function returns 0, 1, or 3
    // 0 = unavailable
    // 1 = available
    // 3 = possibly available
    medallion: function (id) { //check for the correct MM/TR medallions; id is the dungeon id (8 = MM, 9 = TR)

        var medal = items["medal" + id].val; //identifies what medallion we want; 0 = unknown, 1 = bombos, 2 = ether, 3 = quake

        return logic.canUseMedallions() ? //need a sword
            medal == 0 ?
                items.bombos.val && items.ether.val && items.quake.val ?                 //medallion is unknown
                    STATE.avail :                                                                  //has all medallions so check is automatically passed
                    items.bombos.val || items.ether.val || items.quake.val ? STATE.maybe : STATE.unavail:     //if at least one medallion, maybe ok; otherwise nope
                medal == MEDAL.bombos && items.bombos.val || medal == MEDAL.ether &&
                            items.ether.val || medal == MEDAL.quake && items.quake.val ? //medallion is known and we need a specific one
                    STATE.avail : //has the specific matching medallion
                    STATE.unavail: //does not have the matching medallion
            STATE.unavail; //no sword, cannot use any medallions

    },
    //this sets the prizes in the item tracker based on completed dungeons
    setPrizes: function () {

        var counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, total: 0 }; //tally of each type of prize;
        // 0 = unknown, 1 = red/blue pend, 2 = green pend, 3 = blue crystal, 4 = red crystal

        for (var i = 0; i <= 9; i++) { //checks each dungeon to see if it's completed and if so what its prize is
            if (items["boss"+i].val) {
                counts[dungeons[i].prize]++;
                counts.total++;
            }
        }

        //updates the item object with the counts that were found
        items.pendant.val = Math.min(3, counts[1] + counts[2]); //total pendants of either colour
        items.greenPendant.val = Math.min(1, counts[2]);        //green pendant
        items.crystal.val = Math.min(7, counts[3] + counts[4]); //total crystals of either colour
        items.redCrystal.val = Math.min(2, counts[4]);          //just red crystal

        //a little extra logic that deduces pendants/crystals from the total count if not all prizes are known or marked correctly
        //example: if there's more than 4 dungeons beaten, 1 of them must be a crystal, etc etc
        if (counts.total >= 4) {
            items.pendant.val = Math.max(counts.total - 7, items.pendant.val);
            items.crystal.val = Math.max(counts.total - 3, items.crystal.val);
        }

        if (items.pendant.val >= 3) { //if you have three pendants, 1 must be green
            items.greenPendant.val = 1;
        }

        if (items.crystal.val >= 7) {       //if you have 7 crystals, 2 must be red
            items.redCrystal.val = Math.max(2, items.redCrystal.val);
        } else if (items.crystal.val >= 6) {    //if you have 6 crystals, at least 1 is red
            items.redCrystal.val = Math.max(1, items.redCrystal.val);
        }

    },
    // Values that can be returned for any given chest:
    // 0 = unavailable
    // 1 = available
    // 2 = available through dark room
    // 3 = possibly available
    // 4 = visible/checkable but unattainable
    chests: {
        0: function () { return  (logic.lightWorldLink()); },                        // Sahasrahla's Hut
        1: function () { return items.greenPendant.val; }, // Sahasrahla
        2: function () {                                     // King Zora
            if(logic.lightWorldLink() && (items.flippers.val || items.glove.val)) {
                return STATE.avail;
            }
            else if(logic.lightWorldLink()) {
               return STATE.dark;
            }else{
               return STATE.unavail;
            }
        },
        3: function () { return logic.lightWorldLink() && items.mushroom.val; }, // Potion Shop
        4: function () {                             // Zora's Ledge
            if (logic.lightWorldLink() && items.flippers.val) {
                return STATE.avail;
            }else if (logic.lightWorldLink()) {
                return STATE.visible;
            }else{
                return STATE.unavail;
            }
        },
        5: function () {                            // Waterfall Fairy
            if (logic.lightWorldLink() && items.flippers.val) {
                return STATE.avail;
            } else if (logic.lightWorldLink() && (items.boots.val || items.pearl.val)){
                return STATE.dark;
            }else{
                return STATE.unavail;
            }
         },
        6: function () {                            // Master Sword Pedestal
            return (items.pendant.val == 3) && logic.lightWorldBunny() ?
                1 :
                items.book.val && logic.lightWorldBunny() ? STATE.visible
                : STATE.unavail;
        },
        7: function () {                                                // King's Tomb
            return items.boots.val &&
                (items.glove.val >= 2 && logic.lightWorldLink() ||
                    (logic.darkWorldNW() && items.mirror.val && !inverted()))?
						1 : 0;
        },
        8: function () { return logic.lightWorldLink(); }, // Kakariko Tavern
        9: function () { return logic.lightWorldLink(); }, // Chicken House
        10: function () { return logic.bunnyMaybe(); }, // Kakariko Well
        11: function () { return logic.lightWorldLink(); }, // Blind's Hideout
        12: function () { return items.boots.val && logic.lightWorldLink(); }, // Pegasus Rocks
        13: function () { return logic.lightWorldBunny(); }, // Bottle Merchant
        14: function () {           // Magic Bat
            var batCave=inverted()
              ?logic.lightWorldLink() && items.hammer.val
              : items.hammer.val  ||
                 (items.glove.val>=2 && items.pearl.val && items.mirror.val) ;
            if(items.powder.val && batCave){
               return STATE.avail;
            }else if(batCave && items.somaria.val && items.mushroom.val && !chests[3].opened){
               return STATE.dark;
            }else{
               return STATE.unavail;
            }
        },
        15: function () { return items.bottle.val >= 1 && logic.lightWorldBunny() }, // Sick Kid
        16: function () { return logic.lightWorldLink(); }, // Lost Woods Hideout
        17: function () { return logic.lightWorldLink()
             ? items.boss11.val && items.boots.val
                ? STATE.avail
                : STATE.visible
             : STATE.unavail; }, // Lumberjack Tree
        18: function () { return !inverted()
              ? logic.darkWorldNW() && items.mirror.val
                 ? 1
                 : 0
              : logic.lightWorldLink(); }, // Graveyard Ledge
        19: function () { return logic.lightWorldLink(); }, // Mushroom
        20: function () { return logic.lightWorldLink(); }, // Dam
        21: function () { return STATE.avail; }, // Link's House
        22: function () { return logic.lightWorldLink();}, // Aginah's Cave
        23: function () { return logic.lightWorldLink(); }, // Mini Moldorm Cave
        24: function () { return logic.lightWorldLink(); }, // Ice Rod Cave
        25: function () {
           return logic.lightWorldLink()
              ? items.flippers.val
                 ? STATE.avail
                 : STATE.dark
              : STATE.unavail;
           }, // Hobo
        26: function () { // Bombos Tablet
            return items.book.val && (
                  inverted()
                     ? logic.lightWorldBunny()
                     : items.mirror.val && logic.darkWorldSouth()
                  )
               ? logic.canActivatabteTablets()
                  ? STATE.avail
                  : STATE.visible
               : STATE.unavail;
        },
        27: function () { // Cave 45
            return inverted()
               ? logic.lightWorldLink()==true
                  ? STATE.avail
                  : logic.lightWorldBunny()==true
                     ? STATE.visible
                     : STATE.unavail
               : items.mirror.val &&
                   (logic.darkWorldNW()
                      || items.boss11.val
                      && items.pearl.val
                      && items.hammer.val)
                      ;
        },
        28: function () { // Checkerboard Cave
            return inverted()
               ? logic.lightWorldLink() && items.glove.val>=1
               : items.flute.val && items.glove.val >= 2 && items.mirror.val;
        },
        29: function () {
               return inverted()
                  ? logic.lightWorldBunny()
                     ? items.boots.val && items.pearl.val
                        ? STATE.avail
                        : STATE.visible
                     : STATE.unavail
                  : items.boots.val
                     ? STATE.avail
                     : STATE.visible
             ;}, // Library
        30: function () {
   return logic.lightWorldLink()==true
     ? STATE.avail
     : logic.lightWorldBunny()==true
        ? STATE.visible
        : STATE.unavail ;
   }, // Maze Race
        31: function () { // Desert Ledge
            return logic.entry1()
               ? STATE.avail
               : logic.lightWorldBunny()
                  ? STATE.visible
                  : 0;
        },
        32: function () { // Lake Hylia Island
            return (
               inverted()
                  ? logic.lightWorldLink()
                  : items.pearl.val && items.mirror.val
                     && (items.boss11.val || items.glove.val >= 2
                        || items.glove.val && items.hammer.val)
                )
                   ? items.flippers.val
                      ? STATE.avail
                      : STATE.dark
                   : logic.lightWorldBunny()
                      ? STATE.visible
                      : STATE.unavail;
        },
        33: function () { return logic.lightWorldLink() && items.shovel.val; }, // Flute Spot
        34: function () { return logic.lightWorldLink(); }, // Sanctuary
        35: function () { // Sewers - Secret Room
			var maxKey;
			var minKey;
            if (retro()) {
                maxKey = items.keyAny.val;
                minKey = Math.max(0,
                    maxKey -
                    (logic.entry1() ? 1 : 0) -
                    (logic.entry2() ? 1 : 0) -
                    (logic.entry3() ? 6 : 0) -
                    (logic.entry4() ? 1 : 0) -
                    (logic.entry11() ? 2 : 0)
                );
            }

            var lampTest = logic.fire() ? 1 : 2;

            return ( std() || items.glove.val
               ? 1
               : keysanity()
                  ? items.key12.val
                     ? lampTest
                     : 0
                  : retro() && items.keyShopFound.val == 0
                     ? maxKey >= 1
                        ? minKey >= 1
                           ? lampTest
                           : STATE.maybe
                        : STATE.unavail //because no glove
                     : items.glove.val
                        ? lampTest
                        : STATE.maybe //retro with keyshop or reg open
             ) * logic.lightWorldLink();


        },
        36: function () { // Sewers - Dark Cross
            return (std() || logic.fire() ? STATE.avail : STATE.dark)
               * logic.lightWorldLink();
        },
        37: function () { return logic.lightWorldLink(); }, // Hyrule Castle
        38: function () { return logic.lightWorldLink(); }, // Link's Uncle
        39: function () { // Old Man
            return logic.climbDM() ?
                items.lamp.val ? 1 : STATE.dark:
                0;
        },
        40: function () { // Spectacle Rock Cave
            return logic.climbDM() ?
                logic.DMlightAorD() :
                0;
        },
        41: function () { // Ether Tablet
            return items.book.val && logic.heraArea()
               ? logic.canActivatabteTablets()
                  ? logic.DMlightAorD()
                  : STATE.visible
               : 0;
        },
        42: function () { // Spectacle Rock
            var av=null;
            if (inverted()){
               av=logic.heraArea();
            } else{
               av=logic.climbDM() && items.mirror.val;
            }
            return av
               ? logic.DMlightAorD()
               : logic.climbDM()
                 ? STATE.visible
                 : STATE.unavail;
        },
        43: function () { // Spiral Cave
            return logic.eastDM() ?
                logic.DMlightAorD() :
                0;
        },
        44: function () { // Mimic Cave
           if(inverted()){
              return (logic.eastDM()
                 && items.hammer.val
                 && items.pearl.val) * logic.DMlightAorD();
           }else{
              return !(keysanity() && items.key9.val < 2) &&
                  items.pearl.val &&
                  items.hammer.val &&
                  items.glove.val >= 2 &&
                  items.somaria.val &&
                  items.mirror.val ?
                  logic.medallion(9) !== 1 ?
                      logic.medallion(9) :
                      items.firerod.val ?
                          logic.DMlightAorD() :
                          STATE.maybe :
                  0;
            }
        },
        45: function () { // Paradox Cave
            return logic.eastDM()
              ? (!inverted() || items.pearl.val)
                  ? logic.DMlightAorD()
                  : items.sword.val>=2
                     ? STATE.maybe
                     : STATE.unavail
               : STATE.unavail;
        },
        46: function () { // Floating Island
            return logic.eastDM()
               ? (!inverted() && items.mirror.val && items.pearl.val && items.glove.val >= 2)
                  || (inverted())
                  ?  logic.DMlightAorD()
                  :  STATE.visible
               : 0;
        },
        47: function () { // Superbunny Cave
//update for tr portal w/o pearl
           if(inverted()){
              return logic.climbDM()
                 ? logic.DMlightAorD()
                 : STATE.unavail;
           } else{
              return  items.glove.val >= 2 && logic.eastDM()
              ? items.pearl.val
                 ? logic.DMlightAorD()
                 : STATE.dark
              : 0;
           }
        },
        48: function () { // Hookshot Cave
            return (inverted()
               ? logic.climbDM() && items.hookshot.val
               : items.pearl.val && items.glove.val >= 2 && items.hookshot.val
            )
            ? logic.DMlightAorD()
            : 0;
        },
        49: function () { // Hookshot Cave - Bottom Chest
            return (inverted()
               ? logic.climbDM() && (items.hookshot.val || items.boots.val)
               : items.pearl.val && items.glove.val >= 2 && (items.hookshot.val || (items.mirror.val && items.hammer.val && items.boots.val))
              )
            ? logic.DMlightAorD()
            : 0;
        },
        50: function () { // Spike Cave
            return (items.pearl.val || inverted()) && items.glove.val && items.hammer.val && (items.byrna.val || items.cape.val || items.bottle.val>0)
              ? logic.DMlightAorD()
              : 0;
        },
        51: function () { // Catfish"
            return logic.darkWorldEast() && items.glove.val ? 1 : 0;
        },
        52: function () { // Pyramid

            return (!inverted() && items.boss11.val) || logic.darkWorldEast() ? 1 : 0;

        },
        53: function () { // Pyramid Fairy

            return inverted()
               ? ((items.redCrystal.val >= 2) && logic.lightWorldBunny()) && items.mirror.val
               : ((items.redCrystal.val >= 2) && (items.boss11.val || logic.darkWorldEast()));

        },
        54: function () { // Brewery
            return logic.darkWorldNW() ? 1 : 0;
        },
        55: function () { // C-Shaped House
            return logic.darkWorldNW() ? 1 : 0;
        },
        56: function () { // Chest Game
            return logic.darkWorldNW() ? 1 : 0;
        },
        57: function () { // Hammer Pegs
            return inverted()
               ? items.hammer.val &&
                  ( items.glove.val>=2
                     || (logic.lightWorldBunny()
                        && items.mirror.val)
                  )
               : items.pearl.val && items.glove.val >= 2 && items.hammer.val;
        },
        58: function () { // Bumper Cave
              return logic.darkWorldNW() ?
                  items.glove.val && items.cape.val &&
                  (!inverted()|| (logic.lightWorldLink()
                        && items.mirror.val)
                  )
                     ? STATE.avail
                     : STATE.visible
                  :0;
        },
        59: function () { // BlackSmith
            return inverted()
               ? logic.lightWorldBunny() &&
                  (items.glove.val>=2 || items.mirror.val)
               :items.pearl.val && items.glove.val >= 2;
        },
        60: function () { // Purple Chest
            return logic.chests[59]();
        },
        61: function () { // Hype Cave
            return logic.darkWorldSouth();
        },
        62: function () { // Stumpy
            return logic.darkWorldSouth() ? 1 : 0;
        },
        63: function () { // Digging Game
            return logic.darkWorldSouth() ? 1 : 0;
        },
        64: function () { // Mire Shed
            return logic.mireArea();
        },
        65: function() {//GANON
           var x=STATE.unavail;
           if(logic.darkWorldEast() && logic.fire()
              && items.boss10.val) {
              if(swordless()){
                 x= items.hammer.val==1
                 && logic.canShootSilvers();
              }else{//normal
                 x= items.sword.val>=2;
              }
           }else{
              x= STATE.unavail;
           }
           return x*logic.crystal(1);
        }
    },

    //dungeon logic functions return an object containing the following
    //boss =
    // 0 = unavailable
    // 1 = available
    // 2 = available through dark room
    // 3 = visible but not attainable
    //max = the maximum items possibly available (including by certain sequence breaks)
    //min = the minimum items possibly available (accounting for worst luck, bad key use if key-sanity, no dark rooms or sequence breaks)
    dungeons: {


        0: function () { // Eastern Palace
            var boss;
			var min;
			var max;
			var bow = logic.canShoot(),
                lamp = items.lamp.val || items.firerod.val,
                bigKey = items.bigKey0.val;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = bow && bigKey     // need these to reach
                   ? logic.fire()
                      ? STATE.avail
                      : STATE.dark  // boss accessible; light determines status
                   : STATE.unavail;

                min = 3 +                             // base access
                    (lamp ? 1 : 0) +                  // BK chest
                    (bigKey ? 1 : 0) +                // big chest
                    (logic.fire() && bigKey && bow ? 1 : 0)   // boss
                    ;

                max = 4 +                             // base access (includes BK chest regardless of lamp)
                    (bigKey ? 1 : 0) +                // big chest
                    (bigKey && bow ? 1 : 0)           // boss
                    ;

            } else {             // REGULAR AND RETRO LOGIC

                boss = bow ?             // need this to reach
                    lamp ? STATE.avail : STATE.dark :       // boss accessible; light determines status
                    0;

                min = lamp ?
                    2 +                // lamp guarantees two items
                    (bow ? 1 : 0) :    // bow & lamp guarantees third item too
                    1;              // if no lamp, it's possible only 1 chest before dark rooms has something

                max = 3;      // always possible for the first three chests to have items
            }

            return { boss: boss*logic.entry0(), max: max*logic.entry0(), min: min*logic.entry0() };
        },
        1: function () { //Desert Palace
            var boss;
			var min;
			var max;
            var entry = logic.entry1(),
                glove = items.glove.val,
                reachLanmo = entry && logic.fire() && glove,
                bow = logic.canShoot(),
                fightLanmo = reachLanmo && (items.hammer.val || items.sword.val >= 1 || bow || logic.cane() || logic.rod()),
                boots = items.boots.val,
                key = items.key1.val,
                bigKey = items.bigKey1.val;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightLanmo && bigKey ?
                    key ? STATE.avail : STATE.maybe :   // if no key, player might steal pot key for chests and lock themselves out of boss
                    0;

                min = entry ?
                    1 +                                     // base access
                    (boots ? 1 : 0) +                       // torch
                    (key ? 2 : 0) +                        // compass/BK chests
                    (bigKey ? 1 : 0) +                    // big chest
                    (fightLanmo && bigKey ? 1 : 0) :      // boss
                    0;

                max = entry ?
                    1 +                                   // base access
                    (boots ? 1 : 0) +                    // torch
                    (bigKey ? 1 : 0) +                   // big chest
                    (glove ?
                        key && fightLanmo && bigKey ? 3 : 2 :   // if fully equipped, can get 3; otherwise, stealing key gives 2
                        key ? 2 : 0) :              // if no glove, need key to get 2 chests (no boss)
                    0;

            } else if (retro()) {
                if (items.keyShopFound.val) {     // RETRO LOGIC - INFINITE KEYS

                    boss = fightLanmo ?     // have inventory to fight the boss
                        boots ? STATE.avail : STATE.maybe :     // big key might be on torch, so if missing boots, boss access unknown
                        STATE.unavail;

                    min = entry ?
                        boots ?
                            2 +                    // boots guarantee accessing everything but boss
                            (fightLanmo ? 1 : 0) :  // if boss beatable too, can definitely get all
                            1 : // if BK on torch and map/compass in small chests, can only get 1 item
                        0;

                    max = entry ? 3 : 0;    // map chest, compass chest, and BK chest might have items

                } else {     // RETRO LOGIC - LIMITED KEYS

                    var maxKey = items.keyAny.val - (std() ? 1 : 0); // if standard, you must have used a key at Hyrule Castle
                    var minKey = Math.max(0,    // subtracts the other places you might have spent your keys, if they are accessible
                        items.keyAny.val -
                        1 -                        //Hyrule Castle
                        (logic.entry2() ? 1 : 0) - //Tower of Hera
                        (logic.entry3() ? 6 : 0) - //Palace of Darkness
                        (logic.entry4() ? 1 : 0) - //Swamp Palace
                        (logic.entry11() ? 2 : 0)  //Agahnim
                    );

                    boss = fightLanmo ?
                        minKey >= 1 && boots ? STATE.avail : STATE.maybe : // if missing boots or if key uncertain, boss state unknown
                        STATE.unavail;

                    min = entry && minKey >= 1 ?
                        boots ?
                            2 +                    // boots guarantee accessing everything but boss
                            (fightLanmo ? 1 : 0) :  // if boss beatable too, can definitely get all
                            1 : // if BK on torch and map/compass in small chests, can only get 1 item
                        0;

                    max = entry ?
                        1 + //map chest
                        (maxKey >= 1 || glove ?
                            2 :       // compass chest and BK chest accessible
                            boots ? 1 : 0) :  // with no glove, best case is that torch has item
                        0;

                }
            } else {     // REGULAR LOGIC

                boss = fightLanmo ?
                    boots ? STATE.avail : STATE.maybe : // if no boots, boss state unknown
                    0;

                min = entry ?
                    fightLanmo && boots ?
                        2 :              // can get everything
                        boots ? 1 : 0 :  // if key or big key on torch, might not get any items
                    0;

                max = entry ? 2 : 0;  //2 of first three chests might have items
            }

            return { boss: boss, max: max, min: min };
        },
        2: function () { //Tower of Hera
            var boss;
			var min;
			var max;
            var entry = logic.entry2(),
                fightMold = entry && (items.sword.val >= 1 || items.hammer.val),
                fire = logic.fire(),
                light = logic.DMlight(),
                key = items.key2.val,
                bigKey = items.bigKey2.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC
                boss = fightMold && bigKey ?    // requirements for boss
                    light ? STATE.avail: STATE.dark:             // checks if player had to use dark room to climb Death Mountain
                    STATE.unavail;

                max = entry ?
                    2 +                                    //base access
                    (key && fire ? 1 : 0) +                //basement
                    (bigKey ? 2 : 0) +                     //upstairs
                    (bigKey && fightMold ? 1 : 0) :        //Boss
                    0;

                min = light ? max : 0;      //sets min to 0 if had to go through dark

            } else if (retro()) {
                if (items.keyShopFound.val) {    // RETRO LOGIC - INFINITE KEYS

                    boss = fightMold ?
                        fire ?
                            light ? STATE.avail: STATE.dark:     // checks if player had to use dark room to climb Death Mountain
                            STATE.maybe :                 // big key might be in basement, locking out boss
                        STATE.unavail;

                    min = entry && light && fire ?
                        2 +                     // can open every chest and get at least 2 items
                        (fightMold ? 1 : 0) :   // can also get 3rd item, if boss has it
                        0;                      // if basement required, might get no items

                    max = entry ? 3 : 0;        // 3 items and big key could be in first 4 chests opened

                } else {    // RETRO LOGIC - LIMITED KEYS

                    var maxKey = items.keyAny.val - (std() ? 1 : 0); // if standard, you must have used a key at Hyrule Castle
                    var minKey = Math.max(0,    // subtracts the other places you might have spent your keys, if they are accessible
                        items.keyAny.val -
                        1 -                        // Hyrule Castle
                        (logic.entry1() ? 1 : 0) - // Desert Palace
                        (logic.entry3() ? 6 : 0) - // Palace of Darkness
                        (logic.entry4() ? 1 : 0) - // Swamp Palace
                        (logic.entry11() ? 2 : 0)  // Agahnim
                    );

                    boss = fightMold && maxKey >= 1 ?
                        fire && minKey >= 1 ?
                            light ? STATE.avail: STATE.dark:     // checks if player had to use dark room to climb Death Mountain
                            STATE.maybe :                 // big key might be in basement, locking out boss
                        STATE.unavail;

                    min = entry && light && fire && minKey >= 1 ?
                        2 +                    // can open every chest and get at least 2 items
                        (fightMold ? 1 : 0) :  // can also get 3rd item, if boss has it
                        0;                     // if basement required, might get no items

                    max = entry ? 3 : 0;        // 3 items and big key could be in first 4 chests opened

                }
            } else {    // REGULAR LOGIC

                boss = fightMold ?
                    fire ?
                        light ? STATE.avail: STATE.dark:     // checks if player had to use dark room to climb Death Mountain
                        STATE.maybe :                 // big key might be in basement, locking out boss
                    STATE.unavail;

                min = entry && light && fire ?
                    1 +                    // can open every chest and get at least 1 item
                    (fightMold ? 1 : 0) :  // can also get 2nd item, if boss has it
                    0;                     // if basement required, might get no items

                max = entry ? 2 : 0;       // 2 items and big key could be in first 3 chests opened

            }

            return { boss: boss, max: max, min: min };
        },
        3: function () { //Palace of Darkness
            var boss;
			var min;
			var max;
            var entry = logic.entry3(),
                lamp = items.lamp.val,
                hammer = items.hammer.val,
                bow = logic.canShoot(),
                hamBow = hammer && bow,
                key = items.key3.val,
                bigKey = items.bigKey3.val,
                fightHelm = entry && hamBow
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = entry && hamBow && bigKey && key >= 1 ? // need all this for boss
                    key == 6 ?
                        lamp ? STATE.avail : STATE.dark :   // checks if player has to go through dark
                        STATE.maybe :              // if less than 6 keys, might spend them all elsewhere
                    STATE.unavail;

                min = entry ?
                    1 +                                                                       // first chest
                    (key >= 1 || key == 0 && hamBow ? 2 : 0) +                                // next 2 chests (bridge and stalfos head room) -- can't waste a key on the front door if you don't have one ;)
                    (key >= 2 ? 1 : 0) +                                                      // next chest (BK chest)
                    (key >= 4 ? 1 : 0) +                                                      // next chest (turtle room -- dark basement not guaranteed)
                    (key >= 5 ? 1 : 0) +                                                      // next chest (harmless hellway)
                    (bow ? 2 : 0) +                                                           // mimic chests
                    ((key == 2 || key == 4 || key == 5) && bow && hammer ? -1 : 0) +          // if have hammer, might waste key going toward boss at these key counts. don't ask why 3 is left out, it just is
                    (key >= 3 && lamp && !hamBow ? 3 : 0) +                 // if you have light and no hammer+bow, you're forced to go toward the dark rooms, which have the most chests
                    (key >= 4 && hamBow && lamp ? 2 : 0) +              // I dont know what these two mean
                    (key == 4 || key == 6 && hamBow && lamp ? 1 : 0) +  // but they make the numbers right
                    (key >= 5 && lamp ? 1 : 0) +                                              // now you can get 2 from the dark maze instead of 1 from somewhere else, I think is what this means
                    (key >= 5 && lamp && bigKey ? 1 : 0) +                                    // big chest
                    (key >= 2 && hamBow && lamp && bigKey ? 1 : 0) :       // now any door you open will get you at least one item
                    0;

                max = entry ?
                    1 +                                                 // first chest
                    (bow ? 2 : 0) +                                      // mimic chests
                    (key >= 1 || key == 0 && hamBow ? 2 : 0) +   // next 2 chests (bridge and stalfos head room)
                    (key >= 2 || key == 1 && hamBow ? 3 : 0) +   // next 3 chests (turtle room and dark room)
                    (key >= 3 || key == 2 && hamBow ? 2 : 0) +   // next 2 chests (dark maze)
                    (bigKey && (key >= 3 || key == 2 && hamBow) ? 1 : 0) +  // big chest
                    (key >= 4 || key == 3 && hamBow ? 1 : 0) +   // additional chest (harmless h or BK chest)
                    (key >= 5 || key == 4 && hamBow ? 1 : 0) +   // additional chest (harmless h or BK chest)
                    (key >= 5 && bigKey && hamBow ? 1 : 0) :    // boss
                    0;

            } else if (retro()) {
                if (items.keyShopFound.val) {    // RETRO LOGIC - INFINITE KEYS

                    boss = fightHelm ?  // need for boss
                        lamp ? STATE.avail : STATE.dark : // checks if player has to go through dark
                        STATE.unavail;

                    min = entry ?
                        3 +                         // first 3 chests
                        (bow ? 2 : 0) +             // mimic chests
                        (bow && lamp ? 6 : 0) +     // dark rooms
                        (bow && lamp && hammer ? 1 : 0) :  // boss
                        0;

                    max = entry ?
                        10 +            // can just about clean the place out just by getting inside
                        (bow ? 1 : 0) : // but you'll need the bow for at least one thing
                        0;

                } else {    // RETRO LOGIC - LIMITED KEYS

                    var maxKey = items.keyAny.val
                        - (std() ? 1 : 0) // if standard, you must have used a key at Hyrule Castle
                        - 2; // if less than 5 shops accessible, must have come via Agahnim

                    var minKey = Math.max(0,    // subtracts the other places you might have spent your keys, if they are accessible
                        items.keyAny.val
                        - 1                         // Hyrule Castle
                        - (logic.entry1() ? 1 : 0)  // Desert Palace
                        - (logic.entry2() ? 1 : 0)  // Tower of Hera
                        - (logic.entry4() ? 1 : 0)  // Swamp Palace
                        - 2                          // Agahnim
                    );

                    boss = entry && hamBow && maxKey >= 1 ? // need to have at least 1 key
                        minKey >= 6 ?
                            lamp ? STATE.avail : STATE.dark : // checks if player has to go through dark
                            STATE.maybe :            // if less than 6 guaranteed keys, boss status unknown
                        STATE.unavail;

                    min = entry ?
                        (minKey >= 2 ? 1 : 0) +
                        (minKey >= 4 ? 1 : 0) +
                        (minKey >= 5 ? 1 : 0) +
                        (minKey == 0 && hamBow ? 2 : 0) +
                        (bow ? 1 : 0) +
                        ((minKey == 1 || minKey == 3 || minKey == 4 || minKey == 6) && bow ? 1 : 0) +
                        (minKey >= 3 && lamp ? 1 : 0) +
                        (minKey >= 4 && lamp ? 2 : 0) +
                        (minKey >= 5 && lamp ? 1 : 0) +
                        (minKey >= 6 && lamp ? 1 : 0) +
                        ((minKey == 2 || minKey == 5) && bow && !hammer ? 1 : 0) +
                        (minKey == 2 && hamBow && lamp ? 1 : 0) +
                        (minKey == 3 && lamp && !hamBow ? 2 : 0) +
                        (minKey == 3 && lamp && !hammer && !bow ? 1 : 0) +
                        (minKey == 5 && lamp && !hamBow ? 1 : 0) +
                        (minKey == 6 && hamBow && lamp ? 1 : 0) :
                        0;

                    max = entry ?
                        1 +
                        (maxKey >= 1 || maxKey == 0 && hamBow ? 2 : 0) +
                        (maxKey >= 2 || maxKey == 1 && hamBow ? 3 : 0) +
                        (maxKey >= 3 || maxKey == 2 && hamBow ? 2 : 0) +
                        (maxKey >= 4 || maxKey == 3 && hamBow ? 1 : 0) +
                        (maxKey >= 5 ? 1 : 0) +
                        (bow ? 1 : 0) +
                        (maxKey <= 4 && bow ? 1 : 0) :
                        0;

                }

            } else {    // REGULAR LOGIC

                boss = fightHelm ?  // need for boss
                    lamp ? STATE.avail : STATE.dark : // checks if player has to go through dark
                    STATE.unavail;

                min = entry && bow && lamp ?   // if fully equipped, can do whole dungeon except boss
                    hammer ? 5 : 4 :           // if hammer, can do boss too
                    0;

                max = entry ? 5 : 0;        // can possibly get this many just by entering

            }

            return { boss: boss, max: max, min: min }
        },
        4: function () { //Swamp Palace
           var boss;
		         	var min;
         			var max;
            var entry = logic.entry4(),
                hammer = items.hammer.val,
                hookshot = items.hookshot.val,
                fightArrg = entry && hookshot && hammer,
                key = items.key4.val,
                bigKey = items.bigKey4.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightArrg && key ? STATE.avail: STATE.unavail;              // all you need

                min = entry ?
                    1 +                                       // entrance
                    (key ? 1 : 0) +                           // ledge Chest
                    (key && hammer ? 3 : 0) +                 // main Dungeon
                    (key && hammer && bigKey ? 1 : 0) +       // big Chest
                    (key && hammer && hookshot ? 4 : 0) :     // back of dungeon
                    0;

                max = min;                                    // accessible items are the same no matter what

            } else if (retro()) {
                if (items.keyShopFound.val) {    // RETRO LOGIC - INFINITE KEYS

                    boss = fightArrg ? STATE.avail: STATE.unavail;

                    min = entry && hammer ?
                        3 +                     // main dungeon access guarantees 3
                        (hookshot ? 4 : 0) :    // can clear full dungeon
                        0;

                    max = entry ?
                        2 +                                // first 2 chests
                        (hammer ? 3 : 0) +                 // main dungeon
                        (hammer && hookshot ? 2 : 0) :     // complete dungeon
                        0;

                } else {    // RETRO LOGIC - LIMITED KEYS

                    var maxKey = items.keyAny.val
                        - (std() ? 1 : 0) // if standard, you must have used a key at Hyrule Castle
                        - 2; // if less than 5 shops accessible, must have come via Agahnim

                    var minKey = Math.max(0,    // subtracts the other places you might have spent your keys, if they are accessible
                        items.keyAny.val
                        - 1                         // Hyrule Castle
                        - (logic.entry1() ? 1 : 0)  // Desert Palace
                        - (logic.entry2() ? 1 : 0)  // Tower of Hera
                        - (logic.entry3() ? 6 : 0)  // Palace of Darkness
                        - 2                         // Agahnim
                    );

                    boss = fightArrg && maxKey >= STATE.avail?
                        minKey >= 1 ? STATE.avail: STATE.maybe :     // if 1 key not guaranteed, boss state unknown
                        STATE.unavail;

                    min = entry && minKey >= 1 ?
                        (hammer ? 3 : 0) +               // main dungeon access guarantees 3
                        (hammer && hookshot ? 4 : 0) :   // can clear full dungeon
                        0;

                    max = entry ?
                        1 +                                             // first chest
                        (maxKey >= 1 ? 1 : 0) +                         // map chest
                        (maxKey >= 1 && hammer ? 3 : 0) +               // main dungeon
                        (maxKey >= 1 && hammer && hookshot ? 2 : 0) :   // can clear full dungeon
                        0;

                }
            } else {    // REGULAR LOGIC

                boss = fightArrg ? STATE.avail: STATE.unavail;

                min = entry ?
                    (hammer ? 2 : 0) +              // main dungeon access guarantees 2
                    (hammer && hookshot ? 4 : 0) :  // can clear full dungeon
                    0;

                max = entry ?
                    1 +                             // map chest
                    (hammer ? 3 : 0) +              // 3 more possible with main dungeon access
                    (hammer && hookshot ? 2 : 0) :  // can clear full dungeon
                    0;

            }

            return { boss: boss, max: max, min: min }
        },
        5: function () { // Skull Woods
            var boss;
			var min;
			var max;
            var entry = logic.entry5(),
                firerod = items.firerod.val,
                sword = logic.canRemoveCurtains(),
                fightMoth = entry && firerod && sword,
                key = items.key5.val,
                bigKey = items.bigKey5.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightMoth ? STATE.avail: STATE.unavail;      //boss reqs

                min = entry ?
                    5 +                         // base access
                    (bigKey ? 1 : 0) +          // big chest
                    (firerod ? 1 : 0) +           // phase 3 chest
                    (fightMoth ? 1 : 0) :            //Boss
                    0;

                max = min;                  //no variation in availability

            } else if (retro()) {    // RETRO LOGIC

                boss = fightMoth ? STATE.avail: STATE.unavail;      //boss reqs

                min = entry ?
                    3 +                             // guaranteed 3 in 1st/2nd phase
                    (firerod ? 1 : 0) +             // guaranteed a 4th
                    (firerod && sword ? 1 : 0) :    // can complete full dungeon
                    0;

                max = entry ?
                    4 +                             // max 4 in 1st/2nd phases
                    (firerod ? 1 : 0) :             // can get 5th in phase 3
                    0;

            } else {    // REGULAR LOGIC

                boss = fightMoth ? STATE.avail: STATE.unavail;       //boss reqs

                min = entry && firerod ?
                    1 +                         // both might be in phase 3
                    (sword ? 1 : 0) :           // last might be on boss
                    0;

                max = entry ? 2 : 0;            // chance of finding both in 1st/2nd phases

            }

            return { boss: boss, max: max, min: min }
        },
        6: function () { // Thieves Town
            var boss;
			var min;
			var max;
            var entry = logic.entry6(),
                hammer = items.hammer.val,
                fightBlind = entry && (items.sword.val >= 1 || hammer || logic.cane()),
                key = items.key6.val,
                bigKey = items.bigKey6.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightBlind && bigKey ? STATE.avail: STATE.unavail;

                min = entry ?
                    4 +                                     // base access
                    (bigKey ? 2 : 0) +                      // upstairs and jail chests
                    (fightBlind && bigKey ? 1 : 0) +        // boss
                    (hammer && key && bigKey ? 1 : 0) :     // big chest
                    0;

                max = min;

            } else if (retro()) {    // RETRO LOGIC

                boss = fightBlind ? 1 : 0;      //boss reqs

                min = entry ?
                    3 +                     // guaranteed 3 from access
                    (hammer ? 1 : 0) +      // big chest
                    (fightBlind ? 1 : 0) :  // boss
                    0;

                max = entry ? 5 : 0;        // possible to get 5 from first 6 chests

            } else {    // REGULAR LOGIC

                boss = fightBlind ? STATE.avail: STATE.unavail;      //boss reqs

                min = entry ?
                    2 +                         // guaranteed 2 from access
                    (hammer ? 1 : 0) +          // big chest
                    (fightBlind ? 1 : 0) :      // boss
                    0;

                max = entry ? 4 : 0;    // possible to get 4 from first 6 chests

            }

            return { boss: boss, max: max, min: min }
        },
        7: function () { //Ice Palace
            var boss;
            var min;
            var max;
            var entry =logic.entry7();

            var hookshot = items.hookshot.val,
                hammer = items.hammer.val,
                somaria = items.somaria.val,
                spikeWalk = items.byrna.val || items.cape.val || hookshot,
                fightKhold = entry && hammer && items.glove.val,
                key = items.key7.val,
                bigKey = items.bigKey7.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightKhold
                   ? bigKey && key >= 1
                         && ((spikeWalk && somaria)
                         || (spikeWalk && key ==2) || (somaria && key == 2))
                      ? entry
                      : STATE.maybe
                   : 0;//boss reqs; need 2 out of 3-- 2nd key, somaria, and/or spikeWalk to get a free key with

                min = entry===STATE.avail
                   ? 3 +                                                                               // compass chest, freezor chest, ice T chest
                    (bigKey ? 1 : 0) +                                                                   // big chest
                    ((key == 0 && hookshot) || (key >= 1 && spikeWalk) ? 1 : 0) +                     // spike chest -- specifically need hookshot if 0 keys, otherwise any spike safety will do
                    (hammer && ((key == 0 && hookshot) || (key >= 1 && spikeWalk)) ? 2 : 0) +       // map chest, BK chest -- specifically need hookshot if 0 keys, otherwise any spike safety will do
                    (key >= 1 && hammer && ((spikeWalk && somaria) || (spikeWalk && key == 2) || (somaria && key == 2)) ? 1 : 0) : //boss: need 2 out of 3-- 2nd key, somaria, and/or spikeWalk to get a free key with
                    0;

                max = entry ?
                    4 +                             // base access + spike chest (can use free key for it)
                    (bigKey ? 1 : 0) +              // big chest
                    (hammer ? 3 : 0) :              // map chest, BK chest, boss
                    0;

            } else if (retro()) {    // RETRO LOGIC

                boss = fightKhold ?                   //boss reqs
                    spikeWalk ? entry: STATE.maybe:             //big key might be past spikes
                    0;

                min = entry == STATE.avail ?
                    1 +                                                 // guaranteed 1 item from first 4 chests
                    (hammer ? 1 : 0) +                                  // 3 items might be behind hammer
                    (hookshot || spikeWalk ? 1 : 0) +                   // 2 items might be past spike/hammer area
                    (hammer && (hookshot || spikeWalk) ? 2 : 0) :       // can get everything
                    0;

                max = entry ?
                    hammer ? 5 : 4 :                                    // if hammer, can get all; otherwise best case is 4
                    0;

            } else {    // REGULAR LOGIC

                boss = fightKhold ?
                    hookshot ? entry: STATE.maybe:            // big key might be past spikes
                    0;

                min = entry==STATE.avail ?
                    (hammer && hookshot ? 2 : 0) +      // hammer and hookshot guarantee all chests
                    (hammer && spikeWalk ? 1 : 0) :     // hammer and other form of spikeWalk guarantee one
                    0;

                max = entry ? 3 : 0;                // first three chests could have items

            }

            return { boss: boss, max: max, min: min }
        },
        8: function () { //Misery Mire
            var boss;
			var min;
			var max;
            var entry = logic.entry8(),
                lamp = items.lamp.val,
                somaria = items.somaria.val,
                firerod = items.firerod.val,
                fire = firerod || lamp,
                spikeWalk = true,// items.byrna.val || items.cape.val,
                key = items.key8.val,
                bigKey = items.bigKey8.val,
                fightVit = entry && somaria && (items.sword.val >= 1 || logic.canShoot()),
                medallion = logic.medallion(8)
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = fightVit && bigKey ?
                    medallion == 1 ?
                        lamp ? STATE.avail : STATE.dark :
                        medallion :
                    STATE.unavail;

                max = entry && medallion !== 0 ?
                    4 +			                    //Bridge Chest, Spike Chest, Map Chest, Main Room
                    (fire ? 2 : 0) +               //Compass Chest, Big Key Chest
                    (bigKey ? 1 : 0) +	            //Big Chest
                    (fightVit && bigKey ? 1 : 0) :     //Boss
                    0;

                min = entry && medallion ==1 ?
                    3 +			                            //Bridge Chest, Map Chest, Main Room
                    (spikeWalk ? 1 : 0) +                   //Spike Chest
                    (fire ? 2 : 0) +                        //Compass Chest, Big Key Chest
                    (bigKey ? 1 : 0) +                  	//Big Chest
                    (fightVit && bigKey && lamp ? 1 : 0) :    //Boss
                    0;

            } else if (retro()) {    // RETRO LOGIC
                 boss = fightVit ?
                    medallion == STATE.avail?
                        lamp ? STATE.avail : STATE.dark :
                        medallion :
                    STATE.unavail;

                min = entry && medallion == 1 ?
                    1 +
                    (spikeWalk ? 1 : 0) +
                    (fire ? 2 : 0) +
                    (lamp && somaria ? 1 : 0) :
                    0;

                max = entry && medallion !== 0 ?
                    fire || somaria ? 5 : 4 :
                    0;

            } else {    // REGULAR LOGIC

                boss = fightVit ?
                    medallion == STATE.avail?
                        lamp ? STATE.avail : STATE.dark :
                        medallion :
                    STATE.unavail;

                min = entry && medallion == 1 ?
                    fightVit && lamp ?
                        2 :
                        firerod ? 1 : 0 :
                    0;

                max = entry && medallion !== 0 ? 2 : 0;

            }

            return { boss: boss, max: max, min: min }
        },
        9: function () { //Turtle Rock reg
        if (!inverted()){
            var boss;
            var min;
            var max;
            var entry = logic.entry9(),
                medallion = logic.medallion(9),
                firerod = items.firerod.val,
                icerod = items.icerod.val,
                safety = items.byrna.val || items.shield.val >= 3 || items.cape.val,
                light = logic.DMlight(),
                lamp = items.lamp.val,
                fightTri = entry && firerod && items.icerod.val,
                key = items.key9.val,
                bigKey = items.bigKey9.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC reg

                boss = fightTri && bigKey && key >= 3 ?
                    medallion == STATE.avail ?
                        key == 4 ?
                            lamp ? STATE.avail : STATE.dark:
                            STATE.maybe:
                        medallion :
                    STATE.unavail;

                min = entry && light && 1 == medallion ?
                    1 +                             // compass Chest
                    (firerod ? 2 : 0) +          	//Spike Roller Chests
                    (key >= 1 ? 1 : 0) +          // chomp room
                    (key >= 2 ? 1 : 0) +         // BK chest
                    (key >= 2 && bigKey ? 2 : 0) +  //big chest and crystaroller chest
                    (key == 3 && bigKey ? -1 : 0) +  // must leave 1 behind-- either BK chest or boss
                    (key >= 3 && bigKey && lamp && safety ? 4 : 0) + // laser bridge
                    (key >= 3 && firerod && bigKey && lamp && icerod ? 1 : 0) : // boss
                    0;

                max = entry && medallion !== 0 ?
                    1 +                             // compass Chest
                    (firerod ? 2 : 0) +                               // compass Chest
                    (key >= 1 ? 1 : 0) +            // chomp room
                    (key >= 2 ? 1 : 0) +            // BK chest
                    (key >= 2 && bigKey ? 5 : 0) +  // crystaroller chest and laser bridge
                    (key >= 3 && bigKey ? 1 : 0) +  // big chest
                    (key == 4 && firerod && bigKey && icerod ? 1 : 0) : //boss
                    0;

            } else if (retro()) {    // RETRO LOGIC reg
                //must have a keyshop if accessible
                boss = fightTri ?
                    medallion == STATE.avail?
                        lamp ? STATE.avail : STATE.dark :
                        medallion :
                    STATE.unavail;
//9 total items
                min = entry && light && medallion == 1
                    ? 2 +
                        (firerod ? 2 : 0) +
                        (firerod && safety ? 4 : 0) +
                        (firerod && safety && icerod ? 1 : 0)
                    : 0;

                max = entry && medallion !== 0 ?
                    8 +
                    (firerod ? 1 : 0) :
                    0;

            } else {    // REGULAR LOGIC reg

                boss = fightTri ?
                    medallion == STATE.avail ?
                        lamp ? STATE.avail : STATE.dark :
                        medallion :
                    STATE.unavail;

                max = entry && medallion !== 0 ? 5 : 0;

                min = entry && light && firerod && medallion == 1 ?
                    1 +
                    (safety ? 3 : 0) +
                    (safety && icerod ? 1 : 0) :
                    0;
            }

            return { boss: boss, max: max, min: min }
        }else{//inverted
            var boss;
            var min;
            var max;
            var medallion = logic.medallion(9),
                front=(logic.darkEastDM()  && items.somaria.val)
                    * medallion,
	        hook=items.hookshot.val,
                somaria=items.somaria.val,
                back = (logic.eastDM() && items.mirror.val)?logic.DMlightAorD():STATE.unavail,
                firerod = items.firerod.val,
                icerod = items.icerod.val,
                safety = items.byrna.val || items.shield.val >= 3 || items.cape.val,
                light = logic.DMlight(),
                lamp = items.lamp.val,
                fightTri = firerod && items.icerod.val && somaria,
                key = items.key9.val,
                bigKey = items.bigKey9.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC inverted
                if (fightTri && bigKey) {//otherwise no chance
                    if (back) {//front doesn't change back logic, 0 keys could do, and can't mess up with 4
                        if (key>=4) {
                            boss=logic.DMlightAorD();
                        } else {//0-3 keys and back
                            boss=STATE.maybe;
                        }
                    } else {//front only
                        if (front && key>=3){
                            if (front==STATE.avail) {
                                if (key==4) {
                                    boss=lamp?STATE.avail:STATE.dark;
                                } else {
                                    boss=STATE.maybe;
                                }
                            }else{//front is true but not avail
                                boss=front;
                            }
                        }else{
                            boss=STATE.unavail;
                        }

                    }
                }else{
                    boss=STATE.unavail;
                }
//inverted ks
              var bc;
              var cr;
              var keysLeft;
              if (front==STATE.avail && back!=STATE.avail){//min inv ks
                min =  light && 1 == front ?
                    1 +                             // compass Chest
                    (firerod ? 2 : 0) +          	//Spike Roller Chests
                    (key >= 1 ? 1 : 0) +          // chomp room
                    (key >= 2 ? 1 : 0) +         // BK chest
                    (key >= 2 && bigKey ? 2 : 0) +  //big chest and crystaroller chest
                    (key == 3 && bigKey ? -1 : 0) +  // must leave 1 behind-- either BK chest or boss
                    (key >= 3 && bigKey && lamp && safety ? 4 : 0) + // laser bridge
                    (key >= 3 && firerod && bigKey && lamp && icerod ? 1 : 0) : // boss
                    0;
                  }else if (back == STATE.avail){//min inv ks
                    bc=bigKey && (hook ||  somaria);
                    cr=bc||(lamp&&somaria);
                    min=4*safety+bc;//laser+chomp + big chests
                    keysLeft=key+1;
                    if(cr){//crystaroller can waste a key also
                      min++;
                      keysLeft--;
                    }
                    if (keysLeft>0) {//boss
                        keysLeft--;
                      if (fightTri && bigKey) {
                        min++;
                      }
                    }
                    if (keysLeft>0) {
                      min++;
                      keysLeft--; //next inefficient is to use on bk
                    }
                    if ((keysLeft>0 && somaria ) ||(front==STATE.avail)) {
                      keysLeft--;
                      min+=1+(firerod?2:0)
                    }
                  }else {
                    min=0;
                  }
               if(front && !back){//max inv ks
  //inverted
                   max = front != 0 ?
                      1 +                             // compass Chest
                      (firerod ? 2 : 0) +                               // compass Chest
                      (key >= 1 ? 1 : 0) +            // chomp room
                      (key >= 2 ? 1 : 0) +            // BK chest
                      (key >= 2 && bigKey ? 5 : 0) +  // crystaroller chest and laser bridge
                      (key >= 3 && bigKey ? 1 : 0) +  // big chest
                      (key == 4 && firerod && bigKey && icerod ? 1 : 0) : //boss
                      0;
               } else if (back) {//max inv ks
                  keysLeft=key+1;
                    bc=bigKey && (hook ||  somaria);
                    cr=bc||somaria;
                  max=5 + bc + cr; //laser + cr bc chomp=7
                  if(front||(somaria && key>0)){
                     max+=1+(firerod?2:0);//compass roller=10
                     if (!front){
                        keysLeft--;
                     }
                     if (keysLeft>0 && boss) {
                      min++;
                      keysLeft--; //next inefficient is to use on bk
                    }
                  }
                  if (keysLeft>0) {
                      max++;
                      keysLeft--; // bk
                  }
               }
               else{//max inv ks
                  max=0;
               }
            } else {    // RETRO LOGIC inverted
                //must have a keyshop if accessible
                var laser=safety && back==STATE.avail;
                var cr=somaria&&lamp&&(back==STATE.avail);
                var floor1=(front==STATE.avail)||(somaria&&(back==STATE.avail));
                var backRoller=floor1&&firerod
                var defBK=cr&&laser&&floor1&&backRoller;
                    boss=fightTri && (back||front)
                           ? defBK
                              ? logic.DMlightAorD() //bigkey obv got in to TR
                              : STATE.maybe
                           :STATE.unavail;
                var prizes=5 + (retro()?4:0);
                min=Math.max(0,
                    prizes-12+1 + (4 * laser) +
                    cr +
                    2 + //chomp and big key chest
                    floor1 +
                    (backRoller *2) +
                    ((boss==STATE.avail)?1:0)  //don't add big chest as 1 is subtracted for big key
                );
//inverted

//inverted
              if (front||back){
                    var chestImpossible= (!firerod?0:2) //back roller
                       + ((front||somaria)?0:1) //Compass
                       + (boss?0:1);
                     max=Math.min(prizes,12-chestImpossible);
              }else{
                 max=0;
              }
//inverted
            }
//inverted
            return { boss: boss, max: max, min: min }
          }
        },
        10: function () { //Ganon's Tower
            var boss;
			var min;
			var max;
            var entry = logic.entry10(),
                bigKey = items.bigKey10.val,
                canClimb = logic.canShoot() && logic.fire() && (bigKey ||!keysanity()),
                light = items.lamp.val,
                somaria = items.somaria.val,
                firerod = items.firerod.val,
                fireCane = somaria && firerod,
                hammer = items.hammer.val,
                hookshot = items.hookshot.val,
                hamHook = hammer && hookshot,
                boots = items.boots.val,
                hamBoots = hammer && boots,
                key = items.key10.val
                ;

            if (keysanity()) {    // KEY-SANITY LOGIC

                boss = ( canClimb && hookshot && bigKey && key >= 1 ?
                    key == 4?
                        logic.DMlight() ? entry : STATE.dark:
                        STATE.maybe :
                    STATE.unavail);

                max = entry ?
                    2 +                     //hope room
                    (boots ? 1 : 0) +       //torch
                    (hamHook ? 4 : 0) +     //dark mag room
                    (somaria ? 1 : 0) +     //tile room
                    (canClimb ? 3 : 0) +    //helmasaur chests & anti-fairy chest
                    (fireCane || hamHook ? 8 : 0) + //Bob's chest, BK room chest, either compass room or rando room
                    (bigKey && (fireCane || hamHook) ? 1 : 0) + //big chest
                    (hamHook || hamBoots ? 1 : 0) + //map chest
                    (key >= 1 && hamHook ? 1 : 0) + //firesnake room
                    //chests from either compass or rando room
                    (key == 0 && canClimb && fireCane && hamHook ? 3 : 0) +
                    (key >= 1 && fireCane && hamHook ? 3 : 0) +
                    (key >= 2 && fireCane && hamHook ? 1 : 0) +
                    (key == 2 && canClimb && !fireCane && hamHook ? 1 : 0) +
                    //moldorm chest (if not better options elsewhere)
                    (key == 0 && canClimb && !fireCane && !hammer && hookshot ? 1 : 0) +
                    (key == 1 && canClimb && !hammer && hookshot ? 1 : 0) +
                    (key == 2 && canClimb && !hammer && hookshot ? 1 : 0) +
                    (key >= 3 && canClimb && hookshot ? 1 : 0) :
                    0;

                min = (entry==STATE.avail) && logic.DMlight() ?
                    2 +                     //hope room
                    (boots ? 1 : 0) +       //torch
                    (hamHook ? 4 : 0) +     //dark mag room
                    (somaria ? 1 : 0) +     //tile room
                    (canClimb ? 2 : 0) +    //helmasaur chests
                    (key >= 1 && canClimb ? 1 : 0) +            //anti-fairy chest
                    (key >= 2 && canClimb && hookshot ? 1 : 0) +       //Moldorm chest
                    //firesnake or map chest or randomizer room, depending on key use
                    (key >= 1 && hammer && hookshot ? 1 : 0) +
                    (key >= 2 && hammer && hookshot ? 1 : 0) +
                    (key >= 3 && hammer && hookshot ? 3 : 0) +
                    // Bob's chest, BK room chests
                    (key >= 3 && (hamHook || fireCane) ? 4 : 0) +
                    (key == 2 && ((!canClimb && fireCane) || (fireCane && !hammer) || (fireCane && !boots && !hookshot)) ? 4 : 0) +
                    (key == 1 && !canClimb && fireCane && !(hammer && hookshot) && !(hammer && boots) ? 4 : 0) +
                    //compass room
                    (key == 4 && fireCane ? 4 : 0) +
                    (key == 3 && fireCane && (!canClimb || !hamHook) ? 4 : 0) +
                    (key == 2 && ((!canClimb && fireCane) || (fireCane && !hammer) || (fireCane && !boots && !hookshot)) ? 4 : 0) +
                    (key == 1 && !canClimb && fireCane && !(hammer && hookshot) && !(hammer && boots) ? 4 : 0) +
                    //big chest
                    (key >= 3 && bigKey && (hamHook || fireCane) ? 1 : 0) +
                    (key == 2 && bigKey && fireCane && (!canClimb || !hamHook) ? 1 : 0) +
                    (key == 1 && bigKey && (!canClimb || hammer) && (canClimb || fireCane) && (canClimb || !hammer) ? 1 : 0) +
                    //map chest
                    (key == 2 && !canClimb && hammer && !hookshot && boots ? 1 : 0) +
                    (key >= 3 && hammer && (hookshot || boots) ? 1 : 0) +
                    (key == 1 && fireCane && (!canClimb || (hammer && boots && !hookshot)) ? 1 : 0) +

                    (key == 0 && canClimb && hamHook ? 2 : 0) + //firesnake or map chest or anti-fairy chest
                    (key == 0 && fireCane && !hamHook ? 1 : 0) : //I DON'T KNOW
                    0;

            } else if (retro()) {    // RETRO LOGIC

                boss = entry && canClimb && hookshot ?
                    hamHook && fireCane && boots ?
                        logic.DMlight() ? STATE.avail : STATE.dark :
                        3 :
                    0;

                min = (entry==STATE.avail) && logic.DMlight() ?
                    (canClimb && somaria && !firerod && hammer && !hookshot && !boots ? 1 : 0) +
                    (canClimb && somaria && firerod && hammer && hookshot && boots ? 4 : 0) +
                    (canClimb && !somaria && !hammer && hookshot && boots ? 1 : 0) +
                    (somaria && !firerod && hammer && !hookshot && boots ? 1 : 0) +
                    (somaria && firerod && hammer && !hookshot ? 4 : 0) +
                    (somaria && !firerod && hammer && hookshot ? 1 : 0) +
                    (canClimb && !somaria && !hookshot && boots ? 1 : 0) +
                    (canClimb && somaria && !firerod && !hammer ? 1 : 0) +
                    (somaria && hammer && !hookshot && boots ? 1 : 0) +
                    (somaria && firerod && !hammer ? 4 : 0) +
                    (boots && (somaria || hammer) ? 1 : 0) +
                    (hammer && hookshot ? 14 : 0) +
                    (somaria && firerod ? 5 : 0) :
                    0;

                max = entry ?
                    2 +
                    (canClimb && somaria && firerod && hammer && hookshot && !boots ? 1 : 0) +
                    (canClimb && !somaria && firerod && hammer && hookshot ? 2 : 0) +
                    (canClimb && somaria && firerod && hammer && !hookshot ? 2 : 0) +
                    (somaria && firerod && hammer && !hookshot ? 3 : 0) +
                    (canClimb && !firerod && hammer && hookshot ? 2 : 0) +
                    (canClimb && somaria && firerod && !hammer ? 2 : 0) +
                    (canClimb && !hammer && hookshot ? 1 : 0) +
                    (canClimb && somaria && !firerod ? 1 : 0) +
                    (somaria && firerod && !hammer ? 3 : 0) +
                    (hammer && !hookshot && boots ? 1 : 0) +
                    (!canClimb && somaria ? 1 : 0) +
                    (hammer && hookshot ? 14 : 0) +
                    (somaria && firerod ? 5 : 0) +
                    (canClimb ? 2 : 0) +
                    (boots ? 1 : 0) :
                    0;

            } else {    // REGULAR LOGIC

                boss = ( canClimb && hookshot
                   ? hamHook && fireCane && boots
                      ? logic.DMlight() ? STATE.avail : STATE.dark
                      : STATE.maybe
                   : STATE.unavail) ;


                min = entry==STATE.avail ?
                    (somaria && firerod && hammer && hookshot ? 3 : 0) +
                    (!somaria && !firerod && hammer && hookshot ? 11 : 0) +
                    (somaria && hammer && hookshot ? 8 : 0) +
                    (hammer && hookshot && boots ? 1 : 0) +
                    (somaria && firerod ? 5 : 0) +
                    (somaria && firerod && !hammer && boots ? 1 : 0) +
                    (somaria && firerod && hammer && !hookshot && boots ? 3 : 0) +
                    (canClimb && somaria && !firerod && hammer && hookshot ? 4 : 0) +
                    (canClimb && somaria && firerod && hammer && hookshot && boots ? 3 : 0) :
                    0;

                max = entry ?
                    2 +
                    ((firerod && somaria) || (hammer && hookshot) ? 7 : 0) +
                    (canClimb ? 2 : 0) +
                    (somaria ? 1 : 0) +
                    (boots ? 1 : 0) +
                    (canClimb && hookshot ? 1 : 0) +
                    (hammer && !hookshot && boots ? 2 : 0) +
                    (hammer && hookshot ? 6 : 0) +
                    (!canClimb && hammer && hookshot ? 2 : 0) +
                    (canClimb && !somaria && hammer && hookshot ? 1 : 0) +
                    ((canClimb || firerod) && hammer && somaria && !boots && hookshot ? 1 : 0) +
                    ((!canClimb || !hookshot) && firerod && somaria ? 1 : 0) :
                    0;

            }
            boss=(entry==STATE.maybe || entry==STATE.dark) &&
                     (boss==STATE.maybe || boss==STATE.dark)
                   ? boss
                   : boss * entry;
            return { boss: boss, max: max, min: min }
        },
        11: function () { //Agahnim's Tower
            var boss;
			var min;
			var max;
            var entry = logic.entry11(),
                curtainAndFight = logic.canRemoveCurtains() && (items.sword.val>=1 || items.hammer.val ),//will need to use sword for net
                light = items.lamp.val,
                key = items.key11.val
                ;

            if (keysanity()) {


                boss = entry && curtainAndFight && key == 2 ?
                    light ? STATE.avail : STATE.dark:
                    STATE.unavail;

                max = entry ?
                    1 +             //first chest
                    (key ? 1 : 0) : //second chest
                    0;

                min = entry && logic.DMlight() ?
                    1 +                       //first chest
                    (key && light ? 1 : 0) :    //second chest
                    0;

            } else if (retro()) {


                if (items.keyShopFound.val) { //infinite key logic

                    boss = entry && curtainAndFight ?
                        light ? STATE.avail : STATE.dark:
                        STATE.unavail;

                    min = entry ?
                        light ? 2 : 1 :
                        0;

                    max = entry ? 2 : 0;

                } else {    //limited key logic

                    var maxKey = items.keyAny.val;
                    var minKey = Math.max(0,
                        maxKey -
                        1 -
                        (logic.entry1() ? 1 : 0) -
                        (logic.entry2() ? 1 : 0) -
                        (logic.entry3() ? 6 : 0) -
                        (logic.entry4() ? 1 : 0)
                    );
                    maxKey -= (std() ? 1 : 0);

                    boss = entry && maxKey >= 2 && curtainAndFight ?
                        minKey >= 2 ?
                            light ? STATE.avail : STATE.dark:
                            STATE.maybe:
                        STATE.unavail;

                    max = entry ?
                        maxKey >= 1 ? 2 : 1 :
                        0;


                    min = entry ?
                        minKey >= 1 && light ? 2 : 1 :
                        0;

                }

            } else {
                boss = entry && curtainAndFight ?
                    light ? STATE.avail : STATE.dark:
                    STATE.unavail;

                max = 0;
                min = 0;
            }

            return { boss: boss, max: max, min: min }
        },
    },
    keyShops: {
        0: function () { return logic.lightWorldBunny() },  //LW Lake Hylia
        1: function () { return logic.lightWorldBunny() },  //Kakariko
        2: function () { return (logic.eastDM()&&(!inverted() || items.pearl.val)) ? logic.DMlightAorD() : 0; },  //Death Mountain
        3: function () { return logic.darkWorldSouth() ? 1 : 0; },  //DW Lake Hylia
        4: function () { if(inverted()){
              return logic.climbDM()
                 ? logic.DMlightAorD()
                 : STATE.unavail;
           } else{
              return  items.glove.val >= 2 && logic.eastDM()

                 ? logic.DMlightAorD()

                 : 0;
           }
        },  //Dark EDM
        5: function () { return logic.darkWorldNW() && items.hammer.val ? 1 : 0; },  //Outcasts
        6: function () { return logic.darkWorldNW() ? 1 : 0; },  //DW Forest
        7: function () { return logic.darkWorldNW() ? 1 : 0; },  //DW Lumberjack
        8: function () { return ((logic.darkWorldEast()&&(items.hammer.val || items.glove.val || items.flippers.val)) ||
           (logic.darkWorldNW()&&items.flippers.val))
              ? STATE.avail
              : logic.darkWorldNW()&&items.boots.val
                 ? STATE.dark
                 : STATE.unavail;},  //DW Potion Shop
    },
   caves:{
      0: function () { return logic.lightWorldBunny(); },  //Lumberjack's House
      1: function () { return logic.lightWorldBunny(); },  //Lost Woods Gamble
      2: function () { return logic.lightWorldBunny(); },  //Fortune Teller(Light)
      3: function () { return logic.lightWorldBunny(); },  //Snltch Lady West
      4: function () { return logic.lightWorldBunny(); },  //Snitch Lady East
      5: function () { return logic.lightWorldLink(); },  //Bush Covered House
      6: function () { return logic.lightWorldLink(); },  //Bomb Hut
      7: function () { return logic.lightWorldBunny(); },  //Kakarlko Gamble Game
      8: function () { return logic.lightWorldLink()&&items.boots.val; },  //Bonk Fairy (Light)
      9: function () { return logic.lightWorldBunny(); },  //Desert Falry
      10: function () { return logic.lightWorldLink() && items.glove.val>0;},  //50 Rupee Cave
      11: function () { return logic.lightWorldLink(); },  //Light Hype Fairy
      12: function () { return logic.lightWorldBunny(); },  //lake Hylia Fortune Telter
      13: function () { return logic.lightWorldBunny(); },  //Lake hylia Fairy
      14: function () { return logic.lightWorldBunny(); },  //Long Fairy Cave(warp 5)
      15: function () { return logic.lightWorldBunny(); },  //Good Bee Cave
      16: function () { return logic.lightWorldLink()&&items.glove.val>0; },  //20 Rupee Cave
      17: function () { return logic.chests[25]()/*hobo*/; },  //Capacity Upgrade
      18: function () { return logic.eastDM()?logic.DMlightAorD():STATE.unavail; },  //Hookshot Fairy
      19: function () { return logic.darkWorldNW(); },  //Fortune Teller(Dark)
      20: function () { return logic.darkWorldSouth(); },  //Archery Game
      21: function () { return logic.darkWorldNW(); },  //Dark Sanctuary Hint
      22: function () { return logic.darkWorldSouth()&&items.boots.val; },  //Bonk Falry(Dark)
      23: function () { return logic.mireArea(); },  //Dark Desert Falry
      24: function () { return logic.mireArea(); },  //Dark Desert Hint
      25: function () {
         return (items.boss11.val && !inverted()) ||
            logic.darkWorldEast();
      },  //Dark Lake Hylia Fairy
      26: function () { return logic.caves[25](); },  //Palace of Dnrkness Hint
      27: function () { return logic.caves[25](); },  //East Dark World Hint
      28: function () { return logic.caves[30]() ; },  //Dark Lake Hylia Ledge Fairy(ice)
      29: function () { return logic.caves[30]() * (items.glove.val>0) ; },  //"Dark Lake Hylia Ledge Spike Cave(rock)"
      30: function () {

            return items.flippers.val && logic.darkWorldSouth()
               ? STATE.avail
               : logic.keyShops[8]() //potion ledg, can ff
                  ? STATE.dark
                  : inverted() && logic.lightWorldBunny() && items.mirror.val
                     ? STATE.avail
                     : STATE.unavail;

      },  //Dark Lake Hylia Ledge Hint(bee)"
      31: function () { return logic.climbDM(); },  //Dark Death Mouatain Fairy
},
    keyShopCheck: function () { //function for checking and applying the status of key shop access in Retro mode
        var count = 0;
        var found = false;

        $.each(logic.keyShops, function (id, test) {

            if (test()==STATE.avail) { count++ } //if the keyShop is accessible, add it to the count

            //toggle accessibility status on map

            if (keyShops[id].checked == SHOP.FOUND) { found = true } //check if any shop has been clicked
        });

        if (count >= 5) { found = true; } //if more than 5 shops are accessible, one must be a key shop

        items.keyShopFound.val = found ? 1 : 0;
        $("#keyAny").toggleClass("infinite", found);


        return found;
    },
    //function for colouring map elements by their logical state
    colour: function (elem, state) {

        $(elem)
            .toggleClass("unavail", state == 0)
            .toggleClass("avail", state == 1)
            .toggleClass("dark", state == 2)
            .toggleClass("maybe", state == 3)
            .toggleClass("visible", state == 4)
            .toggleClass("darkmaybe",state == 6)
            .toggleClass("opened", state == "null")
            .toggleClass("alt1", state==-1)
            .toggleClass("alt2", state==-2);

    },

    //function that runs through all chests/dungeons and calculates/applies their status
    apply: function () {

        logic.setPrizes();
        if (retro()) { logic.keyShopCheck(); }

        $.each(logic.chests, function (id, test) {

            var status = chests[id].opened ? null : test(); //if the chest's not open, it is tested

            logic.colour("#chest" + id, status);         //colours the chest on the map
        });
        $.each(logic.keyShops, function (id, test) {

            var status =keyShops[id].checked==SHOP.CHECKED
               ? null
               : keyShops[id].checked==SHOP.FOUND
                  ? -1
                  : test(); //if the chest's not open, it is tested
            //chests[id].checked = status;                 //sets chest's status according to what the test found

            logic.colour("#keyShop" + id, status);         //colours the chest on the map
        });

        $.each(logic.caves, function (id, test) {

            var status = caves[id].opened ? null : test(); //if the chest's not open, it is tested

            logic.colour("#cave" + id, status);         //colours the chest on the map
        });
        $.each(logic.dungeons, function (id, test) {
            var dStatus = test();

            dStatus.boss = items["boss"+id].val ? null : dStatus.boss;
            dungeons[id].status = dStatus.boss;              //applies the test result to the dungeons object
            logic.colour("#dungeon" + id, dStatus.boss);    //colours the boss by its status
            setState($("#dungeon"+id)[0],dungeons[id].prize);
            var total = dungeons[id]["chests" + settings.keyMode];
            var opened = dungeons[id].openChests;

            dStatus.chest =             //figures out status of next chest based on how many opened so far & max/min available
                opened == total ? "null"
                    : opened < dStatus.min ? 1
                        : opened < dStatus.max ? 3
                            : 0;


            $("#dungeonChest" + id).html(total - opened);

            logic.colour("#dungeonChest" + id, dStatus.chest);
			var pipStatus;
            for (var chest = 1; chest <= total; chest++) {  //colours each chest pip based on amount opened and max/min
                pipStatus =
                    chest > (total - opened) ? "null"
                        : chest > (total - dStatus.min) ? 1
                            : chest > (total - dStatus.max) ? 3
                                : 0;

                logic.colour("#chestPip" + id + "-" + chest, pipStatus);
            }

        });
        trackables.saveToCookie();
        if (!window.testing)$('#goMode')[0].disabled=!goModeTest();
    },
};

