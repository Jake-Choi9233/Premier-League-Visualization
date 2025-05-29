const urlParams = new URLSearchParams(window.location.search);
const DEFAULT_TEAM = urlParams.get('team') || 'All';
// 将用户在初始化界面中选择的队伍放到DEFAULT_TEAM这个变量里
// main 
playerData = preprocessData(playerData);
initializeFilters();
dataManipulation();

function preprocessData(data) {
    return data.map(player => ({
        ...player,
        "Annual Wages": Number(player["Annual Wages"]),
        "weekly_wages": Number(player["weekly_wages"]),
        "image": player["image"] || "./薪资可视化图_js/smile.jpg"
    }));
}

function initializeFilters() {
    const teamSet = new Set(playerData.map(player => player.Squad));
    const teamFilter = document.getElementById('team-filter');
    teamSet.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });

    if (teamSet.has(DEFAULT_TEAM)) {
        teamFilter.value = DEFAULT_TEAM;
    } else {
        teamFilter.value = 'All';
    }

    teamFilter.addEventListener("change", dataManipulation);

    const positionSet = new Set(["GK", "DF", "MF", "FW"]);
    const positionFilter = document.getElementById('position-filter');
    positionSet.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position;
        positionFilter.appendChild(option);
    });
    positionFilter.addEventListener("change", dataManipulation);

    document.getElementById('top-n-filter').addEventListener("change", dataManipulation);
    document.getElementById('order-by-filter').addEventListener("change", dataManipulation);
    document.getElementById('wage-type-filter').addEventListener("change", dataManipulation);
}

function updateCountryFilter(filteredPlayerData) {
    const countrySet = new Set(filteredPlayerData.map(player => player.country));
    const countryFilter = document.getElementById('country-filter');
    

    const previousSelection = countryFilter.value;
    countryFilter.innerHTML = "<option value='All'>All</option>";

    countrySet.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });

    if (countrySet.has(previousSelection)) {
        countryFilter.value = previousSelection;
    }

}

function updateWageLevelFilter(filteredPlayerData, wageType) {
    const wageFilter = document.getElementById('wage-level-filter');
    const previousSelection = wageFilter.value;
    wageFilter.innerHTML = "<option value='All'>All Levels</option>";

    const wageKey = wageType === 'Annual' ? "Annual Wages" : "weekly_wages";
    const maxWage = Math.max(...filteredPlayerData.map(player => player[wageKey]));

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
        const minLabel = (minWage / 1_000_000).toFixed(2) + "M";
        const maxLabel = (maxWage / 1_000_000).toFixed(2) + "M";
        const label = `${minLabel} - ${maxLabel}`;
        const option = document.createElement('option');
        option.value = `${minWage}-${maxWage}`;
        option.textContent = label;
        wageFilter.appendChild(option);
    });

    if (Array.from(wageFilter.options).some(opt => opt.value === previousSelection)) {
        wageFilter.value = previousSelection;
    }
}

function dataManipulation() {
    const selectedTeam = document.getElementById('team-filter').value;
    const selectedTopN = document.getElementById('top-n-filter').value;
    const selectedOrder = document.getElementById('order-by-filter').value;
    const selectedCountry = document.getElementById('country-filter').value;
    const selectedWageType = document.getElementById('wage-type-filter').value;
    const selectedPosition = document.getElementById('position-filter').value;
    const selectedWageLevel = document.getElementById('wage-level-filter').value;

    const teamFilteredData = playerData.filter(player => {
        const teamMatch = selectedTeam === 'All' || player.Squad === selectedTeam;
        const positionMatch = selectedPosition === 'All' || 
                              player.position1 === selectedPosition || 
                              player.position2 === selectedPosition;
        return teamMatch && positionMatch;
    });

    updateCountryFilter(teamFilteredData);

    updateWageLevelFilter(teamFilteredData, selectedWageType);

    let filteredPlayerData = teamFilteredData.filter(player => {
        const countryMatch = selectedCountry === 'All' || player.country === selectedCountry;
        
        if (selectedWageLevel !== 'All') {
            const [minWage, maxWage] = selectedWageLevel.split('-').map(Number);
            const wage = player[selectedWageType === 'Annual' ? "Annual Wages" : "weekly_wages"];
            return countryMatch && wage >= minWage && wage <= maxWage;
        }
        return countryMatch;
    });

    filteredPlayerData.sort((a, b) => {
        const key = selectedWageType === 'Annual' ? "Annual Wages" : "weekly_wages";
        return selectedOrder === 'descend' ? b[key] - a[key] : a[key] - b[key];
    });

    if (selectedTopN !== 'TOP N') {
        const n = parseInt(selectedTopN.replace('Top ', ''));
        filteredPlayerData = filteredPlayerData.slice(0, n);
    }

    renderBarChart(filteredPlayerData);
}


