import { typeWriter } from './utils.js'
import {
  currentFilters,
  pointFilters,
  initializeFilters,
  checkPlayerFilters
} from './filters.js'
// 初始化场景、相机和渲染器
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('container').appendChild(renderer.domElement)

// 创建射线检测器和鼠标位置变量
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// 创建全局变量
let sphere
let playerPositions = new Map()
let selectedPlayer = null

// 创建信息面板
const infoPanel = document.getElementById('info-panel')

// 设置相机位置
camera.position.z = 15

// 存储所有球员数据
let allPlayers = []

// 计算并写入球员贡献度排名
function updateContributionRank (players) {
  // 按contribution降序排序
  const sorted = [...players].sort(
    (a, b) => parseFloat(b.contribution) - parseFloat(a.contribution)
  )
  sorted.forEach((player, idx) => {
    player.rank = idx + 1
  })
}

// 更新点过滤器选项
function updatePointFilter (position) {
  const pointFilter = document.getElementById('point-filter')
  pointFilter.innerHTML = ''

  const options = pointFilters[position] || ['ALL']
  options.forEach(option => {
    const optionElement = document.createElement('option')
    optionElement.value = option
    optionElement.textContent = option
    pointFilter.appendChild(optionElement)
  })
}

// 修改应用过滤器的函数
function applyFilters () {
  // 首先根据当前选择的球队过滤
  let filteredPlayers = allPlayers
  if (currentFilters.team !== 'ALL') {
    filteredPlayers = allPlayers.filter(
      player => player.Squad === currentFilters.team
    )
  }

  // 计算排名
  updateContributionRank(filteredPlayers)

  // 更新所有球员的位置，使用共享的过滤器检查
  updatePlayerPositions(filteredPlayers)
}

// 修改球队选择的事件监听器
document.getElementById('team-select').addEventListener('change', function (e) {
  currentFilters.team = e.target.value
  if (currentFilters.team) {
    // 当球队改变时，重新应用所有过滤器
    applyFilters()
  }
})

// 修改位置过滤器的事件监听器
document
  .getElementById('position-filter')
  .addEventListener('change', function (e) {
    currentFilters.position = e.target.value
    // 更新点过滤器选项
    updatePointFilter(e.target.value)
    // 重置点过滤器为ALL
    currentFilters.point = 'ALL'
    document.getElementById('point-filter').value = 'ALL'
    // 应用过滤器
    applyFilters()
  })

// 修改点过滤器的事件监听器
document
  .getElementById('point-filter')
  .addEventListener('change', function (e) {
    currentFilters.point = e.target.value
    applyFilters()
  })

// 修改贡献度过滤器的事件监听器
document
  .getElementById('min-contribution')
  .addEventListener('change', function (e) {
    currentFilters.minContribution = parseFloat(e.target.value)
    applyFilters()
  })

document
  .getElementById('max-contribution')
  .addEventListener('change', function (e) {
    currentFilters.maxContribution = parseFloat(e.target.value)
    applyFilters()
  })

// 监听贡献度排名输入框
const minRankInput = document.getElementById('min-rank')
const maxRankInput = document.getElementById('max-rank')
if (minRankInput && maxRankInput) {
  minRankInput.addEventListener('change', function (e) {
    minRank = parseInt(e.target.value) || 1
    applyFilters()
  })
  maxRankInput.addEventListener('change', function (e) {
    maxRank = parseInt(e.target.value) || 100
    applyFilters()
  })
}

// 修改加载CSV数据后的处理
d3.csv('con_merge_rank_s.csv').then(data => {
  allPlayers = data

  // 获取所有球队
  const teams = [...new Set(data.map(d => d.Squad))]

  // 填充球队选择下拉框
  const teamSelect = document.getElementById('team-select')

  // 添加ALL选项
  const allOption = document.createElement('option')
  allOption.value = 'ALL'
  allOption.textContent = 'ALL Teams'
  teamSelect.appendChild(allOption)

  teams.forEach(team => {
    const option = document.createElement('option')
    option.value = team
    option.textContent = team
    teamSelect.appendChild(option)
  })

  // 默认选择ALL
  currentFilters.team = 'ALL'
  teamSelect.value = currentFilters.team

  // 初始化点过滤器
  updatePointFilter('ALL')

  // 初始化所有过滤器的事件监听
  initializeFilters(applyFilters)

  // 应用初始过滤器
  applyFilters()
})

