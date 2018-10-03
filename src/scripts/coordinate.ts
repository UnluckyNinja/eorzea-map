import { IMapInfo } from './loader'

// 从 SaintCoinach 抄来的坐标公式
// https://github.com/ufx/SaintCoinach/blob/ad89044a9de0705b5dcf486206da4268d782946a/SaintCoinach/Xiv/Map.cs#L203

export function toMapCoordinate2D(
  value: number,
  sizeFactor: number,
  offset: number
) {
  const c = sizeFactor / 100
  const offsetValue = value + offset
  return (41 / c) * (offsetValue / 2048) + 1
}

// coord = (4100 / sizeFactor) * ((value + offset) / 2048) + 1
// coord - 1 = (4100 / sizeFactor) * (value + offset) / 2048
// (coord - 1) / (4100 / sizeFactor) = (value + offset) / 2048
// ((coord - 1) / (4100 / sizeFactor)) * 2048 - offset = value

export function fromMapCoordinate2D(
  coord: number,
  sizeFactor: number,
  offset: number
) {
  return ((coord - 1) / (4100 / sizeFactor)) * 2048 - offset
}

export function toMapCoordinate3D(
  value: number,
  sizeFactor: number,
  offset: number
) {
  const c = sizeFactor / 100
  const offsetValue = (value + offset) * c
  return (41 / c) * ((offsetValue + 1024) / 2048) + 1
}

export function toMapXY2D(
  mapInfo: IMapInfo,
  x: number,
  y: number
): [number, number] {
  return [
    toMapCoordinate2D(x, mapInfo.sizeFactor, 0),
    toMapCoordinate2D(y, mapInfo.sizeFactor, 0)
  ]
}

export function toMapXY3D(
  mapInfo: IMapInfo,
  x: number,
  y: number
): [number, number] {
  return [
    toMapCoordinate3D(x, mapInfo.sizeFactor, mapInfo['offset{X}']),
    toMapCoordinate3D(y, mapInfo.sizeFactor, mapInfo['offset{Y}'])
  ]
}

export function fromMapXY2D(
  mapInfo: IMapInfo,
  x: number,
  y: number
): [number, number] {
  return [
    fromMapCoordinate2D(x, mapInfo.sizeFactor, mapInfo['offset{X}']),
    fromMapCoordinate2D(y, mapInfo.sizeFactor, mapInfo['offset{Y}'])
  ]
}
