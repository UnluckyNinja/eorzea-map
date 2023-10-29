import { Circle, CircleOptions, Icon, Marker, Point, Polygon, Polyline, PolylineOptions, Rectangle } from 'leaflet'
import { fromMapCoordinate2D, fromMapXY2D, toMapXY2D } from '../coordinate'
import { IMapInfo } from '../loader'
import { xy } from '../XYPoint'

const ICON_WIDTH = 32
const ICON_HEIGHT = 32

export function createIcon(
  x: number,
  y: number,
  iconUrl: string,
  mapInfo: IMapInfo,
  tooltip?: string,
) {
  const icon = new Icon({
    iconSize: new Point(ICON_WIDTH, ICON_HEIGHT),
    iconUrl,
  })

  const marker = new Marker(xy(fromMapXY2D(mapInfo, x, y)), {
    icon,
    zIndexOffset: 1000,
    pane: 'popupPane',
  })

  if (tooltip) {
    marker.bindTooltip(tooltip,{
      permanent: true,
    })
  }

  return marker
}

export function createIconFrom3D(
  x: number,
  y: number,
  iconUrl: string,
  mapInfo: IMapInfo,
  tooltip?: string,
) {
  ;[x, y] = toMapXY2D(mapInfo, x, y)

  return createIcon(x, y, iconUrl, mapInfo, tooltip)
}

export function createText(
  x: number,
  y: number,
  text: string,
  mapInfo: IMapInfo,
) {
  // TODO
}

export function createCircle(
  x: number,
  y: number,
  radius: number,
  mapInfo: IMapInfo,
  options: Partial<CircleOptions> = {}
) {
  const marker = new Circle(xy(fromMapXY2D(mapInfo, x, y)), {
    radius: fromMapCoordinate2D(radius+1, mapInfo.sizeFactor, 0),
    ...options,
  })

  return marker
}

export function createRectangle(
  points: [[number,number],[number,number]],
  mapInfo: IMapInfo,
  options: Partial<PolylineOptions> = {}
) {
  const _points = points.map(point=>xy(fromMapXY2D(mapInfo, point[0], point[1])))
  const marker = new Rectangle(_points, {
    ...options,
  })

  return marker
}

export function createPolyline(
  path: [number,number][],
  mapInfo: IMapInfo,
  options: Partial<PolylineOptions> = {}
) {
  const _path = path.map(point=>xy(fromMapXY2D(mapInfo, point[0], point[1])))
  const marker = new Polyline(_path, {
    ...options,
  })

  return marker
}

export function createPolygon(
  path: [number,number][],
  mapInfo: IMapInfo,
  options: Partial<PolylineOptions> = {}
) {
  const _path = path.map(point=>xy(fromMapXY2D(mapInfo, point[0], point[1])))
  const marker = new Polygon(_path, {
    ...options,
  })

  return marker
}