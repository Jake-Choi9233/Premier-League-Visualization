// sunburst.js
import { typeWriter, colors } from './utils.js'
import {
  currentFilters,
  pointFilters,
  initializeFilters,
  checkPlayerFilters
} from './filters.js'

const sunburstWidth = 600
const sunburstRadius = sunburstWidth / 2

const sunburstColor = d3.scaleOrdinal(d3.schemeCategory10)

const sunburstSvg = d3
  .select('#sunburst-container')
  .append('svg')
  .attr('width', sunburstWidth)
  .attr('height', sunburstWidth)
  .append('g')
  .attr('transform', `translate(${sunburstRadius},${sunburstRadius})`)

let sunburstAllData = []

function getGradientColor (pos, conColor, maxConColor) {
  if (!colors[pos] || !colors[pos].gradient) {
    // 如果是单个球队视图，使用更浅的基础颜色
    if (currentFilters.team !== 'ALL') {
      return colors[pos]?.lightBase || '#ccc'
    }
    return colors[pos]?.base || '#ccc'
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

// 读取数据
function loadSunburstData () {
  d3.csv('con_merge_rank_s.csv').then(data => {
    sunburstAllData = data
    // 计算排名
    const sorted = [...data].sort(
      (a, b) => parseFloat(b.contribution) - parseFloat(a.contribution)
    )
    sorted.forEach((player, idx) => {
      player.rank = idx + 1
    })

    // 初始化所有过滤器的事件监听
    initializeFilters(drawSunburst)

    // 初始绘制
    drawSunburst()
  })
}

function buildSunburstHierarchy (data) {
  // 只过滤球队
  let filtered =
    currentFilters.team === 'ALL'
      ? data
      : data.filter(d => d.Squad === currentFilters.team)

  // 构建层级结构：root -> Pos -> Player
  const root = { name: 'root', children: [] }
  const posMap = {}
  filtered.forEach(d => {
    if (!posMap[d.Pos]) {
      posMap[d.Pos] = { name: d.Pos, children: [], color: sunburstColor(d.Pos) }
      root.children.push(posMap[d.Pos])
    }
    posMap[d.Pos].children.push({ ...d, name: d.Player })
  })
  return root
}

function drawSunburst () {
  sunburstSvg.selectAll('*').remove()

  const root = d3
    .hierarchy(buildSunburstHierarchy(sunburstAllData))
    .sum(d => (d.children ? 0 : 1))

  // 检查是否有数据
  if (!root.children || root.children.length === 0) {
    console.log('No data to display')
    return
  }

  d3.partition().size([2 * Math.PI, sunburstRadius])(root)

  // 画弧
  const arc = d3
    .arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0 - 40)
    .outerRadius(d => d.y1)

  // 画内层（Pos）
  sunburstSvg
    .selectAll('path.pos')
    .data(root.descendants().filter(d => d.depth === 1))
    .enter()
    .append('path')
    .attr('class', 'pos')
    .attr('d', arc)
    .attr('fill', d => {
      if (currentFilters.team === 'ALL') {
        return colors[d.data.name]?.base || '#ccc'
      }
      return colors[d.data.name]?.lightBase || '#ccc'
    })
    .attr('stroke', '#fff')

  // 内环文字（Pos）
  sunburstSvg
    .selectAll('text.pos')
    .data(root.descendants().filter(d => d.depth === 1))
    .enter()
    .append('text')
    .attr('class', 'pos')
    .attr('transform', function (d) {
      const angle = (((d.x0 + d.x1) / 2) * 180) / Math.PI - 90
      const r = (d.y0 + d.y1) / 2
      return `rotate(${angle}) translate(${r - 50},0) rotate(${angle > 90 ? 180 : 0})`
    })
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text(d => d.data.name)
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')

  // 计算每个pos下最大Con_color
  const posMaxConColor = {}
  root.children.forEach(posNode => {
    if (posNode.children && posNode.children.length > 0) {
      posMaxConColor[posNode.data.name] = Math.max(
        ...posNode.children.map(p => parseFloat(p.data.Con_color) || 0)
      )
    } else {
      posMaxConColor[posNode.data.name] = 0
    }
  })

  // 画外层（Player）
  const playerPaths = sunburstSvg
    .selectAll('path.player')
    .data(root.descendants().filter(d => d.depth === 2))
    .enter()
    .append('path')
    .attr('class', 'player')
    .attr('d', arc)
    .attr('fill', d => {
      const pos = d.parent.data.name
      const conColor = parseFloat(d.data.Con_color) || 0
      const maxConColor = posMaxConColor[pos] || 1
      return getGradientColor(pos, conColor, maxConColor)
    })
    .attr('stroke', '#fff')
    .style('cursor', 'pointer')
    .style('opacity', d => {
      // 如果球员满足筛选条件，保持完全不透明，否则变暗
      const isVisible = checkPlayerFilters(d.data)
      console.log(
        `Player ${d.data.Player} (${d.data.Pos}) visibility: ${isVisible}, position filter: ${currentFilters.position}`
      )
      return isVisible ? 1 : 0.3
    })
    .style('transition', 'opacity 0.3s ease')
    .on('click', (event, d) => {
      if (!d.children) {
        // 先移除之前的高亮效果
        removeHighlight()
        // 显示新的高亮效果
        highlightPlayer(d.data.Player)
        // 显示信息面板
        showSunburstPlayerInfo(d.data)
        event.stopPropagation()
      }
    })

  // 画球员名字（外层）
  sunburstSvg
    .selectAll('text.player')
    .data(root.descendants().filter(d => d.depth === 2))
    .enter()
    .append('text')
    .attr('class', 'player')
    .attr('transform', function (d) {
      const angle = (((d.x0 + d.x1) / 2) * 180) / Math.PI - 90
      const r = (d.y0 + d.y1) / 2
      return `rotate(${angle}) translate(${r - 20},0) rotate(${angle > 90 ? 180 : 0})`
    })
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text(d => d.data.Player)
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', d => {
      // 如果球员满足筛选条件，保持完全不透明，否则变暗
      return checkPlayerFilters(d.data) ? 1 : 0.3
    })
    .style('transition', 'opacity 0.3s ease')

  // 圆心logo
  let squadPic =
    currentFilters.team === 'ALL'
      ? 'https://cdn.ssref.net/req/202505011/tlogo/fb/9.png'
      : sunburstAllData.find(d => d.Squad === currentFilters.team)
          ?.Squad_picture

  if (squadPic) {
    sunburstSvg
      .append('image')
      .attr('xlink:href', squadPic)
      .attr('x', -sunburstRadius * 0.12)
      .attr('y', -sunburstRadius * 0.12)
      .attr('width', sunburstRadius * 0.24)
      .attr('height', sunburstRadius * 0.24)
  }

  // 点击空白关闭旭日图 info-panel
  if (!window._sunburstPanelClickListener) {
    document.addEventListener('click', function (e) {
      const infoPanel = document.getElementById('info-panel')
      if (!infoPanel) return
      // 只在 sunburst-page 区域内点击空白时关闭
      const sunburstPage = document.getElementById('sunburst-page')
      if (sunburstPage && sunburstPage.contains(e.target)) {
        if (!e.target.closest('.player-info')) {
          hideSunburstPlayerInfo()
        }
      }
    })
    window._sunburstPanelClickListener = true
  }

  // drawSunburst 结束时默认隐藏 info-panel
  hideSunburstPlayerInfo()
}