// 添加选中球员的状态变量
let selectedPlayerName = null

const latitudeRanges = {
  FW: { start: -70, end: -20 }, // 南纬30-60度
  MF: { start: -20, end: 20 }, // 南纬0-30度
  DF: { start: 20, end: 60 }, // 北纬0-30度
  GK: { start: 60, end: 90 } // 北纬30-60度
}
const colors = {
  FW: {
    base: '#FFB6C1', // 浅粉色
    gradient: ['#FFB6C1', '#8B0000'], // 从浅粉色到深红色
    lightBase: '#FFB6C1', // 浅粉色
    lightGradient: ['#FFB6C1', '#FF0000'] // 从浅粉色到红色
  },
  MF: {
    base: '#FFD700', // 浅黄色
    gradient: ['#FFD700', '#008000'], // 从浅黄色到深绿色
    lightBase: '#FFD700', // 浅黄色
    lightGradient: ['#FFD700', '#00FF00'] // 从浅黄色到绿色
  },
  DF: {
    base: '#87CEEB', // 浅蓝色
    gradient: ['#87CEEB', '#4B0082'], // 从浅蓝色到靛蓝色
    lightBase: '#87CEEB', // 浅蓝色
    lightGradient: ['#87CEEB', '#800080'] // 从浅蓝色到紫色
  },
  GK: {
    base: '#8B4513', // 棕色
    lightBase: '#8B4513' // 浅蓝色
  }
}
// 计算颜色渐变
function getGradientColor (pos, conColor, maxConColor) {
  if (!colors[pos].gradient) {
    // 如果是单个球队视图，使用更浅的基础颜色
    if (currentFilters.team !== 'ALL') {
      return colors[pos].lightBase
    }
    return colors[pos].base
  }

  const ratio = conColor / maxConColor

  // 如果是单个球队视图，使用更浅的渐变色
  if (currentFilters.team !== 'ALL') {
    const [startColor, endColor] = colors[pos].lightGradient
    const startRGB = hexToRgb(startColor)
    const endRGB = hexToRgb(endColor)

    const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * ratio)
    const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * ratio)
    const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * ratio)

    return `rgb(${r}, ${g}, ${b})`
  }

  // ALL 视图使用原来的渐变色
  const [startColor, endColor] = colors[pos].gradient
  const startRGB = hexToRgb(startColor)
  const endRGB = hexToRgb(endColor)

  const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * ratio)
  const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * ratio)
  const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

// 将十六进制颜色转换为RGB
function hexToRgb (hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 200, g: 200, b: 200 }
}

// 解析纬度范围字符串
function parseLatitudeRange (latRangeStr) {
  if (!latRangeStr) return null

  // 分割范围字符串
  const [startStr, endStr] = latRangeStr.split('-')

  // 解析起始纬度
  const startMatch = startStr.match(/(\d+)°([NS])/)
  const endMatch = endStr.match(/(\d+)°([NS])/)

  if (!startMatch || !endMatch) return null

  // 转换为数值
  let start = parseInt(startMatch[1])
  let end = parseInt(endMatch[1])

  // 处理南纬（S）为负值
  if (startMatch[2] === 'N') start = -start
  if (endMatch[2] === 'N') end = -end

  return { start, end }
}

