// player.js
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('name');

    const data = await d3.json('players_data.json');
    const GK_Data = await d3.json('GK_Data.json');
    const player = data.find(p => p.player === decodeURIComponent(playerName));
    const GK_player = GK_Data.find(p => p.player === decodeURIComponent(playerName));

    if (player) {
        console.log('Player data:', player);
        renderPlayerInfo(player);
        // drawRadarChart(player);
    } else if (GK_player) {
        console.log('GK data:', GK_player);
        renderGKInfo(GK_player);
    } else {
        console.error('Player not found:', playerName);
        document.querySelector('.player-container').innerHTML = '<p>未找到该球员信息</p>';
    }
});

function renderPlayerInfo(player) {
    // 基础信息
    document.getElementById('player-img').src = player.player_img;
    document.getElementById('player-name').textContent = player.player;
    document.getElementById('player-pos').textContent = `${player.pos} - ${player.main_pos}`;
    document.getElementById('player-age').textContent = `${player.age}岁`;
    document.getElementById('player-height').textContent = `${player.height}cm`;
    document.getElementById('player-country').textContent = player.country;
    document.getElementById('player-team').textContent = player.squad;
    document.getElementById('player-wage').textContent = player.wage.split('(')[0].trim();
    document.querySelector('.team-logo').src = player.squad_img;

    // 基础数据
    document.getElementById('90s').textContent = player['90s'];
    document.getElementById('height').textContent = `${player.height}cm`;
    document.getElementById('age').textContent = player.age;

    // 切换 Tab 逻辑
    const tabs = document.querySelectorAll('.tab-nav button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');

            const target = tab.getAttribute('data-tab');
            contents.forEach(content => {
                content.classList.toggle('tab-active', content.id === target);
            });
        });
    });

    if (player.pos !== 'GK') {
        // 隐藏守门员 Tab
        document.querySelector('[data-tab="goalkeeping"]').classList.add('hidden');
        document.querySelector('.gk-stats').classList.add('hidden');

        // 核心指标
        document.getElementById('sh_xG').textContent = player.sh_xG.toFixed(1);
        document.getElementById('pas_Cmp%').textContent = `${player['pas_Cmp%']}%`;
        document.getElementById('def_Int').textContent = player.def_Int;

        // 进攻数据
        document.getElementById('sh_SoT').textContent = player.sh_SoT;
        document.getElementById('sh_SoT%').textContent = `${player['sh_SoT%']}%`;
        document.getElementById('sh_G/Sh').textContent = player['sh_G/Sh'];
        document.getElementById('sh_Sh').textContent = player.sh_Sh;
        document.getElementById('sh_Dist').textContent = `${player.sh_Dist}米`;

        // 传球数据
        document.getElementById('pas_Cmp').textContent = player.pas_Cmp;
        document.getElementById('pas_PrgDist').textContent = `${player.pas_PrgDist}米`;
        document.getElementById('pas_TotDist').textContent = `${player.pas_TotDist}米`;
        document.getElementById('pas_KP').textContent = player.pas_KP;
        document.getElementById('pas_1/3').textContent = player['pas_1/3'];

        // 防守数据
        document.getElementById('def_Tkl').textContent = player.def_Tkl;
        document.getElementById('def_TklW').textContent = player.def_TklW;
        document.getElementById('def_Tkl%').textContent = `${player['def_Tkl%']}%`;
        document.getElementById('def_Clr').textContent = player.def_Clr;
        document.getElementById('def_Err').textContent = player.def_Err;
        document.getElementById('def_Blocks').textContent = player.def_Blocks;

        // 持球数据
        document.getElementById('pos_Succ').textContent = player.pos_Succ;
        document.getElementById('pos_Succ%').textContent = `${player['pos_Succ%']}%`;
        document.getElementById('pos_PrgDist').textContent = `${player.pos_PrgDist}米`;
        document.getElementById('pos_PrgC').textContent = player.pos_PrgC;
        document.getElementById('pos_Carries').textContent = player.pos_Carries;
    } else {
        // 隐藏非守门员元素
        document.querySelector('.non-gk-stats').classList.add('hidden');
        document.querySelector('[data-tab="attack"]').style.display = 'none';
        document.querySelector('[data-tab="defense"]').style.display = 'none';
        document.querySelector('[data-tab="possession"]').style.display = 'none';
        document.querySelector('[id="attact"]').classList.add('hidden');

        // 显示守门员元素
        document.querySelector('[data-tab="goalkeeping"]').classList.remove('hidden');
        document.querySelector('.gk-stats').classList.remove('hidden');

        document.getElementById('SavePct') = player.SavePct;
        document.getElementById('OPA') = player.OPA;
        document.getElementById('StpPct') = player.StpPct;
    }

    // function translatePosition(pos) {
    //     const positions = {
    //         'CB': '中后卫',
    //         'DF': '后卫',
    //         'MF': '中场',
    //         'FW': '前锋',
    //         'GK': '守门员'
    //     };
    //     return positions[pos] || pos;
    // }

    function drawRadarChart(player) {
        // 更新雷达图指标计算以适应新数据结构
        const metrics = {
            stamina: calculateStamina(player),
            shooting: calculateShooting(player),
            control: calculateControl(player),
            passing: calculatePassing(player),
            defense: calculateDefense(player),
            special: calculateSpecial(player)
        };

        // 标准化到0-100
        const normalized = normalizeMetrics(metrics);

        // D3雷达图绘制
        const radarData = [{
            axes: Object.entries(normalized).map(([key, value]) => ({
                axis: translateLabel(key),
                value: Math.min(100, Math.max(0, value)) // 确保值在0-100范围内
            }))
        }];

        RadarChart.draw("#radar-chart", radarData, radarConfig);
    }

    // 更新指标计算函数
    function calculateStamina(p) {
        return (p['90s'] * 30) + (p.pos_PrgDist / 100 * 70);
    }

    function calculateShooting(p) {
        return (p.sh_xG * 40) + (p.sh_SoT * 30) + (p['sh_SoT%'] * 30);
    }

    function calculateControl(p) {
        return (p['pos_Succ%'] * 0.6 + p.pos_Carries * 0.4) * 1.5;
    }

    function calculatePassing(p) {
        return (p['pas_Cmp%'] * 0.5 + p.pas_KP * 0.3 + p['pas_1/3'] * 0.2) * 2;
    }

    function calculateDefense(p) {
        return (p.def_Int * 0.4 + p.def_TklW * 0.3 + p.def_Clr * 0.3) * 2.5;
    }

    function calculateSpecial(p) {
        return (p.pas_PPA + p.pos_CPA) * 10;
    }

    // 归一化函数
    function normalizeMetrics(metrics) {
        const ranges = {
            stamina: [30, 100],
            shooting: [20, 90],
            control: [40, 95],
            passing: [50, 100],
            defense: [60, 100],
            special: [30, 80]
        };

        return Object.fromEntries(
            Object.entries(metrics).map(([k, v]) => [
                k,
                Math.min(100, Math.max(0,
                    ((v - ranges[k][0]) / (ranges[k][1] - ranges[k][0])) * 100
                ))
            ])
        );
    }

    // 雷达图配置
    const radarConfig = {
        w: 400,
        h: 400,
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
        maxValue: 100,
        levels: 5,
        roundStrokes: true,
        color: d3.scaleOrdinal().range(["#3498db"]),
        format: d3.format(".0f"),
        legend: false
    };

    // 中英对照
    function translateLabel(label) {
        const translations = {
            stamina: '体能',
            shooting: '射门',
            control: '控球',
            passing: '传球',
            defense: '防守',
            special: '创造'
        };
        return translations[label] || label;
    }
}
