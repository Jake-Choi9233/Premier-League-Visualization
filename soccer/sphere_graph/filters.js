// filters.js
export let currentFilters = {
    team: 'ALL',
    position: 'ALL',
    point: 'ALL',
    minContribution: 0,
    maxContribution: 100,
    minRank: 1,
    maxRank: 500
};

// 添加过滤器相关的常量和变量
export const pointFilters = {
    'FW': ['ALL', 'ST', 'LW', 'RW', 'ST,LW', 'ST,RW', 'LW,RW'],
    'MF': ['ALL', 'CM', 'CAM', 'CDM', 'CM,CAM', 'CM,CDM', 'CAM,CDM'],
    'DF': ['ALL', 'CB', 'LB', 'RB', 'CB,LB', 'CB,RB', 'LB,RB'],
    'GK': ['GK']
};

// 更新点过滤器选项
export function updatePointFilter(position) {
    const pointFilter = document.getElementById('point-filter');
    pointFilter.innerHTML = '';
    
    const options = pointFilters[position] || ['ALL'];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        pointFilter.appendChild(optionElement);
    });
}

// 初始化所有过滤器的事件监听
export function initializeFilters(onFilterChange) {
    // 球队选择
    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        teamSelect.addEventListener('change', e => {
            currentFilters.team = e.target.value;
            onFilterChange();
        });
    }

    // 位置选择
    const positionSelect = document.getElementById('position-filter');
    if (positionSelect) {
        positionSelect.addEventListener('change', e => {
            currentFilters.position = e.target.value;
            // 更新点过滤器选项
            updatePointFilter(e.target.value);
            // 重置点过滤器为ALL
            currentFilters.point = 'ALL';
            document.getElementById('point-filter').value = 'ALL';
            onFilterChange();
        });
    }

    // 具体位置选择
    const pointSelect = document.getElementById('point-filter');
    if (pointSelect) {
        pointSelect.addEventListener('change', function(e) {
            currentFilters.point = e.target.value;
            // 确保在过滤器改变时触发重绘
            if (typeof onFilterChange === 'function') {
                onFilterChange();
            }
        });
    }

    // 贡献度范围
    const minContribution = document.getElementById('min-contribution');
    const maxContribution = document.getElementById('max-contribution');
    if (minContribution && maxContribution) {
        minContribution.addEventListener('change', e => {
            currentFilters.minContribution = parseFloat(e.target.value) || 0;
            onFilterChange();
        });
        maxContribution.addEventListener('change', e => {
            currentFilters.maxContribution = parseFloat(e.target.value) || 100;
            onFilterChange();
        });
    }

    // 贡献度排名范围
    const minRank = document.getElementById('min-rank');
    const maxRank = document.getElementById('max-rank');
    if (minRank && maxRank) {
        minRank.addEventListener('change', e => {
            currentFilters.minRank = parseInt(e.target.value) || 1;
            onFilterChange();
        });
        maxRank.addEventListener('change', e => {
            currentFilters.maxRank = parseInt(e.target.value) || 500;
            onFilterChange();
        });
    }
}

// 检查球员是否符合过滤条件
export function checkPlayerFilters(player) {
    let isVisible = true;
    
    // 球队过滤
    if (currentFilters.team !== 'ALL' && player.Squad !== currentFilters.team) {
        isVisible = false;
    }

    // 位置过滤 - 修改这部分逻辑
    if (currentFilters.position !== 'ALL') {
        // 如果选择了特定位置，只显示该位置的球员
        if (player.Pos !== currentFilters.position) {
            isVisible = false;
        }
    }

    // 具体位置过滤
    if (currentFilters.point !== 'ALL') {
        const selectedPoints = currentFilters.point.split(',');
        const playerPoints = player.DPos.split(',');
        const hasMatch = selectedPoints.some(point => playerPoints.includes(point));
        if (!hasMatch) {
            isVisible = false;
        }
    }

    // 贡献度过滤
    const contribution = parseFloat(player.contribution);
    if (contribution < currentFilters.minContribution || contribution > currentFilters.maxContribution) {
        isVisible = false;
    }

    // 贡献度排名过滤
    if (typeof player.rank === 'number') {
        if (player.rank < currentFilters.minRank || player.rank > currentFilters.maxRank) {
            isVisible = false;
        }
    }

    return isVisible;
} 