// 更新球员位置
async function updatePlayerPositions (players) {
  // 清除现有的球体
  scene.children.forEach(child => {
    scene.remove(child)
  })
  playerPositions.clear()

  // 创建球体几何体
  const sphereGeometry = new THREE.SphereGeometry(5, 64, 64)

  // 创建纹理画布
  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = 2048
  textureCanvas.height = 1024
  const ctx = textureCanvas.getContext('2d')

  // 填充背景
  ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height)

  // 绘制网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1

  // 绘制经线
  for (let i = 0; i <= 360; i += 30) {
    const x = (i / 360) * textureCanvas.width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, textureCanvas.height)
    ctx.stroke()
  }

  // 绘制纬线
  for (let i = -60; i <= 60; i += 10) {
    const y = ((90 - i) / 180) * textureCanvas.height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(textureCanvas.width, y)
    ctx.stroke()
  }

  // 创建纹理
  const texture = new THREE.CanvasTexture(textureCanvas)
  const sphereMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9
  })

  sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  scene.add(sphere)

  if (currentFilters.team === 'ALL') {
    // 在ALL模式下，按纬度带分组
    const latitudeBands = new Map()

    // 首先收集所有不同的纬度带
    players.forEach(player => {
      const latRange = parseLatitudeRange(player.all_latitude)
      if (latRange) {
        const bandKey = `${latRange.start}-${latRange.end}`
        if (!latitudeBands.has(bandKey)) {
          latitudeBands.set(bandKey, {
            range: latRange,
            players: []
          })
        }
        latitudeBands.get(bandKey).players.push(player)
      }
    })

    // 对每个纬度带单独处理
    for (const [bandKey, bandData] of latitudeBands) {
      const { range, players } = bandData

      // 计算这个纬度带内球员的贡献度最大值
      const maxConColor = Math.max(...players.map(p => parseFloat(p.Con_color)))

      // 计算总经度贡献
      const totalConLongitude = players.reduce((sum, p) => sum + parseFloat(p.Con_longitude), 0)

      // 从0度开始，依次分配经度范围
      let currentLongitude = 0

      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const conColor = parseFloat(player.Con_color)
        const conLongitude = parseFloat(player.Con_longitude)

        // 计算球员的经度范围
        const longitudeRange = (conLongitude / totalConLongitude) * 360
        const startLongitude = currentLongitude
        const endLongitude = startLongitude + longitudeRange

        // 计算中心经度
        const centerLongitude = startLongitude + longitudeRange / 2

        // 计算球员在球体上的位置
        const longitudeRad = centerLongitude * (Math.PI / 180)
        const latitude = ((range.start + range.end) / 2) * (Math.PI / 180)

        // 将球坐标转换为UV坐标
        const u = (longitudeRad + Math.PI) / (2 * Math.PI)
        const v = (latitude + Math.PI / 2) / Math.PI

        // 计算颜色
        const color = getGradientColor(player.Pos, conColor, maxConColor)

        // 存储球员位置信息
        playerPositions.set(player.Player, {
          u,
          v,
          size: (60 + (conColor / maxConColor) * 60) / textureCanvas.width,
          player,
          color,
          longitude: centerLongitude,
          longitudeRange: {
            start: startLongitude,
            end: endLongitude
          },
          latitudeRange: range
        })

        // 更新下一个球员的起始经度
        currentLongitude = endLongitude
      }
    }
  } else {
    // 非ALL模式下的原有逻辑
    // 按位置分组
    const positions = {
      FW: [], // 前锋
      MF: [], // 中场
      DF: [], // 后卫
      GK: [] // 守门员
    }

    // 将球员按位置分组
    players.forEach(player => {
      if (positions[player.Pos]) {
        positions[player.Pos].push(player)
      }
    })

    // 计算每个位置的贡献度总和和最大值
    const maxConColors = {}
    const totalConLongitudes = {}
    Object.keys(positions).forEach(pos => {
      const conColors = positions[pos].map(p => parseFloat(p.Con_color))
      maxConColors[pos] = Math.max(...conColors)
      totalConLongitudes[pos] = positions[pos].reduce((sum, p) => sum + parseFloat(p.Con_longitude), 0)
    })

    // 为每个位置处理球员
    for (const pos of Object.keys(positions)) {
      const posPlayers = positions[pos]
      const range = latitudeRanges[pos]

      // 从0度开始，依次分配经度范围
      let currentLongitude = 0

      for (let i = 0; i < posPlayers.length; i++) {
        const player = posPlayers[i]
        const conColor = parseFloat(player.Con_color)
        const conLongitude = parseFloat(player.Con_longitude)

        // 计算球员的经度范围
        const longitudeRange = (conLongitude / totalConLongitudes[pos]) * 360
        const startLongitude = currentLongitude
        const endLongitude = startLongitude + longitudeRange

        // 计算中心经度
        const centerLongitude = startLongitude + longitudeRange / 2

        // 计算球员在球体上的位置
        const longitudeRad = centerLongitude * (Math.PI / 180)
        const latitude = ((range.start + range.end) / 2) * (Math.PI / 180)

        // 将球坐标转换为UV坐标
        const u = (longitudeRad + Math.PI) / (2 * Math.PI)
        const v = (latitude + Math.PI / 2) / Math.PI

        // 计算颜色
        const color = getGradientColor(pos, conColor, maxConColors[pos])

        // 存储球员位置信息
        playerPositions.set(player.Player, {
          u,
          v,
          size:
            (60 + (conColor / maxConColors[pos]) * 60) / textureCanvas.width,
          player,
          color,
          longitude: centerLongitude,
          longitudeRange: {
            start: startLongitude,
            end: endLongitude
          },
          latitudeRange: range
        })

        // 更新下一个球员的起始经度
        currentLongitude = endLongitude
      }
    }
  }

  // 在 updateSphereTexture 调用时使用共享的过滤器
  updateSphereTexture()
}