// 旭日图 info-panel 显示/隐藏逻辑
function showSunburstPlayerInfo (player) {
  const infoPanel = document.getElementById('info-panel')
  if (!infoPanel) return
  infoPanel.style.display = 'block'

  let infoHTML = `
            <div class="player-info">
                <img src="${player.Picture}" alt="${player.Player}" onerror="this.src='fb.jpg'">
                <h3 id="sb-typing-name"></h3>
                <p id="sb-typing-position"></p>
                <p id="sb-typing-team"></p>
        `
  // 统计信息（可根据原 info-panel 逻辑扩展）
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
      infoHTML += `<p id="sb-typing-${stat.key}"></p>`
    }
  })
  infoHTML += '</div>'
  infoPanel.innerHTML = infoHTML

  // 依次显示信息
  async function displayInfo () {
    const nameElement = document.getElementById('sb-typing-name')
    const positionElement = document.getElementById('sb-typing-position')
    const teamElement = document.getElementById('sb-typing-team')

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
        const element = document.getElementById(`sb-typing-${stat.key}`)
        if (element) {
          await typeWriter(element, `${stat.label}: ${value}`)
        }
      }
    }
  }

  displayInfo()
}

function hideSunburstPlayerInfo () {
  const infoPanel = document.getElementById('info-panel')
  if (infoPanel) infoPanel.style.display = 'none'

  // 移除高亮效果
  removeHighlight()
}

// 添加高亮效果函数
function highlightPlayer (playerName) {
  // 将所有球员路径设置为半透明
  sunburstSvg
    .selectAll('path.player')
    .style('opacity', 0.3)
    .style('transition', 'opacity 0.3s ease')

  // 将选中的球员路径设置为完全不透明
  sunburstSvg
    .selectAll('path.player')
    .filter(d => d.data.Player === playerName)
    .style('opacity', 1)
    .style('transition', 'opacity 0.3s ease')

  // 将所有球员文字设置为半透明
  sunburstSvg
    .selectAll('text.player')
    .style('opacity', 0.3)
    .style('transition', 'opacity 0.3s ease')

  // 将选中的球员文字设置为完全不透明
  sunburstSvg
    .selectAll('text.player')
    .filter(d => d.data.Player === playerName)
    .style('opacity', 1)
    .style('transition', 'opacity 0.3s ease')
}

// 移除高亮效果函数
function removeHighlight() {
  // 恢复所有球员路径的透明度，但保持过滤器的效果
  sunburstSvg.selectAll('path.player')
    .style('opacity', d => checkPlayerFilters(d.data) ? 1 : 0.3)
    .style('transition', 'opacity 0.3s ease')

  // 恢复所有球员文字的透明度，但保持过滤器的效果
  sunburstSvg.selectAll('text.player')
    .style('opacity', d => checkPlayerFilters(d.data) ? 1 : 0.3)
    .style('transition', 'opacity 0.3s ease')
}

// 初始化
if (document.getElementById('sunburst-container')) {
  loadSunburstData()
}
