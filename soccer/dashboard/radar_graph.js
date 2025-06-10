   function drawTeamLogo(playerName) { // 绘制球员所在队伍的队徽
  svg.selectAll('image.team-logo').remove();

  const rec = currentData.find(d => (d.player || d.Player) === playerName);
  const teamLogo = rec?.squad_img;
  if (!teamLogo) return;

  svg.insert('image', ':first-child')
    .attr('class', 'team-logo')
    .style('filter', 'grayscale(100%)')
    .attr('href', teamLogo)
    .attr('x', -180 * 0.6)
    .attr('y', -180 * 0.6)
    .attr('width', 180 * 2 * 0.6)
    .attr('height', 180 * 2 * 0.6)
    .attr('opacity', 0.3);
}

  function drawRadarBackground(position) {
  // 清除之前绘制的轴线、圆圈和文字
  svg.selectAll('.axis, circle, text').remove();

  // 根据位置决定标签内容（守门员与其他球员不同）
  const labels = position === 'GK'
    ? ['Save','Cross Def','Throw','Pass','Long Kick','Sweeper']
    : ['Shooting','Pass','Defense','Dribble','Stamina','Positioning'];

  const rScale = d3.scaleLinear().domain([0, 100]).range([0, 180]);
  const angleSlice = (2 * Math.PI) / labels.length;

  // 绘制背景的同心圆和数值标签（如果不是初始加载）
  for (let lvl = 0; lvl <= 4; lvl++) {
    const val = lvl * 25;
    svg.append('circle')
      .attr('r', rScale(val))
      .attr('fill', 'none')
      .attr('stroke', '#ccc');

    if (position !== 'All') {
      svg.append('text')
        .attr('x', 0)
        .attr('y', -rScale(val)+6)
        .attr('dy', '-0.3em')
        .attr('fill', 'black')
        .attr('font-size', '11px')
        .text(val);
    }
  }

  // 绘制坐标轴射线
  const axis = svg.selectAll('.axis')
    .data(labels)
    .enter()
    .append('g')
    .attr('class', 'axis');

  axis.append('line')
    .attr('x1', 0).attr('y1', 0)
    .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
    .attr('stroke', '#ccc');

  // 绘制每个维度的标签（仅在选择了具体位置时显示）
  if (position !== 'All') {
    axis.append('text')
      .attr('x', (d, i) => rScale(105) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => rScale(105) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .style('text-anchor', 'middle')
      .style('font-size', '17px')
      .style('fill', '#black')
      .style('font-weight', 'bold');
  }
}



    const svgEl = d3.select('.radarChart').attr('width', 600).attr('height', 600);
    const zoomG = svgEl.append('g').attr('transform', `translate(300, 300)`);
    const svg = zoomG;
    const zoom = d3.zoom()
  .scaleExtent([0.5, 3])
  .on("zoom", (e) => {
    zoomG.attr("transform", e.transform);
  });

svgEl.call(zoom);
const initialTransform = d3.zoomIdentity.translate(300, 300);
    const tooltip = d3.select('#tooltip');


    let currentPosition = 'All';
    let currentData = [];






  function loadDataAndInit(position) { // 加载数据并初始化界面
  currentPosition = position;
  const parseData = (data) => {
    return data.map(player => {
      const converted = {};
      for (const key in player) {
        const val = player[key];
        if (key === 'pos') {
          converted[key] = val;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          converted[key] = (/^[-–]?$/g.test(trimmed) || trimmed === '' || trimmed.toLowerCase() === 'nan' || trimmed.toLowerCase() === 'null')
            ? 0
            : (isNaN(+trimmed) ? trimmed : +trimmed);
        } else {
          converted[key] = isNaN(+val) ? val : +val;
        }
      }
      return converted;
    });
  };

  const parsePlayer = () => {
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('name');
    if (!playerName) return;

    const player = currentData.find(d => (d.player || d.Player) === playerName);
    if (!player) return;

    // 设置第一个筛选器的值
    const team1Sel = d3.select('#team1');
    const pos1Sel = d3.select('#pos1');
    const player1Sel = d3.select('#player1');

    // 设置队伍并触发change事件
    team1Sel.property('value', player.squad || player.Team)
      .dispatch('change')
      .then(() => {
        // 设置位置并触发change事件
        pos1Sel.property('value', player.pos)
          .dispatch('change')
          .then(() => {
            // 设置球员并触发change事件
            player1Sel.property('value', playerName)
              .dispatch('change');
          });
      });
  };

  if (position === 'All') {
    Promise.all([
      d3.json('players_data.json'),
      d3.json('GK_Data.json')
    ]).then(([fpData, gkData]) => {
      currentData = [...parseData(fpData), ...parseData(gkData)];
      initFilters(position);
      parsePlayer();
      drawChart();
    });
  } else {
    const file = position === 'GK' ? 'GK_Data.json' : 'players_data.json';
    d3.json(file).then(data => {
      currentData = parseData(data);
      initFilters(position);
      parsePlayer();
      drawChart();
    });
  }
}

// 在初始化select元素时添加Promise支持
d3.selection.prototype.dispatch = function(typenames) {
  return new Promise(resolve => {
    this.node().dispatchEvent(new Event(typenames));
    setTimeout(resolve, 100); // 确保异步更新完成
  });
};

    function initFilters(position) { // 初始化筛选器选项（队伍、位置、球员）
  const teams = Array.from(new Set(currentData.map(d => d.squad || d.Team))).sort();

  function setup(teamSelId, posSelId, playerSelId) {
    const teamSel = d3.select(teamSelId);
    const posSel = d3.select(posSelId);
    const playerSel = d3.select(playerSelId);


    teamSel.selectAll('option').remove();
    teamSel.append('option').attr('value', '').text('Select Team');
    teams.forEach(t => teamSel.append('option').attr('value', t).text(t));

    const queryStrings = window.location.search
    const params = new URLSearchParams(queryStrings);
    const player_name1 = params.get('name');
    console.log('Player Name 1:', player_name1);
    const player1 = currentData.find(d => (d.player || d.Player) === player_name1) || '#player1';
    const team1 = player1?.squad || '#team1';
    const pos1 = player1?.pos || '#pos1';

    // if (teamSelId === '#team1' && team1 && teams.includes(team1)) {
    //   teamSel.property('value', team1);
    //   // teamSel.on('change')(); // 触发一次变更事件以加载位置和球员
    //   const players = currentData.filter(d => (d.squad || d.Team) === team1);
    //   const player = players.find(d => (d.player || d.Player) === player_name1) || players[0];
    //   const pos = player.pos || player.Pos || 'All';
    //   posSel.property('value', pos);
    //   // posSel.on('change')(); // 触发一次变更事件以加载球员
    //   playerSel.property('value', player.player || player.Player || '');
    //   // playerSel.on('change')(); // 触发一次变更事件以绘制雷达图

    // }


teamSel.on('change', () => {
  const team = teamSel.property('value');
  const players = currentData.filter(d => (d.squad || d.Team) === team);

  const posSet = new Set();
  players.forEach(p => {
    const pos = p.pos;
    if (['GK', 'DF', 'MF', 'FW'].includes(pos)) posSet.add(pos);
  });




if (teamSelId === '#team2') {
  const pos1Val = d3.select('#pos1').property('value');
  if (pos1Val && ['GK', 'DF', 'MF', 'FW'].includes(pos1Val)) {
    const allowed = pos1Val === 'GK' ? ['GK'] : ['DF', 'MF', 'FW'];
    for (let p of posSet) {
      if (!allowed.includes(p)) posSet.delete(p);
    }
  }
}



  posSel.selectAll('option').remove();
  posSel.append('option').attr('value', '').text('Select Position');
  const desiredOrder = ['GK', 'DF', 'MF', 'FW'];
desiredOrder.forEach(p => {
  if (posSet.has(p)) {
    posSel.append('option').attr('value', p).text(p);
  }
});


  playerSel.selectAll('option').remove();
});



    posSel.on('change', () => {
      const team = teamSel.property('value');
      const pos = posSel.property('value');
      const players = currentData.filter(d =>
        (d.squad || d.Team) === team && d.pos === pos
      );

      playerSel.selectAll('option').remove();
      playerSel.append('option').attr('value', '').text('Select Player');
      players.forEach(p => {
        const name = p.player || p.Player;
        playerSel.append('option').attr('value', name).text(name);
      });

  if (posSelId === '#pos1') {
    const pos2Sel = d3.select('#pos2');
    pos2Sel.selectAll('option').remove();
    pos2Sel.append('option').attr('value', '').text('Select Position');

    const allowed = pos === 'GK' ? ['GK'] : ['DF', 'MF', 'FW'];
    allowed.forEach(p => pos2Sel.append('option').attr('value', p).text(p));


    d3.select('#player2').selectAll('option').remove();
    d3.select('#player2').append('option').attr('value', '').text('Select Player');
  }
   currentPosition = pos || 'All';
  if (posSelId === '#pos1') drawRadarBackground(pos || 'All');


  drawChart();



    });


    playerSel.on('change', () => {
  const pos = posSel.property('value');

  drawChart();
});

  }

  setup('#team1', '#pos1', '#player1');
  setup('#team2', '#pos2', '#player2');
  drawChart();
}


    function drawChart() { // 根据选择的球员绘制雷达图
      const pos1 = d3.select('#pos1').property('value');
  if (pos1 === 'GK') {
    currentPosition = 'GK';
    drawChart_GK();
  } else {
    currentPosition = pos1 || 'All';
    drawChart_FP();
  }

    }


    function drawChart_GK() { // 绘制守门员的雷达图
  const labels = ['Save','Cross Def','Throw','Pass','Long Kick','Sweeper'];
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, 180]);
  const angleSlice = (2 * Math.PI) / labels.length;
  svg.selectAll('.radar-area, .radar-stroke, .radar-circle, .diff-label, image.team-logo').remove();


  const gkOnly = currentData.filter(d => d.pos === 'GK');
  const extentMap = {
    SavePct: d3.extent(gkOnly, d => +d.SavePct),
    StpPct: d3.extent(gkOnly, d => +d.StpPct),
    Throws: d3.extent(gkOnly, d => +d.Throws),
    PassCmp: d3.extent(gkOnly, d => +d.PassCmp),
    AvgLen: d3.extent(gkOnly, d => +d.AvgLen),
    LaunchPct: d3.extent(gkOnly, d => +d.LaunchPct),
    OPA: d3.extent(gkOnly, d => +d.OPA),
    AvgDist: d3.extent(gkOnly, d => +d.AvgDist)
  };


  const scaleMap = {};
  for (const key in extentMap) {
    const [min, max] = extentMap[key];
    scaleMap[key] = d3.scaleLinear().domain([min, min === max ? min + 1 : max]).range([60, 99]);
  }

  const results = [];
  const name1 = d3.select('#player1').property('value');
  drawTeamLogo(name1);

  ['#player1','#player2'].forEach((sel, idx) => {
    const name = d3.select(sel).property('value');
    if (!name) return;
    const rec = currentData.find(d => (d.Player || d.player) === name);
    if (!rec) return;


    const C_save = scaleMap.SavePct(+rec.SavePct);
    const C_cross = scaleMap.StpPct(+rec.StpPct);
    const C_throw = scaleMap.Throws(+rec.Throws);
    const C_pass = scaleMap.PassCmp(+rec.PassCmp);

    const lenScore = scaleMap.AvgLen(+rec.AvgLen);
    const launchScore = scaleMap.LaunchPct(+rec.LaunchPct);
    const C_long = 0.7 * lenScore + 0.3 * launchScore;

    const opaScore = scaleMap.OPA(+rec.OPA);
    const distScore = scaleMap.AvgDist(+rec.AvgDist);
    const C_sweeper = 0.7 * opaScore + 0.3 * distScore;

    const vals = [C_save, C_cross, C_throw, C_pass, C_long, C_sweeper].map((v,i)=>({axis:labels[i], value:v, index:i}));
    if (vals.some(v => isNaN(v.value))) {
      console.warn("⛔NaN:", name, vals);
      return;
    }
    results[idx] = vals;

    const lineGen = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg.append('path').datum(vals)
      .attr('class','radar-area'+(idx?' compare2':''))
      .attr('d',lineGen);
    svg.append('path').datum(vals)
      .attr('class','radar-stroke'+(idx?' compare2':''))
      .attr('d',lineGen);
    svg.selectAll('.radar-circle'+(idx?'.compare2':''))
      .data(vals).enter().append('circle')
      .attr('class','radar-circle'+(idx?' compare2':''))
      .attr('r',5)
      .attr('cx',d => rScale(d.value)*Math.cos(angleSlice*d.index - Math.PI/2))
      .attr('cy',d => rScale(d.value)*Math.sin(angleSlice*d.index - Math.PI/2))
      .on('mouseover', (e, d) => {
        const overall = d3.mean(vals.map(v => v.value)).toFixed(1);
        tooltip.html(`
          <img src="${rec.player_img}" />
          <div><strong>Position:</strong> GK</div>
          <div><strong>Squad:</strong> ${rec.Team}</div>
          <div><strong>Overall:</strong> ${overall}</div>
          <div><strong>${d.axis}:</strong> ${d.value.toFixed(1)}</div>
        `)
        .style('left', e.pageX + 10 + 'px')
        .style('top', e.pageY - 20 + 'px')
        .style('opacity', 1);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
  });


  if (results[0] && results[1]) {
    results[0].forEach((d0, i) => {
      const d1 = results[1][i];
      const diff = d0.value - d1.value;
      if (diff === 0) return;
      const sign = diff > 0 ? '+' : '-';
      const txt = `${sign}${Math.abs(diff).toFixed(0)}`;
      const {x, y} = {
        x: rScale(105) * Math.cos(angleSlice * i - Math.PI / 2),
        y: rScale(105) * Math.sin(angleSlice * i - Math.PI / 2)
      };
      svg.append('text')
        .attr('class','diff-label')
        .attr('x', x + 25)
        .attr('y', y)
        .attr('fill', diff > 0 ? 'blue' : 'red')
        .text(txt);
    });
  }
}



    function drawChart_FP() { // 绘制场上球员（DF/MF/FW）的雷达图
  const radius = 180;
  const labels = ['Shooting','Pass','Defense','Dribble','Stamina','Positioning'];
  const angleSlice = (2 * Math.PI) / labels.length;
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);
  svg.selectAll('.radar-area, .radar-stroke, .radar-circle, .diff-label').remove();

  const getVal = (d, key) => isNaN(+d[key]) ? 0 : +d[key];

  const getScore = (rec) => {
    const shooting = 0.3*getVal(rec, 'sh_SoT') + 0.15*getVal(rec, 'sh_SoT%') + 0.15*getVal(rec, 'sh_G/Sh') + 0.15*getVal(rec, 'sh_Sh') + 0.15*getVal(rec, 'sh_xG') + 0.15*getVal(rec, 'sh_Dist');
    const pass = 0.25*getVal(rec, 'pas_Cmp') + 0.10*getVal(rec, 'pas_Cmp%') + 0.25*getVal(rec, 'pas_PrgDist') + 0.10*(getVal(rec, 'pas_PrgDist')/getVal(rec, 'pas_TotDist')) + 0.10*getVal(rec, 'pas_KP') + 0.10*getVal(rec, 'pas_1/3') + 0.10*getVal(rec, 'pas_PPA');
    const tkl = getVal(rec, 'def_Tkl');
    const tklW = getVal(rec, 'def_TklW');
    const clr = getVal(rec, 'def_Clr');
    const err = getVal(rec, 'def_Err');
    const tklPct = getVal(rec, 'def_Tkl%');
    const defScore = 0.3*tkl + 0.2*(tklW / (tkl || 1)) + 0.2*tklPct + 0.18*clr + 0.12*err;
    const dribble = 0.2*getVal(rec, 'pos_Succ') + 0.1*getVal(rec, 'pos_Succ%') + 0.2*getVal(rec, 'pos_PrgDist') + 0.2*getVal(rec, 'pos_PrgC') + 0.1*(getVal(rec, 'pos_PrgC')/(getVal(rec, 'pos_Carries')||1)) + 0.1*getVal(rec, 'pos_1/3') + 0.1*getVal(rec, 'pos_CPA');
    const staminaRaw = 0.65 * (getVal(rec, 'pos_Def 3rd') + getVal(rec, 'pos_Mid 3rd') + getVal(rec, 'pos_Att 3rd')) / getVal(rec, '90s') +
                      0.35 * (getVal(rec, 'def_TklDef 3rd') + getVal(rec, 'def_TklMid 3rd') + getVal(rec, 'def_TklAtt 3rd')) / getVal(rec, '90s');
    const stamina = d3.scaleLinear().domain(d3.extent(currentData.map(d => {
      return 0.65 * (getVal(d, 'pos_Def 3rd') + getVal(d, 'pos_Mid 3rd') + getVal(d, 'pos_Att 3rd')) / getVal(d, '90s') +
             0.35 * (getVal(d, 'def_TklDef 3rd') + getVal(d, 'def_TklMid 3rd') + getVal(d, 'def_TklAtt 3rd')) / getVal(d, '90s');
    }))).range([60,99])(staminaRaw);
    const isFW = currentPosition === 'FW';
    const posScore = isFW ? getVal(rec, 'pos_Att Pen') : 0.5*getVal(rec, 'def_Blocks') + 0.5*getVal(rec, 'def_Int');

    return [shooting, pass, defScore, dribble, stamina, posScore];
  }

  const extentMap = [0,1,2,3,5].map(i => d3.extent(currentData.map(d => getScore(d)[i])));
  extentMap.splice(4, 0, d3.extent(currentData.map(d => getScore(d)[4])));

  const scale = extentMap.map(ext => d3.scaleLinear().domain(ext).range([60, 99]));

  const results = [];
  const name1 = d3.select('#player1').property('value');
drawTeamLogo(name1);
  ['#player1','#player2'].forEach((sel, idx) => {
    const name = d3.select(sel).property('value');

    if (!name) return;
    const rec = currentData.find(d => (d.player || d.Player) === name);
    const scoreArr = getScore(rec);
    const vals = scoreArr.map((v,i)=>({axis: labels[i], value: scale[i](v), index: i}));
    results[idx] = vals;

    const lineGen = d3.lineRadial()
      .radius(d=>rScale(d.value))
      .angle((d,i)=>i*angleSlice)
      .curve(d3.curveLinearClosed);

    svg.append('path').datum(vals)
      .attr('class','radar-area'+(idx?' compare2':''))
      .attr('d',lineGen);
    svg.append('path').datum(vals)
      .attr('class','radar-stroke'+(idx?' compare2':''))
      .attr('d',lineGen);

    svg.selectAll('.radar-circle'+(idx?'.compare2':''))
      .data(vals).enter().append('circle')
      .attr('class','radar-circle'+(idx?' compare2':''))
      .attr('r',5)
      .attr('cx',d=>rScale(d.value)*Math.cos(angleSlice*d.index-Math.PI/2))
      .attr('cy',d=>rScale(d.value)*Math.sin(angleSlice*d.index-Math.PI/2))
      .on('mouseover', (e, d) => {
  const rec = currentData.find(r => (r.player || r.Player) === name);
  const overall = d3.mean(vals.map(v => v.value)).toFixed(1);
  tooltip.html(`
    <img src="${rec.player_img}" />
    <div><strong>Position:</strong> ${currentPosition}</div>
    <div><strong>Player:</strong> ${name}</div>
    <div><strong>Overall:</strong> ${overall}</div>
    <div><strong>${d.axis}:</strong> ${d.value.toFixed(1)}</div>
  `)
  .style('left', e.pageX + 10 + 'px')
  .style('top', e.pageY - 20 + 'px')
  .style('opacity', 1);
})

      .on('mouseout',()=>tooltip.style('opacity',0));
  });

  if (results[0] && results[1]) {
    results[0].forEach((d0, i) => {
      const d1 = results[1][i];
      const diff = d0.value - d1.value;
      if (diff === 0) return;
      const sign = diff > 0 ? '+' : '-';
      const txt = `${sign}${Math.abs(diff).toFixed(0)}`;
      const x = rScale(105) * Math.cos(angleSlice * i - Math.PI / 2);
      const y = rScale(105) * Math.sin(angleSlice * i - Math.PI / 2);
      svg.append('text')
        .attr('class','diff-label')
        .attr('x', x + 45)
        .attr('y', y)
        .attr('fill', diff > 0 ? 'blue' : 'red')
        .text(txt);
    });
  }
}
loadDataAndInit('All');
drawRadarBackground('All');


d3.select('#resetZoomFixed').on('click', () => {
  svgEl.transition().duration(500).call(zoom.transform, initialTransform);
});