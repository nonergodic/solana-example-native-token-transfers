import {
  Layout,
  LayoutToType,
  CustomizableBytes,
  customizableBytes,
} from "@wormhole-foundation/sdk-base";

import {
  NamedPayloads,
  RegisterPayloadTypes,
  registerPayloadTypes,
  layoutItems,
} from "@wormhole-foundation/sdk-definitions";
const { universalAddressItem, chainItem, sequenceItem } = layoutItems;

export const normalizedAmountLayout = [
  {name: "decimals", binary: "uint", size: 1},
  {name: "amount", binary: "uint", size: 8},
] as const satisfies Layout;

export type NormalizedAmount = LayoutToType<typeof normalizedAmountLayout>;

export type Prefix = readonly [number, number, number, number];

const prefixItem = (prefix: Prefix) =>
  ({name: "prefix", binary: "bytes", custom: Uint8Array.from(prefix), omit: true} as const);

export const nativeTokenTransferLayout = [
  prefixItem([0x99, 0x4E, 0x54, 0x54]),
  {name: "normalizedAmount", binary: "bytes", layout: normalizedAmountLayout},
  {name: "sourceToken", ...universalAddressItem},
  {name: "recipientAddress", ...universalAddressItem},
  {name: "recipientChain", ...chainItem()},
] as const satisfies Layout;

export type NativeTokenTransfer = LayoutToType<typeof nativeTokenTransferLayout>;

export const endpointMessageLayout = <
  const MP extends CustomizableBytes = undefined,
  const EP extends CustomizableBytes = undefined,
>(prefix: Prefix, managerPayload?: MP, endpointPayload?: EP) => [
  prefixItem(prefix),
  {name: "sourceManager", ...universalAddressItem},
  customizableBytes({name: "managerPayload", lengthSize: 2}, managerPayload),
  customizableBytes({name: "endpointPayload", lengthSize: 2}, endpointPayload),
] as const satisfies Layout;

export type EndpointMessage<
  MP extends CustomizableBytes = undefined,
  EP extends CustomizableBytes = undefined,
> = LayoutToType<ReturnType<typeof endpointMessageLayout<MP, EP>>>;

export const managerMessageLayout = <
  const P extends CustomizableBytes = undefined
>(customPayload?: P) => [
  {name: "sequence", ...sequenceItem},
  {name: "sender", ...universalAddressItem},
  customizableBytes({name: "payload", lengthSize: 2}, customPayload),
] as const satisfies Layout;

export type ManagerMessage<P extends CustomizableBytes = undefined> =
  LayoutToType<ReturnType<typeof managerMessageLayout<P>>>;

export const wormholeEndpointMessageLayout = <
  MP extends CustomizableBytes = undefined,
  EP extends CustomizableBytes = undefined,
>(managerPayload?: MP, endpointPayload?: EP) =>
  endpointMessageLayout([0x99, 0x45, 0xFF, 0x10], managerPayload, endpointPayload);

export type WormholeEndpointMessage<P extends CustomizableBytes = undefined> =
  LayoutToType<ReturnType<typeof wormholeEndpointMessageLayout<P>>>;

const wormholeNativeTokenTransferLayout =
  wormholeEndpointMessageLayout(managerMessageLayout(nativeTokenTransferLayout));

export type WormholeNativeTokenTransfer = typeof wormholeNativeTokenTransferLayout;

export const namedPayloads = [
  ["Transfer", wormholeNativeTokenTransferLayout],
] as const satisfies NamedPayloads;

// factory registration:
declare global {
  namespace Wormhole {
    interface PayloadLiteralToLayoutMapping
      extends RegisterPayloadTypes<"NTT", typeof namedPayloads> {}
  }
}

registerPayloadTypes("NTT", namedPayloads);