// 更新球体纹理
function updateSphereTexture () {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // 填充背景
  ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1

  // 绘制经线
  for (let i = 0; i <= 360; i += 30) {
    const x = (i / 360) * canvas.width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }

  // 绘制纬线
  for (let i = -60; i <= 60; i += 10) {
    const y = ((90 - i) / 180) * canvas.height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  // 绘制球队logo在北极点
  const squadPicture =
    currentFilters.team === 'ALL'
      ? 'https://cdn.ssref.net/req/202505011/tlogo/fb/9.png'
      : allPlayers.find(p => p.Squad === currentFilters.team)?.Squad_picture

  if (squadPicture) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 计算logo高度：北极到北纬60°
      const logoHeight = canvas.height * (20 / 180) // 1/3高度
      // 横向全铺，纵向只占顶部1/3
      ctx.drawImage(img, 0, 0, canvas.width, logoHeight)

      // 更新纹理
      sphere.material.map = new THREE.CanvasTexture(canvas)
      sphere.material.needsUpdate = true
    }
    img.src = squadPicture
  }

  // 绘制球员
  for (const [name, data] of playerPositions) {
    const player = data.player
    const size = data.size * canvas.width

    // 计算位置和宽度
    let startX = data.longitudeRange.start * (canvas.width / 360)
    let endX = data.longitudeRange.end * (canvas.width / 360)

    // 处理跨越0度经线的情况
    if (endX < startX) {
      endX += canvas.width
    }

    const width = endX - startX
    const x = startX

    // 计算纬度范围对应的画布高度
    const range = data.latitudeRange // 使用存储的纬度范围
    const startY = ((90 + range.start) / 180) * canvas.height
    const endY = ((90 + range.end) / 180) * canvas.height
    const height = endY - startY
    const y = startY

    // 设置透明度
    // 设置透明度
    if (selectedPlayerName === name) {
      // 选中的球员完全不透明
      ctx.globalAlpha = 1
    } else if (selectedPlayerName) {
      // 如果有选中的球员，其他所有球员都半透明
      ctx.globalAlpha = 0.3
    } else {
      // 没有选中球员时，根据过滤条件设置透明度
      ctx.globalAlpha = checkPlayerFilters(data.player) ? 1 : 0.3
    }

    // 绘制背景
    ctx.fillStyle = data.color
    ctx.fillRect(x, y, width, height)

    // 绘制边框
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // 绘制球员名字
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 计算合适的字体大小
    const maxWidth = width * 0.9 // 留出10%的边距
    const maxHeight = height * 0.8 // 留出20%的边距
    let fontSize = Math.min(size / 10, height / 5) // 减小初始字体大小
    ctx.font = `bold ${fontSize}px Arial`

    // 如果名字太长，尝试换行
    const words = player.Player.split(' ')
    if (words.length > 1) {
      // 计算每行最大字符数
      const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6)) // 0.6是字符宽度的估计值

      // 将名字分成多行
      let lines = []
      let currentLine = ''

      for (const word of words) {
        if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + word
        } else {
          if (currentLine) lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) lines.push(currentLine)

      // 如果行数太多，减小字体大小
      while (lines.length * fontSize > maxHeight && fontSize > 10) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px Arial`
      }

      // 绘制多行文本，从上到下排列
      const lineHeight = fontSize * 1.2
      const totalHeight = lines.length * lineHeight
      const startY = y + (height - totalHeight) / 2

      // 反转数组，使名字从上到下排列
      lines.reverse().forEach((line, index) => {
        ctx.fillText(
          line,
          x + width / 2,
          startY + index * lineHeight + fontSize / 2
        )
      })
    } else {
      // 单行文本，调整字体大小以适应宽度
      while (ctx.measureText(player.Player).width > maxWidth && fontSize > 10) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px Arial`
      }
      ctx.fillText(player.Player, x + width / 2, y + height / 2)
    }

    // 重置透明度
    ctx.globalAlpha = 1
  }

  // 更新纹理
  sphere.material.map = new THREE.CanvasTexture(canvas)
  sphere.material.needsUpdate = true
}

