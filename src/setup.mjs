export function setup(ctx) {
  ctx.onInterfaceReady(function onInterfaceReadyCallback() {
    const capes = loadCapes();
    if (!capes) {
      return;
    }

    const skip = () => {
      itemToReEquip = null;
    };

    const equipItem = item => {
      const player = game.combat.player;
      player.changeEquipToSet(player.selectedEquipmentSet);
      player.equipItem(item, player.equipToSet, 'Default', 1);
    };

    const hasInBank = item => game.bank.getQty(item) !== 0;

    // Re-equip this after the building's been added
    let itemToReEquip = null;

    const patchArgs = [Township, 'buildBuilding'];
    ctx.patch(...patchArgs).before(() => {
      // Skip if in combat
      if (game.activeAction?.id === 'melvorD:Combat') {
        return skip();
      }

      const equippedCape = game.combat.player.equipment.slots.Cape.item;

      for (const cape of capes) {
        // Already got one of them equipped - skip
        if (equippedCape.id === cape.id) {
          return skip();
        }

        // Got the cape in the bank?
        if (hasInBank(cape)) {
          // Record cape to re-equip
          itemToReEquip = equippedCape;

          return equipItem(cape);
        }
      }
    });

    ctx.patch(...patchArgs).after(() => {
      if (itemToReEquip) {
        if (hasInBank(itemToReEquip)) {
          equipItem(itemToReEquip);
        }

        itemToReEquip = null;
      }
    });
  });

  /** Terminate with a swal popup */
  function alert(key, message) {
    if (ctx.accountStorage.getItem(key)) {
      return;
    }

    ctx.accountStorage.setItem(key, true);
    Swal
      .fire({
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Got it',
        text: message,
        title: 'Auto Township Cape',
      })
      .catch(console.error);
  }

  /** Load the available capes array sorted by priority */
  function loadCapes() {
    const township = game.items.getObjectByID('melvorF:Township_Skillcape');
    if (!township) {
      return alert('fullNeeded', 'Full version needed to use mod');
    }

    const superTown = game.items.getObjectByID('melvorTotH:Superior_Township_Skillcape');
    if (!superTown) {
      return [township];
    }

    return [
      game.items.getObjectByID('melvorTotH:Superior_Cape_Of_Completion'),
      game.items.getObjectByID('melvorTotH:Superior_Max_Skillcape'),
      superTown,
      township,
    ];
  }
}
