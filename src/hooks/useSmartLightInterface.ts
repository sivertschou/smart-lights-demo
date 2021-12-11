import * as React from "react";
export interface SmartLight {
  connect: () => void;
  isConnected: boolean;
  toggle: () => void;
  setRedLight: () => void;
  setGreenLight: () => void;
  setBlueLight: () => void;
  setColor: (color: string) => string;
}
const utils = {
  min: (array: number[]) =>
    array.reduce(
      (currentMin, value) => (value < currentMin ? value : currentMin),
      array[0]
    ),
  max: (array: number[]) =>
    array.reduce(
      (currentMax, value) => (value > currentMax ? value : currentMax),
      array[0]
    ),
  sum: (array: number[]) => array.reduce((sum, val) => sum + val, 0),
};
const offsetAndScale = (rgb: number[]) => {
  // Offset calculation would divide by zero if the values are equal
  if (rgb[0] === rgb[1] && rgb[1] === rgb[2]) {
    return [Math.floor(255 / 3), Math.floor(255 / 3), Math.floor(255 / 3)];
  }

  const min = utils.min(rgb);
  const max = utils.max(rgb);

  const offset = rgb.map((value) => (value - min) / (max - min));
  const sum = utils.sum(offset);
  const scaled = offset.map((value) => Math.floor((value / sum) * 255));
  if (scaled[0] === 255) {
    return [254, 0, 1];
  }
  if (scaled[1] === 255) {
    return [1, 254, 0];
  }
  if (scaled[2] === 255) {
    return [0, 1, 254];
  }
  return scaled;
};

export const useSmartLightInterface = (): SmartLight => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [toggleCharacteristic, setToggleCharacteristic] =
    React.useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [colorCharacteristic, setColorCharacteristic] =
    React.useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const connect = async () => {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          namePrefix: "Hue",
        },
      ],
      // Philips Hue Light Control Service
      optionalServices: ["932c32bd-0000-47a2-835a-a8d455b859dd"],
    });
    if (!device) {
      console.error("Failed to connect to device.");
      return;
    }
    const server = await device.gatt?.connect();

    if (!server) {
      console.error("Failed to connect to server");
      return;
    }
    // Philips Hue Light Control Service
    const service = await server.getPrimaryService(
      "932c32bd-0000-47a2-835a-a8d455b859dd"
    );

    if (!service) {
      console.error("Failed to connect to service.");
      return;
    }

    const toggleChar = await service.getCharacteristic(
      "932c32bd-0002-47a2-835a-a8d455b859dd" // Philips Hue Light On/Off Toggle
    );

    if (!toggleChar) {
      console.error("Failed to get toggle characteristic.");
      return;
    }
    setToggleCharacteristic(toggleChar);

    const colorChar = await service.getCharacteristic(
      "932c32bd-0005-47a2-835a-a8d455b859dd" // Philips Hue Light On/Off Toggle
    );

    if (!colorChar) {
      console.error("Failed to get color characteristic.");
      return;
    }
    setColorCharacteristic(colorChar);

    setIsConnected(true);
  };

  const toggle = async () => {
    const currentValue = await toggleCharacteristic?.readValue();
    const lightIsCurrentlyOn = currentValue?.getUint8(0) ? true : false;

    await toggleCharacteristic?.writeValue(
      new Uint8Array([lightIsCurrentlyOn ? 0x0 : 0x1])
    );
  };

  const setRedLight = () => {
    colorCharacteristic?.writeValue(new Uint8Array([0x01, 0xfe, 0x01, 0x00]));
  };
  const setBlueLight = () => {
    colorCharacteristic?.writeValue(new Uint8Array([0x01, 0x00, 0xfe, 0x01]));
  };
  const setGreenLight = () => {
    colorCharacteristic?.writeValue(new Uint8Array([0x01, 0x01, 0x00, 0xfe]));
  };

  const setColor = (color: string) => {
    const updatedColor = (color.replace(/[^0-9a-f]/, "") + "000000").slice(
      0,
      6
    );
    const r = updatedColor.slice(0, 2);
    const b = updatedColor.slice(2, 4);
    const g = updatedColor.slice(4, 6);
    const [normalizedR, normalizedG, normalizedB] = offsetAndScale([
      parseInt(r, 16),
      parseInt(b, 16),
      parseInt(g, 16),
    ]);

    // Set light color to the normalized values
    colorCharacteristic?.writeValue(
      new Uint8Array([0x01, normalizedR, normalizedB, normalizedG])
    );
    return updatedColor;
  };

  return {
    connect,
    toggle,
    isConnected,
    setRedLight,
    setGreenLight,
    setBlueLight,
    setColor,
  };
};