// 添加点击事件监听器
window.addEventListener('click', onMouseClick, false)

// 处理鼠标点击事件
function onMouseClick (event) {
  // 如果点击在信息面板上，不处理
  if (event.target === infoPanel || infoPanel.contains(event.target)) {
    return
  }

  // 如果球体不存在，不处理
  if (!sphere) {
    return
  }

  // 1. 将像素坐标转换为归一化设备坐标 (NDC)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1 // [-1, 1]
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1 // [-1, 1]

  // 2. 从NDC创建射线
  raycaster.setFromCamera(mouse, camera)

  // 3. 检查射线与球体的交点
  const intersects = raycaster.intersectObject(sphere)

  if (intersects.length > 0) {
    const point = intersects[0].point // 得到三维空间中的点

    // 4. 将三维点转换为球面坐标
    const radius = 5
    const phi = Math.atan2(point.x, point.z) // 经度角 [-π, π]
    const theta = Math.acos(point.y / radius) // 纬度角 [0, π]

    // 5. 将球面坐标转换为UV坐标
    const u = (phi + (Math.PI * 1) / 2) / (2 * Math.PI) // 经度映射到 [0,1]
    const v = theta / Math.PI // 纬度映射到 [0,1]

    // 6. 将UV坐标转换为经纬度
    const longitude = u * 360 // 经度 [0, 360]
    const latitude = v * 180 - 90 // 纬度 [-90, 90]

    // 查找点击的球员
    let clickedPlayer = null
    let minDistance = Infinity

    for (const [name, data] of playerPositions) {
      // 计算点击位置到球员范围的距离
      let distance = 0

      // 检查经度是否在范围内
      if (data.longitudeRange.end < data.longitudeRange.start) {
        // 处理跨越0度经线的情况
        if (
          longitude >= data.longitudeRange.start ||
          longitude <= data.longitudeRange.end
        ) {
          distance = 0
        } else {
          distance = Math.min(
            Math.abs(longitude - data.longitudeRange.start),
            Math.abs(longitude - data.longitudeRange.end)
          )
        }
      } else {
        if (
          longitude >= data.longitudeRange.start &&
          longitude <= data.longitudeRange.end
        ) {
          distance = 0
        } else {
          distance = Math.min(
            Math.abs(longitude - data.longitudeRange.start),
            Math.abs(longitude - data.longitudeRange.end)
          )
        }
      }

      // 检查纬度是否在范围内
      const latitudeRange = data.latitudeRange
      if (latitude < latitudeRange.start || latitude > latitudeRange.end) {
        distance = Infinity
      }

      // 计算点击位置到球员中心点的距离
      const centerLongitude =
        (data.longitudeRange.start + data.longitudeRange.end) / 2
      const centerLatitude = (latitudeRange.start + latitudeRange.end) / 2

      const longitudeDistance = Math.min(
        Math.abs(longitude - centerLongitude),
        360 - Math.abs(longitude - centerLongitude)
      )
      const latitudeDistance = Math.abs(latitude - centerLatitude)

      // 使用经纬度距离的加权和作为最终距离
      const totalDistance = Math.sqrt(
        longitudeDistance * longitudeDistance +
          latitudeDistance * latitudeDistance
      )

      if (totalDistance < minDistance) {
        minDistance = totalDistance
        clickedPlayer = data.player
        selectedPlayerName = name
      }
    }

    if (clickedPlayer && minDistance < 30) {
      // 设置一个合理的点击阈值
      showPlayerInfo(clickedPlayer)
      // 更新纹理以显示高亮效果，传入空的高亮集合
      updateSphereTexture()
    } else {
      hidePlayerInfo()
      selectedPlayerName = null
      // 更新纹理以恢复所有球员的显示，传入空的高亮集合
      updateSphereTexture()
    }
  } else {
    hidePlayerInfo()
    selectedPlayerName = null
    // 更新纹理以恢复所有球员的显示，传入空的高亮集合
    updateSphereTexture()
  }
}

