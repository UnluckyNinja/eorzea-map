/* Eorzea Map Loader - By [[用户:云泽宛风]] */

;(function() {
  /* globals $, mw */
  var map, eorzea, loadingArguments, loadingError, $loading, $mapContainer
  var regionMap = {}
  var MARKER_URL =
    'https://huiji-public.huijistatic.com/ff14/uploads/e/e6/Map_mark.png'

  window.YZWF = window.YZWF || {}
  window.YZWF.setupMap = function() {
    loadModules(initMap)
  }

  if ($('#wiki-body .eorzea-map-trigger').length > 0) {
    loadModules(initMap)
    delegateEvents()
    var $openEls = $('#wiki-body .eorzea-map-trigger[data-map-open="true"]')
    if ($openEls.length > 0) {
      $openEls.eq(0).click()
    }
  }

  function delegateEvents() {
    $('#wiki-body').on('click', '.eorzea-map-trigger', function() {
      var mapId = $(this).data('map-id')
      var mapName = $(this).data('map-name')
      var mapX = $(this).data('map-x')
      var mapY = $(this).data('map-y')
      if (map) {
        loadMap(mapId, mapName, mapX, mapY)
      } else {
        showLoading($(this), [mapId, mapName, mapX, mapY])
      }
    })
    $('#wiki-body').on('click', '.eorzea-map-group-show-all', function() {
      var $group = $(this).parents('.eorzea-map-group')
      if (!$group.length) {
        alert('没有找到坐标组；或许是模板使用不正确？')
        return
      }
      var $triggers = $group.find('.eorzea-map-trigger')
      var mapName = ''
      var coords = []
      $triggers.each(function() {
        mapName = $(this).data('map-name')
        coords.push([$(this).data('map-x'), $(this).data('map-y')])
      })
      loadMap(null, mapName).then(function() {
        for (var i = 0; i < coords.length; i++) {
          addFlag(map, coords[i][0], coords[i][1])
        }
      })
    })
  }

  function loadModules(callback) {
    mw.loader.using(
      [
        'ext.gadget.Dom4',
        'ext.gadget.babel-polyfill',
        'ext.gadget.Md5',
        'ext.gadget.EorzeaMap'
      ],
      function() {
        callback(window.YZWF.eorzeaMap)
      },
      console.error
    )
  }

  function showLoading($el, mapArugments) {
    if (!$loading) {
      createLoading()
    }
    if (loadingError) {
      if (confirm('地图加载失败，是否重试？')) {
        loadModules(initMap)
      } else {
        return
      }
    }
    $loading
      .find('.eorzea-map-loading-text')
      .text('正在加载 ' + $el.text() + ' 的地图…')
    $loading.appendTo('body')
    loadingArguments = mapArugments
  }

  function createLoading() {
    $loading = $(
      '<div class="eorzea-map-loading"><div class="ff14-loading"></div><div class="eorzea-map-loading-text"></div></div>'
    )

    $loading.click(function() {
      closeLoding()
    })
  }

  function closeLoding() {
    $loading.remove()
    loadingArguments = null
  }

  function initMap(eorzeaMap) {
    eorzea = eorzeaMap
    setHuijiDataUrls(eorzeaMap)

    eorzea.getRegion().then(function(regions) {
      for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].maps.length; j++) {
          var meta = regions[i].maps[j]
          if (meta.subName) {
            regionMap[meta.name + ',' + meta.subName] = meta.key
          } else {
            regionMap[meta.name] = meta.key
          }
        }
      }
      window.YZWF.loadMap = loadMap
    })

    $mapContainer = $(
      [
        '<section class="erozea-map-outer">',
        '<div class="eorzea-map-glass"></div>',
        '<div class="eorzea-map-move-handler"></div>',
        '<div class="eorzea-map-close-button">关闭</div>',
        '<div class="eorzea-map-inner"></div>',
        '<div class="eorzea-map-resize-handler"></div>',
        '</section>'
      ].join('')
    )
    if (window.innerHeight < 500 || window.innerWidth < 500) {
      // 判定为手机，半屏走起，并且禁用移动功能
      $mapContainer.css({
        top: '20%',
        left: 0,
        width: '100%',
        height: '80%'
      })
      $mapContainer.addClass('eorzea-map-fixed-window')
    } else {
      if (localStorage && localStorage.YZWFEorzeaMapPos) {
        var pos = localStorage.YZWFEorzeaMapPos.split(',')
        if (pos.length === 2) {
          $mapContainer.css({
            top: pos[0] + 'px',
            left: pos[1] + 'px'
          })
        }
      }
      if (localStorage && localStorage.YZWFEorzeaMapSize) {
        var size = localStorage.YZWFEorzeaMapSize.split(',')
        if (size.length === 2) {
          $mapContainer.css({
            width: size[0] + 'px',
            height: size[1] + 'px'
          })
        }
      }
      mapMover($mapContainer.find('.eorzea-map-move-handler'), $mapContainer)
      mapResizer(
        $mapContainer.find('.eorzea-map-resize-handler'),
        $mapContainer
      )
    }
    $mapContainer.find('.eorzea-map-close-button').click(closeMap)
    $mapContainer.appendTo('body')
    eorzeaMap
      .create($mapContainer.find('.eorzea-map-inner')[0])
      .then(function(mapInstance) {
        $mapContainer.css({
          display: 'none',
          visibility: 'visible'
        })
        map = mapInstance
        if (loadingArguments) {
          loadMap.apply(this, loadingArguments)
          closeLoding()
        }
      })
      ['catch'](function(err) {
        loadingError = err
        if (loadingArguments) {
          alert('地图加载失败，原因：' + err.message)
          closeLoding()
        }
        throw err
      })
  }

  function setHuijiDataUrls(eorzeaMap) {
    eorzeaMap.setApiUrl(
      'https://cdn.huijiwiki.com/ff14/index.php?title=Data:EorzeaMap/%s&action=raw'
    )
    var oldGetUrl = eorzeaMap.AdvancedTileLayer.prototype.getTileUrl
    eorzeaMap.AdvancedTileLayer.prototype.getTileUrl = function() {
      var tile = oldGetUrl.apply(this, arguments)
      var filename =
        'EorzeaMapTile_' + tile.match(/tiles\/(.*)$/)[1].replace(/\//g, '_')
      return getHuijiUrl(filename)
    }
    eorzeaMap.loader.setUrlFunction('getBgUrl', function() {
      return getHuijiUrl('EorzeaMapAssets_bg.jpg')
    })
    eorzeaMap.loader.setUrlFunction('getIconUrl', function(x, i) {
      return getHuijiUrl(i + '.png')
    })
  }

  function loadMap(mapKey, mapName, x, y) {
    if (!mapKey && mapName) {
      mapKey = regionMap[mapName]
    }
    if (!mapKey) {
      alert('没有找到地图: ' + mapName + '，请检查拼写或地图名字')
      return
    }
    $mapContainer.show()
    return map
      .loadMapKey(mapKey)
      .then(function() {
        if (x && y) {
          addFlag(map, x, y, true)
        }
      })
      ['catch'](function(e) {
        console.error(e)
      })
  }

  function addFlag(map, x, y, pan) {
    var marker = eorzea.simpleMarker(x, y, MARKER_URL, map.mapInfo)
    marker.addTo(map)
    map.markers.push(marker) // 保证地图切换时清空标记
    if (pan) {
      setTimeout(function() {
        map.panTo(map.mapToLatLng2D(x, y))
      }, 0)
    }
  }

  function closeMap() {
    $mapContainer.hide()
  }

  function mapMover($handler, $container) {
    drag($handler, {
      down: function() {},
      move: function(opts) {
        var translate = '(' + opts.diffX + 'px, ' + opts.diffY + 'px, 0)'
        $container.css({
          transform: 'translate3d' + translate
        })
      },
      up: function() {
        var pos = $container.position()
        $container.css({
          top: pos.top,
          left: pos.left,
          transform: 'none'
        })
        if (localStorage) {
          localStorage.YZWFEorzeaMapPos = pos.top + ',' + pos.left
        }
      }
    })
  }

  function mapResizer($handler, $container) {
    var height, width
    drag($handler, {
      down: function() {
        height = $container.height()
        width = $container.width()
      },
      move: function(opts) {
        $container.height(height + opts.diffY)
        $container.width(width + opts.diffX)
      },
      up: function(opts) {
        map.invalidateSize()
        if (localStorage) {
          localStorage.YZWFEorzeaMapSize =
            width + opts.diffX + ',' + (height + opts.diffY)
        }
      }
    })
  }

  function drag($handler, callbacks) {
    var isDragging = false
    var startX, startY
    $handler.on('mousedown pointerdown touchdown', function(event) {
      event.preventDefault()
      isDragging = true
      startX = event.clientX
      startY = event.clientY
      callbacks.down({
        startX: startX,
        startY: startY
      })
    })
    $(window).on('mousemove pointermove touchmove', function(event) {
      if (!isDragging) {
        return
      }
      event.preventDefault()
      var diffX = event.clientX - startX
      var diffY = event.clientY - startY
      callbacks.move({
        diffX: diffX,
        diffY: diffY
      })
    })
    $(window).on('mouseup pointerup touchup', function(event) {
      if (!isDragging) {
        return
      }
      isDragging = false
      event.preventDefault()
      var diffX = event.clientX - startX
      var diffY = event.clientY - startY
      callbacks.up({
        diffX: diffX,
        diffY: diffY
      })
    })
  }

  function getHuijiUrl(filename) {
    var hex = window.YZWF.md5(filename)
    return [
      'https://huiji-public.huijistatic.com/ff14/uploads',
      hex[0],
      hex[0] + hex[1],
      filename
    ].join('/')
  }
})()
