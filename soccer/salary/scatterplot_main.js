cost_effectiveness_player_data = cost_effectiveness_player_data;

initializeFilters();
dataManipulation();

function initializeFilters() {
    const teamSet = new Set(cost_effectiveness_player_data.map(player => player.Squad));
    const teamFilter = document.getElementById('team-filter');
    teamFilter.innerHTML = "<option value='All'>All</option>";
    teamSet.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });
    teamFilter.addEventListener("change", dataManipulation);

    const positionFilter = document.getElementById('position-filter');
    positionFilter.addEventListener("change", dataManipulation);

    document.getElementById('area-filter').addEventListener("change", dataManipulation);
    document.getElementById('wage-level-filter').addEventListener("change", dataManipulation);
    document.getElementById('contribution-level-filter').addEventListener("change", dataManipulation);
    document.getElementById('cost-level-filter').addEventListener("change", dataManipulation);
}

function updateAreaFilter(filteredcost_effectiveness_player_data) {
    const areaFilter = document.getElementById('area-filter');
    const previousSelection = areaFilter.value;

    areaFilter.innerHTML = "<option value='All'>All</option>";

    const fixedAreas = ["GK", "DF", "MF", "FW"];
    fixedAreas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
    });

    if (fixedAreas.includes(previousSelection)) {
        areaFilter.value = previousSelection;
    }
}

function updateWageLevelFilter(filteredcost_effectiveness_player_data) {
    const wageFilter = document.getElementById('wage-level-filter');
    const previousSelection = wageFilter.value;
    wageFilter.innerHTML = "<option value='All'>All</option>";

    const maxWage = Math.max(...filteredcost_effectiveness_player_data.map(p => p["Annual Wages"]));
    const levels = 4;
    const step = Math.ceil(maxWage / levels);
    const ranges = [];

    for (let i = 0; i < levels; i++) {
        const minWage = step * i;
        const maxWage = step * (i + 1) - 1;
        ranges.push([minWage, maxWage]);
    }

    ranges.reverse();

    ranges.forEach(([minWage, maxWage]) => {
        const label = `${(minWage / 1_000_000).toFixed(2)}M - ${(maxWage / 1_000_000).toFixed(2)}M`;
        const option = document.createElement('option');
        option.value = `${minWage}-${maxWage}`;
        option.textContent = label;
        wageFilter.appendChild(option);
    });

    if (Array.from(wageFilter.options).some(opt => opt.value === previousSelection)) {
        wageFilter.value = previousSelection;
    }
}

function updateContributionLevelFilter(filteredcost_effectiveness_player_data) {
    const contribFilter = document.getElementById('contribution-level-filter');
    const previousSelection = contribFilter.value;
    contribFilter.innerHTML = "<option value='All'>All</option>";

    const maxScore = Math.max(...filteredcost_effectiveness_player_data.map(p => p.score_100));
    const levels = 4;
    const step = Math.ceil(maxScore / levels);
    const ranges = [];

    for (let i = 0; i < levels; i++) {
        const min = step * i;
        const rawMax = (i === levels - 1) ? maxScore : step * (i + 1);
        const max = (i === levels - 1) ? Math.ceil(rawMax) : rawMax;
        ranges.push([min, max]);
    }


    ranges.reverse();

    ranges.forEach(([min, max]) => {
        const option = document.createElement('option');
        option.value = `${min}-${max}`;
        option.textContent = `${min.toFixed(0)} - ${max.toFixed(0)}`;
        contribFilter.appendChild(option);
    });


    if (Array.from(contribFilter.options).some(opt => opt.value === previousSelection)) {
        contribFilter.value = previousSelection;
    }
}


function updateCostLevelFilter(filteredcost_effectiveness_player_data) {
    const costFilter = document.getElementById('cost-level-filter');
    const previousSelection = costFilter.value;

    costFilter.innerHTML = "<option value='All'>All</option>";

    const priority = [
        "Severely undervalued",
        "Undervalued",
        "Overvalued",
        "Severely overvalued"
    ];

    const existingLevels = new Set(filteredcost_effectiveness_player_data.map(p => p["cost effectiveness level"]));

    priority.forEach(level => {
        if (existingLevels.has(level)) {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            costFilter.appendChild(option);
        }
    });

    if (existingLevels.has(previousSelection)) {
        costFilter.value = previousSelection;
    }
}

function updatePositionFilter(filteredData, selectedArea) {
    const positionFilter = document.getElementById('position-filter');
    const previousSelection = positionFilter.value;
    positionFilter.innerHTML = "<option value='All'>All</option>";

    const positionSet = new Set();
    filteredData.forEach(player => {
        const isAreaMatch = selectedArea === 'All' || player.Pos === selectedArea;
        if (isAreaMatch && player.DPos) {
            positionSet.add(player.DPos);
        }
    });

    const positionOrder = ["GK", "LB", "RB", "CB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

    const sortedPositions = Array.from(positionSet).sort((a, b) => {
        const indexA = positionOrder.indexOf(a);
        const indexB = positionOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    sortedPositions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos;
        option.textContent = pos;
        positionFilter.appendChild(option);
    });

    if (positionSet.has(previousSelection)) {
        positionFilter.value = previousSelection;
    }
}


function dataManipulation() {
    const selectedTeam = document.getElementById('team-filter').value;
    const selectedArea = document.getElementById('area-filter').value;
    const selectedPosition = document.getElementById('position-filter').value;
    const selectedWageLevel = document.getElementById('wage-level-filter').value;
    const selectedContributionLevel = document.getElementById('contribution-level-filter').value;
    const selectedCostLevel = document.getElementById('cost-level-filter').value;

    let filteredDataLevel1 = cost_effectiveness_player_data.filter(player => {
        const teamMatch = selectedTeam === 'All' || player.Squad === selectedTeam;
        const areaMatch = selectedArea === 'All' || player.Pos === selectedArea;
        return teamMatch && areaMatch;
    });

    updateAreaFilter(filteredDataLevel1);
    updatePositionFilter(filteredDataLevel1, selectedArea);

    let filteredDataLevel2 = filteredDataLevel1.filter(player => {
        return selectedPosition === 'All' || player.DPos === selectedPosition;
    });

    updateWageLevelFilter(filteredDataLevel2);
    updateContributionLevelFilter(filteredDataLevel2);
    updateCostLevelFilter(filteredDataLevel2);

    let finalFilteredData = filteredDataLevel2.filter(player => {
        let wageMatch = true;
        if (selectedWageLevel !== 'All') {
            const [minWage, maxWage] = selectedWageLevel.split('-').map(Number);
            wageMatch = player["Annual Wages"] >= minWage && player["Annual Wages"] <= maxWage;
        }

        let contribMatch = true;
        if (selectedContributionLevel !== 'All') {
            const [minScore, maxScore] = selectedContributionLevel.split('-').map(Number);
            contribMatch = player.score_100 >= minScore && player.score_100 <= maxScore;
        }

        const costMatch = selectedCostLevel === 'All' || player["cost effectiveness level"] === selectedCostLevel;

        return wageMatch && contribMatch && costMatch;
    });
    const globalZMin = d3.min(cost_effectiveness_player_data, d => d.z_score_of_distance);
    const globalZMax = d3.max(cost_effectiveness_player_data, d => d.z_score_of_distance);

    renderScatterPlot(finalFilteredData, globalZMin, globalZMax);

}