// 显示球员信息
function showPlayerInfo (player) {
  infoPanel.style.display = 'block'

  // 创建信息HTML
  let infoHTML = `
        <div class="player-info">
            <img src="${player.Picture}" alt="${player.Player}" onerror="this.src='fb.jpg'">
            <h3 id="typing-name"></h3>
            <p id="typing-position"></p>
            <p id="typing-team"></p>
    `

  // 添加非零值的统计信息
  const stats = [
    { key: 'contribution', label: 'Contribution' },
    { key: '90s', label: '90s' },
    { key: 'Aerials Won %', label: 'Aerials Won %' },
    { key: 'Blocks Contribution', label: 'Blocks' },
    { key: 'Clearance Contribution', label: 'Clearances' },
    { key: 'Interception Contribution', label: 'Interceptions' },
    { key: 'Pass Completion %', label: 'Pass Completion %' },
    { key: 'Crosses Completed', label: 'Crosses' },
    { key: 'Progressive Carries', label: 'Progressive Carries' },
    { key: 'Tackles Contribution', label: 'Tackles' },
    { key: 'Touches in Attacking Third', label: 'Attacking Touches' },
    { key: 'Ball Recoveries', label: 'Ball Recoveries' },
    { key: 'Progressive Passes', label: 'Progressive Passes' },
    { key: 'Key Passes', label: 'Key Passes' },
    { key: 'Tackles Won', label: 'Tackles Won' },
    { key: 'Shot-Creating Actions', label: 'Shot-Creating Actions' },
    { key: 'xA', label: 'xA' },
    { key: 'Assists', label: 'Assists' },
    { key: 'Goals', label: 'Goals' },
    {
      key: 'Progressive Passes Received',
      label: 'Progressive Passes Received'
    },
    { key: 'xG', label: 'xG' },
    { key: 'G-xG', label: 'G-xG' }
  ]

  stats.forEach(stat => {
    const value = parseFloat(player[stat.key])
    if (value !== 0 && !isNaN(value)) {
      infoHTML += `<p id="typing-${stat.key}"></p>`
    }
  })

  infoHTML += '</div>'
  infoPanel.innerHTML = infoHTML

  // 依次显示信息
  async function displayInfo () {
    const nameElement = document.getElementById('typing-name')
    const positionElement = document.getElementById('typing-position')
    const teamElement = document.getElementById('typing-team')

    if (nameElement) await typeWriter(nameElement, player.Player)
    if (positionElement)
      await typeWriter(
        positionElement,
        `Position: ${player.Pos} (${player.DPos})`
      )
    if (teamElement) await typeWriter(teamElement, `Team: ${player.Squad}`)

    // 显示非零值的统计信息
    for (const stat of stats) {
      const value = parseFloat(player[stat.key])
      if (value !== 0 && !isNaN(value)) {
        const element = document.getElementById(`typing-${stat.key}`)
        if (element) {
          await typeWriter(element, `${stat.label}: ${value}`)
        }
      }
    }
  }

  displayInfo()
}

// 隐藏球员信息
function hidePlayerInfo () {
  infoPanel.style.display = 'none'
  selectedPlayerName = null
  // 更新纹理以恢复所有球员的显示
  updateSphereTexture()
}

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.minDistance = 5 // 设置最小缩放距离
controls.maxDistance = 20 // 设置最大缩放距离
controls.rotateSpeed = 0.5 // 降低旋转速度

// 动画循环
function animate () {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()

// 处理窗口大小变化
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
