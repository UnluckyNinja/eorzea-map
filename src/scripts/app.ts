import crel from 'crel'
import * as L from 'leaflet'
import '../stylesheets/index.stylus'
import { fromMapXY2D } from './coordinate'
import { EoMap } from './EoMap'
import { initEvents } from './events'
import { getRegion, setApiUrl } from './fetchData'
import { AdvancedTileLayer } from './layers/AdvancedTileLayer'
import * as loader from './loader'
import { initMap } from './map'
import { xy } from './XYPoint'
import { createIcon } from './markers'

const { Icon, Marker, Point } = L

async function create(mapEl: HTMLElement) {
  mapEl.innerHTML = ''
  const map = await initMap(mapEl)
  initEvents(mapEl, map)
  return map
}

async function init() {
  untypedWindow.currentMapKey = 92
  const mapEl = document.querySelector('section.map') as HTMLElement
  const map = await create(mapEl)

  map.on('loadMapKey', (e: any) => {
    untypedWindow.currentMapKey = e.mapKey
    if (location.hash.toString().indexOf('f=mark') < 0) {
      history.replaceState('', '', `#f=area&id=${e.mapKey}`)
    }
  })

  if (!(await loadHash(map))) {
    await map.loadMapKey(untypedWindow.currentMapKey)
  }

  window.addEventListener('hashchange', e => {
    loadHash(map)
  })
}

async function loadHash(map: EoMap) {
  const hash = location.hash.slice(1)
  const args: any = hash
    .split('&')
    .map(item => item.split('='))
    .map(kvpair => kvpair.map(decodeURIComponent))
    .reduce((arg, kvpair) => {
      arg[kvpair[0]] = kvpair[1]
      return arg
    }, {})
  if (args.f === 'area' && args.id) {
    console.log(args.id)
    if (parseInt(args.id) === untypedWindow.currentMapKey) {
      return
    }
    await map.loadMapKey(parseInt(args.id))
    return true
  }
  if (args.f === 'mark' && args.id && args.x && args.y) {
    await map.loadMapKey(parseInt(args.id))
    const marker = simpleMarker(
      args.x,
      args.y,
      loader.getIconUrl('ui/icon/060000/060561.tex'),
      map.mapInfo
    )
    map.addMarker(marker)
    setTimeout(() => {
      map.setView(map.mapToLatLng2D(args.x, args.y), 0)
    }, 100)
    return true
  }
}

function simpleMarker(
  x: number,
  y: number,
  iconUrl: string,
  mapInfo: loader.IMapInfo
) {
  return createIcon(x, y, iconUrl, mapInfo)
}

function setCdnUrl(url: string) {
  setApiUrl(`${url}/data/`)
  loader.setBaseUrl(url)
}

const untypedWindow = window as any

untypedWindow.YZWF = untypedWindow.YZWF || {}

const version = process.env.LIB_VERSION

export {
  create,
  xy,
  L,
  simpleMarker,
  setApiUrl,
  AdvancedTileLayer,
  loader,
  getRegion,
  setCdnUrl,
  version,
  crel
}

export * from './markers'

if (untypedWindow.standaloneEorzeaMap) {
  init().catch(e => console.error(e))
}
