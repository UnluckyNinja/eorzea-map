/* Eorzea Map Loader - By [[用户:云泽宛风]] */

;(function() {
  /* globals $, mw */
  var map, eorzea, loadingError, $loading, $mapContainer
  var postponedLoading = {
    arguments: null,
    callback: null,
  }
  var regionMap = {}
  var icons = {
    flag: 'https://huiji-public.huijistatic.com/ff14/uploads/e/e6/Map_mark.png',
    enemy: 'https://huiji-public.huijistatic.com/ff14/uploads/e/ee/060501.png',
    boss: 'https://huiji-public.huijistatic.com/ff14/uploads/0/0c/060502.png',
    collect: 'https://huiji-public.huijistatic.com/ff14/uploads/6/61/060503.png',
    defend: 'https://huiji-public.huijistatic.com/ff14/uploads/c/ca/060504.png',
    escort: 'https://huiji-public.huijistatic.com/ff14/uploads/e/eb/060505.png',
    chase: 'https://huiji-public.huijistatic.com/ff14/uploads/8/83/060506.png',
    event: 'https://huiji-public.huijistatic.com/ff14/uploads/b/b0/060508.png',

    eureka: 'https://huiji-public.huijistatic.com/ff14/uploads/f/fd/060958.png',

    'bozjan-sm-enemy': 'https://huiji-public.huijistatic.com/ff14/uploads/d/d5/063914.png',
    'bozjan-sm-boss': 'https://huiji-public.huijistatic.com/ff14/uploads/b/ba/063915.png',
    'bozjan-sm-collect': 'https://huiji-public.huijistatic.com/ff14/uploads/9/9b/063916.png',
    'bozjan-sm-defend': 'https://huiji-public.huijistatic.com/ff14/uploads/b/bd/063917.png',
    'bozjan-ce-boss': 'https://huiji-public.huijistatic.com/ff14/uploads/0/03/063909.png',
    'bozjan-ce-duel': 'https://huiji-public.huijistatic.com/ff14/uploads/8/89/063910.png',
    'bozjan-ce-troop': 'https://huiji-public.huijistatic.com/ff14/uploads/5/59/063911.png',
    'bozjan-ce-siege': 'https://huiji-public.huijistatic.com/ff14/uploads/c/c7/063912.png',
  }

  var mapSettedUp = false

  function setupMap() {
    if (mapSettedUp) {
      return
    }
    loadModules(initMap)
    delegateEvents()
    mapSettedUp = true
  }

  window.YZWF = window.YZWF || {}
  window.YZWF.setupMap = setupMap

  if ($('.eorzea-map-trigger').length > 0) {
    setupMap()
    var $openEls = $('.eorzea-map-trigger[data-map-open="true"]')
    if ($openEls.length > 0) {
      $openEls.eq(0).click()
    }
  }

  function delegateEvents() {

    function toParams(ele) {
      var e = $(ele)
      return {
        id: e.data('map-id'),
        name: e.data('map-name'),
        x: e.data('map-x'),
        y: e.data('map-y'),
        type: e.data('map-type'),
        radius: e.data('map-radius'),
        fate: e.data('map-fate'),
      }
    }
    
    function newMarker(options) {
      switch (options.type) {
        case 'quest':
          return createQuest(map, options.x, options.y, options.radius)
        case 'fate':
          return createFate(map, options.x, options.y, options.radius, options.fate)
        case 'leve':
          return createLeve(map, options.x, options.y, options.radius)
        case 'flag':
        default:
          return createFlag(map, options.x, options.y)
      }
    }

    $('body').on('click', '.eorzea-map-trigger', function() {
      var options = toParams(this)
      if (map) {
        loadMap(options.id, options.name).then(function() {
          var marker = newMarker(options)
          addMarker(map, marker, true)
        })
      } else {
        showLoading($(this).text(), [options.id, options.name], function(){
          var marker = newMarker(options)
          addMarker(map, marker, true)
        })
      }
    })
    $('body').on('click', '.eorzea-map-group-show-all', function() {
      var $group = $(this).parents('.eorzea-map-group')
      if (!$group.length) {
        alert('没有找到坐标组；或许是模板使用不正确？')
        return
      }
      var $triggers = $group.find('.eorzea-map-trigger')
      var mapName = ''
      var paramsArray = []
      $triggers.each(function() {
        var params = toParams(this)
        mapName = params.name
        paramsArray.push(params)
      })
      if(map) {
        loadMap(null, mapName).then(function() {
          var markers = paramsArray.map(function(it){return newMarker(it)})
          for (var i = 0; i < markers.length; i++) {
            addMarker(map, markers[i])
          }
          setTimeout(function() {
            var group = window.YZWF.eorzeaMap.L.featureGroup(markers)
            map.fitBounds(group.getBounds(), { maxZoom: -1 })
          }, 0)
        })
      } else {
        showLoading('查看全部', [null, mapName], function(){
          var markers = paramsArray.map(function(it){return newMarker(it)})
          for (var i = 0; i < markers.length; i++) {
            addMarker(map, markers[i])
          }
          setTimeout(function() {
            var group = window.YZWF.eorzeaMap.L.featureGroup(markers)
            map.fitBounds(group.getBounds(), { maxZoom: -1 })
          }, 0)
        })
      }
    })
  }

  function loadModules(callback) {
    trackEvent('load')
    mw.loader.using(
      [
        'ext.gadget.Dom4',
        'ext.gadget.babel-polyfill',
        'ext.gadget.Md5',
        'ext.gadget.EorzeaMap'
      ],
      function() {
        callback(window.YZWF.eorzeaMap)
        trackEvent('load_success')
      },
      function(e) {
        console.error(e)
        trackEvent('load_error', e && e.message)
      }
    )
  }

  function showLoading(text, mapArugments, callback) {
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
      .text('正在加载 ' + text + ' 的地图…')
    $loading.appendTo('body')
    postponedLoading.arguments = mapArugments
    postponedLoading.callback = callback
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
    postponedLoading.arguments = null
    postponedLoading.callback = null
  }

  function initMap(eorzeaMap) {
    eorzea = eorzeaMap
    setHuijiDataUrls(eorzeaMap)

    eorzea.getRegion().then(function(regions) {
      for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].maps.length; j++) {
          var meta = regions[i].maps[j]
          var key = meta.name
          if (!regionMap[key]) {
            regionMap[key] = meta.key
          }
          if (meta.subName) {
            key = meta.name + ',' + meta.subName
          }
          if (!regionMap[key]) {
            regionMap[key] = meta.key
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
          var x = pos[1];
          var y = pos[0];
          // 判断x和y是否超出屏幕
          if (x < 0){
            x = 0;
          }
          if (y < 0){
            y = 0;
          }
          // 如果y比屏幕高度-容器高度还高，则改为屏幕高度-容器高度
          if (y > window.innerHeight - $mapContainer.height()){
            y = window.innerHeight - $mapContainer.height();
          }
          // 如果x比屏幕宽度-容器宽度还宽，则改为屏幕宽度-容器宽度
          if (x > window.innerWidth - $mapContainer.width()){
            x = window.innerWidth - $mapContainer.width();
          }
          $mapContainer.css({
            top: y + 'px',
            left: x + 'px'
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

    // 为范围标记提供的渐变
    // 测试调整标记颜色的工具： https://observablehq.com/d/cd930332a23f9359
    $mapContainer.append($('\
      <div style="width: 0; height: 0; overflow: hidden;">\
        <svg\
          viewBox="0 0 0 0"\
          xmlns="http://www.w3.org/2000/svg"\
          xmlns:xlink="http://www.w3.org/1999/xlink">\
          <defs>\
            <radialGradient id="quest-gradient">\
              <stop offset="10%" stop-color="#ff944222" />\
              <stop offset="50%" stop-color="#ff944222" />\
              <stop offset="95%" stop-color="#ff944246" />\
            </radialGradient>\
            <radialGradient id="fate-gradient">\
              <stop offset="10%" stop-color="#6698d322" />\
              <stop offset="50%" stop-color="#6698d322" />\
              <stop offset="95%" stop-color="#6698d346" />\
            </radialGradient>\
            <radialGradient id="leve-gradient">\
              <stop offset="10%" stop-color="#68bc5722" />\
              <stop offset="50%" stop-color="#68bc5722" />\
              <stop offset="95%" stop-color="#68bc5746" />\
            </radialGradient>\
          </defs>\
          <style>\n\
            .quest, .fate, .leve {\n\
              stroke-linecap: butt;\n\
              stroke-dasharray: 3;\n\
              stroke-width: 3px;\n\
            }\n\
            .quest {\n\
              fill: url("#quest-gradient");\n\
              stroke: #ff7700ff;\n\
            }\n\
            .fate {\n\
              fill: url("#fate-gradient");\n\
              stroke: #6698d3ff;\n\
            }\n\
            .leve {\n\
              fill: url("#leve-gradient");\n\
              stroke: #49b135ff;\n\
            }\n\
          </style>\
        </svg>\
      </div>\
    '))

    $mapContainer.appendTo('body')

    eorzeaMap
      .create($mapContainer.find('.eorzea-map-inner')[0])
      .then(function(mapInstance) {
        $mapContainer.css({
          display: 'none',
          visibility: 'visible'
        })
        map = mapInstance
        if (postponedLoading.arguments) {
          loadMap.apply(this, postponedLoading.arguments).then(postponedLoading.callback || function(){})
          closeLoding()
        }
        trackEvent('load_data_success')
      })
      ['catch'](function(err) {
        loadingError = err
        trackEvent('load_data_error', err && err.message)
        if (postponedLoading.arguments) {
          alert('地图加载失败，原因：' + err.message)
          closeLoding()
        }
        throw err
      })
  }

  function setHuijiDataUrls(eorzeaMap) {
    var isDebug = mw.config.get('debug')
    var baseUrl = isDebug
      ? 'https://ff14.huijiwiki.com'
      : 'https://cdn.huijiwiki.com/ff14'

    eorzeaMap.setApiUrl(
      baseUrl + '/index.php?title=Data:EorzeaMap/%s&action=raw'
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
      trackEvent('map_not_found', mapName)
      alert('没有找到地图: ' + mapName + '，请检查拼写或地图名字')
      return
    }
    trackEvent('open', mapName)
    $mapContainer.show()
    return map
      .loadMapKey(mapKey)
      .then(function() {
        trackEvent('open_success', mapName)
      })
      ['catch'](function(e) {
        console.error(e)
        trackEvent('open_error', e && e.messasge)
      })
  }

  function addMarker(map, marker, pan) {
    marker.addTo(map)
    map.markers.push(marker) // 保证地图切换时清空标记
    if (pan) {
      setTimeout(function() {
        if (marker.getBounds) {
          map.fitBounds(marker.getBounds(), { maxZoom: -1 })
        } else if (marker.getLatLng){
          map.setView(marker.getLatLng(), -1)
        }
      }, 0)
    }
  }

  function createFlag(map, x, y) {
    var marker = eorzea.createIcon(x, y, icons.flag, map.mapInfo)
    return marker
  }

  function createQuest(map, x, y, radius) {
    var marker = eorzea.createCircle(x, y, radius, map.mapInfo, {
      className: 'quest',
      fillOpacity: 1.0
    })
    return marker
  }

  function createFate(map, x, y, radius, type) {
    var iconUrl = icons[type]
    var circle = eorzea.createCircle(x, y, radius, map.mapInfo, {
      className: 'fate',
      fillOpacity: 1.0
    })
    if (!iconUrl) {
      return circle
    }
    var icon = eorzea.createIcon(x, y, iconUrl, map.mapInfo)
    return window.YZWF.eorzeaMap.L.featureGroup([circle, icon])
  }

  function createLeve(map, x, y, radius) {
    var marker = eorzea.createCircle(x, y, radius, map.mapInfo, {
      className: 'leve',
      fillOpacity: 1.0
    })
    return marker
  }

  function closeMap() {
    $mapContainer.hide()
    trackEvent('close')
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
        trackEvent('move_container')
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
        trackEvent('resize_container')
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

  function trackEvent(action, label, value) {
    if (!window._hmt) {
      window._hmt = []
    }
    window._hmt.push(['_trackEvent', 'eorzeaMap', action, label, value])
  }
})()
