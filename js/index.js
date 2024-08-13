"use strict";

import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

function originalSlotMenuOptions(slot) {
  let menu_info = [];
  if (
      slot &&
      slot.output &&
      slot.output.links &&
      slot.output.links.length
  ) {
      menu_info.push({ content: "Disconnect Links", slot: slot });
  }
  var _slot = slot.input || slot.output;
  if (_slot.removable){
    menu_info.push(
        _slot.locked
            ? "Cannot remove"
            : { content: "Remove Slot", slot: slot }
    );
}
  if (!_slot.nameLocked){
    menu_info.push({ content: "Rename Slot", slot: slot });
  }

  // options.title =
  //     (slot.input ? slot.input.type : slot.output.type) || "*";
  // if (slot.input && slot.input.type == LiteGraph.ACTION) {
  //     options.title = "Action";
  // }
  // if (slot.output && slot.output.type == LiteGraph.EVENT) {
  //     options.title = "Event";
  // }

  return menu_info;
}

app.registerExtension({
	name: `shinich39.ConnectFromAfar`,
  async beforeRegisterNodeDef(nodeType, nodeData, app) {

		const origGetSlotMenuOptions = nodeType.prototype.getSlotMenuOptions;
		nodeType.prototype.getSlotMenuOptions = function ({ input, output, link_pos, slot }) {
      const r = origGetSlotMenuOptions ? 
        origGetSlotMenuOptions.apply(this, arguments) :
        originalSlotMenuOptions.apply(this, arguments);

      const self = this;
      const isInput = !!input;
      const isOutput = !!output;
      const type = isInput ? input.type : (isOutput ? output.type : null);
      if (!type) {
        return r;
      }

      let newOptions = [null];
      for (const n of app.graph._nodes) {
        if (n.id === this.id) {
          continue;
        }

        let slots = [];
        if (isInput) {
          slots = n.outputs?.filter(e => e.type === type) ?? [];
        } else if (isOutput) {
          slots = n.inputs?.filter(e => e.type === type) ?? [];
        }
        
        if (slots.length < 1) {
          continue;
        }

        for (const s of slots) {
          newOptions.push({
            content: `${n.title} : ${s.name}`,
            callback: () => {
              let node, args;
              if (isInput) {
                node = n;
                args = [n.findOutputSlot(s.name), self.id, slot];
              } else if (isOutput) {
                node = self;
                args = [slot, n.id, n.findInputSlot(s.name)];
              } else {
                return;
              }
              node.connect(...args);
            }
          })
        }
      }
      

      return [...r, ...newOptions];
    }
	},
});