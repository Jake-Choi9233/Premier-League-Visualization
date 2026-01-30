// Read team from URL
const urlParams = new URLSearchParams(window.location.search);
const teamNameFromUrl = urlParams.get('team');

if (!teamNameFromUrl) {
    console.error('Team name not provided in URL');
}

// Fetch Excel data
fetch('con_merge.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
        // Read Excel with SheetJS
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Assume first sheet
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find matching team
        let teamData = null;
        const players = [];

        for (let i = 1; i < json.length; i++) { // Assume header row at index 0
            if (json[i][2] === teamNameFromUrl) { // Column 3: Squad
                const squadAnnualWages = json[i][8]; // Column 9: Squad Annual Wages
                const teamLogo = json[i][3]; // Column 4: Squad logo

                teamData = {
                    name: teamNameFromUrl,
                    logo: teamLogo,
                    annual_wages: squadAnnualWages
                };

                // Collect player info
                players.push({
                    name: json[i][0], // Player name
                    picture: json[i][1], // Player image
                    position: json[i][4], // Player position
                    contribution: json[i][6], // Contribution
                    annual_wages: json[i][7] // Wage
                });
            }
        }

        if (!teamData) {
            console.error('Team not found');
            return;
        }

        const formatUSD = (value) => {
            if (value === null || value === undefined) return value;
            const numeric = typeof value === 'number'
                ? value
                : Number(String(value).replace(/[^0-9.-]+/g, ''));
            if (!Number.isFinite(numeric)) return value;
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(numeric);
        };

        const formatNumber = (value) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return value;
            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(numeric);
        };

        // Update UI
        document.getElementById('PI').innerText = players.length; 
        document.getElementById('team-logo').src = teamData.logo;
        document.getElementById('team-name').innerText = teamData.name;
        document.getElementById('squad-annual-wages').innerText = formatUSD(teamData.annual_wages);
        // Ranking placeholder
        document.getElementById('team-ranking').innerText = 'N/A';

        // Render roster
        const playerContainer = document.getElementById('player-container');
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <img src="${player.picture}" alt="${player.name}">
                <div class="player-meta">
                    <div class="player-name">${player.name}</div>
                    <div class="player-sub">${player.position}</div>
                    <div class="player-stats">
                        <div>Contribution: ${formatNumber(player.contribution)}</div>
                        <div>Annual Wage: ${formatUSD(player.annual_wages)}</div>
                    </div>
                </div>
            `;
            playerContainer.appendChild(playerItem);
        });
    })
    .catch(error => console.error('Error loading team data:', error));
