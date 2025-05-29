// 解析URL以获取队名
const urlParams = new URLSearchParams(window.location.search);
const teamNameFromUrl = urlParams.get('team');

if (!teamNameFromUrl) {
    console.error('队名未在URL中提供');
}

// 使用Fetch API获取Excel文件
fetch('con_merge.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
        // 使用SheetJS读取Excel文件
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // 假设数据在第一个工作表中
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 查找匹配的队名
        let teamData = null;
        const players = [];

        for (let i = 1; i < json.length; i++) { // 假设第一行是表头
            if (json[i][2] === teamNameFromUrl) { // 假设第三列是Squad（球队名字）
                const squadAnnualWages = json[i][8]; // 假设第九列是Squad Annual Wages
                const teamLogo = json[i][3]; // 假设第四列是Squad picture（球队徽标）

                teamData = {
                    name: teamNameFromUrl,
                    logo: teamLogo,
                    annual_wages: squadAnnualWages
                };

                // 收集球队的球员信息
                players.push({
                    name: json[i][0], // 球员名字
                    picture: json[i][1], // 球员图片
                    position: json[i][4], // 球员位置
                    contribution: json[i][6], // 球员贡献值
                    annual_wages: json[i][7] // 球员工资
                });
            }
        }

        if (!teamData) {
            console.error('未找到指定的球队');
            return;
        }

        // 更新HTML元素的内容
        document.getElementById('PI').innerText = players.length; 
        document.getElementById('team-logo').src = teamData.logo;
        document.getElementById('team-name').innerText = teamData.name;
        document.getElementById('squad-annual-wages').innerText = teamData.annual_wages;
        // 假设排名信息系统需要额外逻辑，这里暂时显示为"暂无数据"
        document.getElementById('team-ranking').innerText = '暂无数据';

        // 展示球队球员列表
        const playerContainer = document.getElementById('player-container');
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <img src="${player.picture}" alt="${player.name}">
                <strong>${player.name}</strong> - ${player.position}
                <p>贡献值: ${player.contribution}</p>
                <p>年薪: ${player.annual_wages}</p>
            `;
            playerContainer.appendChild(playerItem);
        });
    })
    .catch(error => console.error('Error loading team data:', error));
